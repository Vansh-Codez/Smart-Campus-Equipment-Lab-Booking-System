# Smart Campus Equipment & Lab Booking System

An enterprise-grade, full-stack web application engineered to replace manual paper registers used by academic institutions to book shared lab equipment (IoT kits, GPU workstations, robotics kits) and lab workstations.

---

## Architecture Overview

```
                      +---------------------------------------+
                      | React 19 + TypeScript + Tailwind CSS  |
                      |   Vite + Framer Motion + Recharts     |
                      +-------------------+-------------------+
                                          |
                        HTTP / REST (JWT) | WebSocket (/ws/slots)
                                          v
                      +-------------------+-------------------+
                      |      FastAPI Backend (Python 3.14)    |
                      |  SQLAlchemy ORM + Pydantic Validation |
                      +---------+-------------------+---------+
                                |                   |
                 CRUD / Engine  |                   | APScheduler
                                v                   v
                      +---------+---------+   +-----+-----------------+
                      | SQLite / Postgres |   | 24h Return Reminders  |
                      |   Database        |   | Overdue Escalations   |
                      +-------------------+   +-----------------------+
```

### Key Architectural Pillars
1. **Conflict-Free Slot Booking Engine**:
   - Backend overlap detection: `(start_time < existing.end_time) AND (end_time > existing.start_time)` for all active reservation statuses (`pending`, `approved`, `checked_out`, `overdue`).
   - Prevents double-booking race conditions and immediately rejects overlapping attempts with HTTP 409 Conflict.
2. **Real-Time WebSocket Slot Synchronization (`/ws/slots`)**:
   - Broadcasts real-time slot lock and availability updates instantly to all connected clients when bookings are created, reviewed, checked-out, or returned.
3. **Equipment State Machine Audit Trail**:
   - States: `available` -> `booked` -> `issued` -> `(returned -> available)` or `(overdue / under_maintenance)`.
   - Immutable audit logging in the `lifecycles` table capturing timestamps, operator IDs, and condition remarks.
4. **Automated Background Scheduling (APScheduler)**:
   - Runs every 60 seconds.
   - Automatically detects upcoming returns within 24 hours, creates notifications, and simulates email alerts.
   - Automatically escalates unreturned equipment past deadline to `overdue`, updating equipment status and alerting staff.
5. **Role-Based Access Control (RBAC)**:
   - 3 distinct user personas with customized dashboard views, permissions, and navigation.

---

## Roles & Permissions

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Student / Researcher** | Browse equipment & lab directory, filter by category/availability, view real-time calendar slots, submit booking requests with required academic justification (min 10 chars), track booking history, countdown to return deadline, cancel pending reservations. |
| **Lab Assistant / Faculty** | View pending requisitions queue, review justifications, approve or reject with comments, perform check-out inspections with condition notes and photo URLs, process returns, flag physical damage (which auto-triggers maintenance & state machine transition). |
| **System Admin** | Full access to master inventory (CRUD on equipment and labs), manage user roles (promote/demote), view Recharts analytics dashboard (KPI cards, most-booked bar chart, peak hours distribution, overdue rate trends, category utilization progress). |

---

## Pre-Seeded Demo Accounts

For immediate evaluation, the application includes a **1-Click Interactive Persona Switcher** on the top navigation bar, or you can sign in manually:

| Role | Demo Email | Password | Persona |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` | `campus123` | Alex Rivera (CS & AI Undergrad) |
| **Lab Assistant** | `assistant@campus.edu` | `campus123` | Dr. Sarah Chen (ECE Faculty / Staff) |
| **System Admin** | `admin@campus.edu` | `campus123` | Prof. Marcus Vance (Dean of Engineering) |
| **Researcher** | `researcher@campus.edu` | `campus123` | Maya Patel (Robotics Master's Student) |

---

## Directory Structure

```
Smart Campus Equipment & Lab Booking System/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT security, argon2/pbkdf2 hashing, role guards
│   │   ├── models/         # SQLAlchemy ORM (User, Lab, Equipment, Booking, Lifecycle, etc.)
│   │   ├── routes/         # REST API endpoints (auth, users, labs, equipment, bookings, etc.)
│   │   ├── schemas/        # Pydantic schemas for request/response validation
│   │   ├── services/       # APScheduler service and WebSocket ConnectionManager
│   │   ├── config.py       # App settings and environment configs
│   │   ├── database.py     # Database engine and session factory
│   │   ├── main.py         # FastAPI instance, CORS, lifespan, routes
│   │   └── seed.py         # Realistic seed dataset script
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Server launcher
├── frontend/
│   ├── src/
│   │   ├── api/            # Fetch client with auth interceptors
│   │   ├── components/     # Navbar, QuickDemoBar, ToastContainer, Skeletons, Modals
│   │   ├── context/        # AuthContext, ThemeContext, WebSocketContext
│   │   ├── pages/          # Login, Dashboard, Directory, Calendar, MyBookings, Queue, Admin
│   │   ├── types/          # TypeScript interfaces
│   │   ├── App.tsx         # Routing and layout
│   │   ├── index.css       # Tailwind CSS and theme design tokens
│   │   └── main.tsx        # React entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (auto-seeds database on first launch)
python run.py
```
- The backend will start on **`http://localhost:8000`**.
- Auto-generated Swagger UI docs: **`http://localhost:8000/docs`**.
- OpenAPI schema: **`http://localhost:8000/api/openapi.json`**.

### 2. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
- The frontend will start on **`http://localhost:5173`**.

---

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated profile

### Equipment & Labs (`/api/equipment`, `/api/labs`)
- `GET /api/equipment` — Filter equipment by category, lab, status, or search term
- `GET /api/equipment/{id}/lifecycles` — Retrieve immutable audit trail of state changes
- `POST /api/equipment` — Add new hardware resource (Admin)
- `PUT /api/equipment/{id}` — Update specs or status (Staff/Admin)
- `DELETE /api/equipment/{id}` — Decommission hardware (Admin)
- `GET /api/labs` — List all campus laboratories
- `POST /api/labs` — Create new campus lab facility (Admin)

### Bookings & Scheduling (`/api/bookings`)
- `POST /api/bookings` — Create a reservation (runs conflict validator)
- `GET /api/bookings/my` — Get user's own reservation history
- `GET /api/bookings/calendar` — Get slot schedule by equipment or lab
- `GET /api/bookings/queue` — Staff queue for pending requisitions
- `PUT /api/bookings/{id}/review` — Approve or reject requisition with remarks
- `POST /api/bookings/{id}/checkout` — Handover equipment with condition notes & photo
- `POST /api/bookings/{id}/checkin` — Inspect return and flag physical damage
- `POST /api/bookings/{id}/cancel` — Cancel pending/approved reservation

### Maintenance & Damage (`/api/maintenance`)
- `GET /api/maintenance` — List active damage tickets
- `POST /api/maintenance` — Log damage and transition unit to `under_maintenance`
- `PUT /api/maintenance/{id}` — Resolve repair ticket and restore to `available`

### Analytics Dashboard (`/api/analytics`)
- `GET /api/analytics/dashboard` — Master metrics (KPIs, most-booked hardware, peak hours distribution, overdue rate trends, category utilization)
