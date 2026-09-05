import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.seed import seed_database
from app.services.scheduler import start_scheduler, stop_scheduler
from app.services.websocket import ws_manager
from app.routes import (
    auth,
    users,
    labs,
    equipment,
    bookings,
    maintenance,
    notifications,
    analytics,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("smart_campus")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    from app.database import run_migrations
    run_migrations()
    logger.info("Seeding initial dataset if required...")
    seed_database()
    logger.info("Starting background scheduler...")
    start_scheduler()
    yield
    # Shutdown
    logger.info("Stopping background scheduler...")
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint for live slot updates & broadcast notifications
@app.websocket("/ws/slots")
async def websocket_slots_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Keep connection open and respond to heartbeats or client pings
        while True:
            data = await websocket.receive_text()
            # Echo or process client events
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(labs.router, prefix=settings.API_V1_STR)
app.include_router(equipment.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(maintenance.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "scheduler": "active"
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Access Swagger UI docs at /docs."
    }
