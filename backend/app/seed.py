from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.lab import Lab
from app.models.equipment import Equipment
from app.models.booking import Booking
from app.models.lifecycle import Lifecycle
from app.models.maintenance import MaintenanceLog
from app.models.notification import Notification
from app.models.student_record import StudentRecord
from app.auth.security import get_password_hash

def seed_student_records(db):
    if not db.query(StudentRecord).first():
        records = [
            StudentRecord(enrollment_no="0101CS211001", name="Alex Rivera", department="CSE-AIML", batch_year="2023-2027", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS211045", name="Maya Patel", department="CSE-DS", batch_year="2023-2027", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS221012", name="Rohan Sharma", department="CSE-1", batch_year="2023-2027", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS221034", name="Priya Nair", department="CSE-2", batch_year="2023-2027", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS221088", name="Kabir Mehta", department="CSE-IT", batch_year="2023-2027", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101EC221005", name="Ananya Verma", department="ECE", batch_year="2023-2027", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS231015", name="Aryan Gupta", department="CSE-AIML", batch_year="2024-2028", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS231042", name="Sneha Roy", department="CSE-DS", batch_year="2024-2028", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101EC231019", name="Devansh Joshi", department="ECE", batch_year="2024-2028", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS231099", name="Vikram Malhotra", department="CSE-1", batch_year="2024-2028", status="Active Enrolled"),
            StudentRecord(enrollment_no="0101CS231105", name="Tanvi Deshmukh", department="CSE-2", batch_year="2024-2028", status="Active Enrolled"),
        ]
        db.add_all(records)
        db.commit()

def sync_college_labs_and_equipment(db):
    """
    Populate or update database with the 19 official college laboratories (BVS Block and MMS Block)
    and realistic academic equipment across all domains.
    """
    print("Synchronizing 19 official college labs and academic equipment inventory...")

    # Clear old bookings, maintenance, lifecycles, and equipment if old default labs are present
    old_labs = db.query(Lab).filter(Lab.name.in_([
        "AI & Deep Learning Computing Lab",
        "IoT & Cyber-Physical Systems Lab",
        "Robotics & Autonomous Vehicles Studio",
        "VLSI & Microelectronics Fabrication Lab",
        "Digital Prototyping & Fabrication Workshop"
    ])).all()

    if old_labs:
        print("Migrating legacy sample labs to the 19 university labs...")
        old_lab_ids = [l.id for l in old_labs]
        old_eqs = db.query(Equipment).filter(Equipment.lab_id.in_(old_lab_ids)).all()
        old_eq_ids = [e.id for e in old_eqs]

        db.query(MaintenanceLog).filter(MaintenanceLog.equipment_id.in_(old_eq_ids)).delete(synchronize_session=False)
        db.query(Booking).filter(Booking.equipment_id.in_(old_eq_ids)).delete(synchronize_session=False)
        db.query(Lifecycle).filter(Lifecycle.equipment_id.in_(old_eq_ids)).delete(synchronize_session=False)
        db.query(Equipment).filter(Equipment.id.in_(old_eq_ids)).delete(synchronize_session=False)
        db.query(Lab).filter(Lab.id.in_(old_lab_ids)).delete(synchronize_session=False)
        db.commit()

    # Define the 20 University Labs with exact Floor Numbers
    labs_data = [
        # --- BVS BLOCK ---
        {
            "name": "Physics Lab",
            "location": "BVS Block, 3rd Floor",
            "capacity": 30,
            "department": "ECE",
            "description": "Optical benches, semiconductor laser setups, Michelson interferometers, and precision electromagnetic apparatus in BVS Block, 3rd Floor."
        },
        {
            "name": "Chemistry Lab",
            "location": "BVS Block, 2nd Floor",
            "capacity": 30,
            "department": "ECE",
            "description": "Digital spectrophotometry, pH/conductometry meters, thermostatic heating stirrers, and analytical chemistry workstations in BVS Block, 2nd Floor."
        },
        {
            "name": "Software Engineering Lab",
            "location": "BVS Block, 3rd Floor",
            "capacity": 36,
            "department": "CSE-1",
            "description": "Enterprise software design workstations, UML case tools, agile tracking smartboards, and automated test runners in BVS Block, 3rd Floor."
        },
        {
            "name": "Compiler Design Lab",
            "location": "BVS Block, 3rd Floor",
            "capacity": 32,
            "department": "CSE-1",
            "description": "LLVM and GCC compilation toolchains, Lex/Yacc tokenizers, AST syntax visualizers, and code generation testbeds in BVS Block, 3rd Floor."
        },
        {
            "name": "DBMS Lab",
            "location": "BVS Block, 3rd Floor",
            "capacity": 40,
            "department": "CSE-2",
            "description": "Enterprise Oracle, PostgreSQL, and distributed NoSQL database servers with high-IOPS storage for transaction tuning in BVS Block, 3rd Floor."
        },
        {
            "name": "Programming in Java Lab",
            "location": "BVS Block, 3rd Floor",
            "capacity": 45,
            "department": "CSE-2",
            "description": "OpenJDK 21 and IntelliJ IDEA enterprise terminals, Spring Boot microservices sandboxes, and Java runtime profilers in BVS Block, 3rd Floor."
        },
        {
            "name": "OOPS (C++) Lab",
            "location": "BVS Block, 3rd Floor",
            "capacity": 40,
            "department": "CSE-1",
            "description": "Modern C++20/23 standard library development workstations, Valgrind memory debugging consoles, and Qt design pods in BVS Block, 3rd Floor."
        },

        # --- MMS BLOCK ---
        # 2nd Floor:
        {
            "name": "Computer Network Lab",
            "location": "MMS Block, 2nd Floor",
            "capacity": 36,
            "department": "CSE-2",
            "description": "Cisco Catalyst managed switches, modular routers, Wireshark hardware packet taps, and fiber optic certifiers in MMS Block, 2nd Floor."
        },
        {
            "name": "Computational Methods Lab",
            "location": "MMS Block, 2nd Floor",
            "capacity": 32,
            "department": "CSE-AIML",
            "description": "High-precision numerical compute workstations, MATLAB/Mathematica acceleration pods, and finite-element modeling in MMS Block, 2nd Floor."
        },
        {
            "name": "IT Lab",
            "location": "MMS Block, 2nd Floor",
            "capacity": 40,
            "department": "CSE-IT",
            "description": "Full-stack cloud sandboxes, virtualization nodes, Docker container deployment stations, and web service hosts in MMS Block, 2nd Floor."
        },
        {
            "name": "CAD Lab",
            "location": "MMS Block, 2nd Floor",
            "capacity": 32,
            "department": "CSE-IT",
            "description": "NVIDIA Quadro professional 3D CAD modeling workstations, AutoCAD and SolidWorks seats with 3D space controllers in MMS Block, 2nd Floor."
        },
        {
            "name": "Cyber Security Lab",
            "location": "MMS Block, 2nd Floor",
            "capacity": 32,
            "department": "CSE-IT",
            "description": "Air-gapped Kali Linux penetration testing rigs, hardware security modules (HSM), and HackRF One software-defined radios in MMS Block, 2nd Floor."
        },
        {
            "name": "Smart Room",
            "location": "MMS Block, 2nd Floor",
            "capacity": 50,
            "department": "CSE-AIML",
            "description": "86-inch 4K UHD interactive touch smart display, Polycom AI camera tracking, and Barco ClickShare wireless presentation hub in MMS Block, 2nd Floor."
        },
        {
            "name": "DLCD Lab (Digital Logic & Circuit Design)",
            "location": "MMS Block, 2nd Floor",
            "capacity": 36,
            "department": "ECE",
            "description": "Xilinx Spartan-7 FPGA trainer boards, digital logic state analyzers, IC testers, and regulated breadboard prototyping setups in MMS Block, 2nd Floor."
        },
        {
            "name": "Programming in C Lab (PIC Lab)",
            "location": "MMS Block, 2nd Floor",
            "capacity": 45,
            "department": "CSE-1",
            "description": "High-throughput systems programming terminals, low-level GDB debugging rigs, and POSIX Linux development sandboxes in MMS Block, 2nd Floor."
        },

        # 1st Floor:
        {
            "name": "Engineering Graphics Lab",
            "location": "MMS Block, 1st Floor",
            "capacity": 36,
            "department": "CSE-1",
            "description": "Precision drafting tables with parallel motion arms, large-format A1 blueprint plotters, and digital draughting screens in MMS Block, 1st Floor."
        },
        {
            "name": "AI Lab",
            "location": "MMS Block, 1st Floor",
            "capacity": 30,
            "department": "CSE-AIML",
            "description": "NVIDIA DGX A100 tensor-core pods, RTX 4090 deep learning rigs, Jetson AGX Orin edge robotics kits, and PyTorch workstations in MMS Block, 1st Floor."
        },
        {
            "name": "Computer Centre",
            "location": "MMS Block, 1st Floor",
            "capacity": 60,
            "department": "CSE-IT",
            "description": "Central high-throughput computing cluster, campus digital examination pods, and high-speed network terminals in MMS Block, 1st Floor."
        },

        # Ground Floor:
        {
            "name": "Mechanical Workshop",
            "location": "MMS Block, Ground Floor",
            "capacity": 40,
            "department": "ECE",
            "description": "Heavy-duty precision engine lathe machines, vertical milling machines, bench drills, and multi-process welding stations in MMS Block, Ground Floor."
        },
        {
            "name": "Electrical Lab",
            "location": "MMS Block, Ground Floor",
            "capacity": 30,
            "department": "ECE",
            "description": "3-phase AC induction motor dynamometer test benches, 4-channel digital storage oscilloscopes, and regulated variac stations in MMS Block, Ground Floor."
        },
    ]

    lab_map = {}
    for l_data in labs_data:
        # Check if old name 'Programming in C Lab' exists and update its name
        if l_data["name"] == "Programming in C Lab (PIC Lab)":
            old_c = db.query(Lab).filter(Lab.name == "Programming in C Lab").first()
            if old_c:
                old_c.name = "Programming in C Lab (PIC Lab)"
                db.commit()

        lab_obj = db.query(Lab).filter(Lab.name == l_data["name"]).first()
        if not lab_obj:
            lab_obj = Lab(**l_data)
            db.add(lab_obj)
            db.commit()
            db.refresh(lab_obj)
        else:
            lab_obj.location = l_data["location"]
            lab_obj.capacity = l_data["capacity"]
            lab_obj.department = l_data["department"]
            lab_obj.description = l_data["description"]
            db.commit()
            db.refresh(lab_obj)
        lab_map[l_data["name"]] = lab_obj

    # Seed Computer Centre equipment if not yet present
    cc_lab = lab_map.get("Computer Centre")
    if cc_lab and not db.query(Equipment).filter(Equipment.lab_id == cc_lab.id).first():
        cc_eqs = [
            Equipment(
                name="Dell OptiPlex 7010 Central Computing Workstation Pod #01",
                category="Software & Dev Workstations",
                description="High-throughput campus computing node with dual-channel high-speed RAM and multi-user OS environment.",
                status="available",
                lab_id=cc_lab.id,
                serial_number="CC-WS-2001",
                specs="Intel Core i7-13700, 32GB DDR5 RAM, 1TB NVMe, Dual 24-inch FHD Displays, Windows 11 Enterprise / Ubuntu Dual Boot",
                image_url="https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&auto=format&fit=crop&q=80"
            ),
            Equipment(
                name="Digital Examination & Secure Assessment Terminal Pod #02",
                category="Software & Dev Workstations",
                description="Dedicated secure testing workstation with locked-down browser environment and biometric authentication support.",
                status="available",
                lab_id=cc_lab.id,
                serial_number="CC-WS-2002",
                specs="Intel Core i5-13400, 16GB RAM, Secure Boot TPM 2.0, Safe Exam Browser suite, Gigabit LAN",
                image_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80"
            ),
            Equipment(
                name="High-Speed Central Department Network Multifunction Station",
                category="CAD & Design Terminals",
                description="Enterprise network duplex printing, high-speed document scanning, and technical report publishing terminal.",
                status="available",
                lab_id=cc_lab.id,
                serial_number="CC-PRN-2003",
                specs="55 ppm duplex laser, 1200x1200 dpi, Gigabit Ethernet & Secure PIN print release, A3/A4 feed trays",
                image_url="https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80"
            ),
        ]
        db.add_all(cc_eqs)
        db.commit()
        for e in cc_eqs:
            db.refresh(e)
            lc = Lifecycle(
                equipment_id=e.id,
                state=e.status,
                updated_by="admin@campus.edu",
                notes=f"Commissioned into {cc_lab.name} ({cc_lab.location})."
            )
            db.add(lc)
        db.commit()

    # If equipment is already seeded for the campus labs, return
    if db.query(Equipment).filter(Equipment.category.in_([
        "Physics & Optics Labware",
        "Chemistry & Analytical Tools",
        "AI & GPU Systems",
        "Networking & Cyber Security"
    ])).count() >= 20:
        print("Academic equipment already populated.")
        return

    # Clear old equipment to re-populate cleanly
    db.query(MaintenanceLog).delete()
    db.query(Booking).delete()
    db.query(Lifecycle).delete()
    db.query(Equipment).delete()
    db.commit()

    # 40+ Detailed Equipment Across All 19 Labs
    equipments_data = [
        # --- 1. Physics Lab (BVS Block) ---
        {
            "name": "He-Ne Laser Optical Bench & Diffraction Grating Setup",
            "category": "Physics & Optics Labware",
            "description": "Precision optical rail with helium-neon 632.8nm laser source, micrometer slit adjusters, and diffraction angle scale.",
            "status": "available",
            "lab_name": "Physics Lab",
            "serial_number": "PHY-LASER-101",
            "specs": "632.8nm He-Ne Red Laser (2mW), 1.5m calibrated optical rail, 600 lines/mm grating, spatial filter assembly"
        },
        {
            "name": "50MHz Dual-Trace Cathode Ray Oscilloscope (CRO)",
            "category": "Physics & Optics Labware",
            "description": "Dual-channel cathode ray oscilloscope with time-base generator and component tester for Lissajous figure analysis.",
            "status": "available",
            "lab_name": "Physics Lab",
            "serial_number": "PHY-CRO-102",
            "specs": "Dual Channel 50MHz, 1mV/div sensitivity, XY Mode, built-in 1kHz calibrator, 8x10cm internal graticule CRT"
        },
        {
            "name": "Hall Effect Experiment Setup with Electromagnet",
            "category": "Physics & Optics Labware",
            "description": "Complete setup for measuring Hall coefficient, carrier concentration, and mobility in p/n-type germanium crystals.",
            "status": "booked",
            "lab_name": "Physics Lab",
            "serial_number": "PHY-HALL-103",
            "specs": "0-10 kGauss Electromagnet, Digital Gaussmeter (0.1G resolution), Constant Current Source 0-20mA, Ge crystal probe"
        },
        {
            "name": "Newton's Ring & Traveling Microscope Station",
            "category": "Physics & Optics Labware",
            "description": "Apparatus for measuring radius of curvature of plano-convex lenses through circular interference fringes.",
            "status": "available",
            "lab_name": "Physics Lab",
            "serial_number": "PHY-NEWTON-104",
            "specs": "Sodium vapor lamp 35W, 50mm plano-convex lens, Traveling Microscope with 0.01mm vernier resolution"
        },

        # --- 2. Chemistry Lab (BVS Block) ---
        {
            "name": "Digital UV-Visible Spectrophotometer (Double Beam)",
            "category": "Chemistry & Analytical Tools",
            "description": "Microprocessor double-beam UV-Vis spectrophotometer for chemical absorbance, transmittance, and quantitative kinetics.",
            "status": "available",
            "lab_name": "Chemistry Lab",
            "serial_number": "CHM-SPEC-201",
            "specs": "190-1100 nm wavelength range, 1.8 nm spectral bandwidth, Tungsten & Deuterium lamp, quartz cuvette set"
        },
        {
            "name": "Digital Microprocessor pH & Conductivity Meter Workstation",
            "category": "Chemistry & Analytical Tools",
            "description": "High-accuracy dual-parameter benchtop analyzer with automatic temperature compensation (ATC) and calibration.",
            "status": "available",
            "lab_name": "Chemistry Lab",
            "serial_number": "CHM-PH-202",
            "specs": "pH range 0.00-14.00 (±0.01 pH), Conductivity 0-200 mS/cm, glass combination electrode with PT-100 temp probe"
        },
        {
            "name": "Magnetic Stirrer with Digital Thermostatic Hot Plate",
            "category": "Chemistry & Analytical Tools",
            "description": "Ceramic-coated hot plate magnetic stirrer with PID temperature feedback control up to 380°C.",
            "status": "available",
            "lab_name": "Chemistry Lab",
            "serial_number": "CHM-STIR-203",
            "specs": "Max 380°C surface temp, 100-1500 RPM stirring speed, 5L maximum stirring volume, chemical-resistant ceramic top"
        },

        # --- 3. Software Engineering Lab (BVS Block) ---
        {
            "name": "Dual-Monitor Enterprise SE Development Workstation #01",
            "category": "Software & Dev Workstations",
            "description": "Dual 27-inch 1440p workstation loaded with UML modeling software, SonarQube code quality suite, and Git integration.",
            "status": "available",
            "lab_name": "Software Engineering Lab",
            "serial_number": "SE-WS-301",
            "specs": "Intel Core i7-14700, 32GB DDR5 RAM, 1TB NVMe Gen4, Dual 27-inch IPS 2K Displays, StarUML & Enterprise Architect"
        },
        {
            "name": "Jenkins CI/CD Automated Testing Server Node",
            "category": "Software & Dev Workstations",
            "description": "Dedicated build & integration server for running automated regression test suites, unit testing, and Docker builds.",
            "status": "available",
            "lab_name": "Software Engineering Lab",
            "serial_number": "SE-SRV-302",
            "specs": "AMD Ryzen 9 7900X (12 Cores), 64GB DDR5, 2TB RAID-1 SSD, Ubuntu Server 24.04 LTS, Jenkins 2.440, Docker CE"
        },

        # --- 4. Compiler Design Lab (BVS Block) ---
        {
            "name": "LLVM Toolchain & AST Syntax Analyzer Terminal #01",
            "category": "Software & Dev Workstations",
            "description": "High-performance compilation terminal configured with LLVM 18, Clang frontend, and Graphviz AST syntax tree generators.",
            "status": "available",
            "lab_name": "Compiler Design Lab",
            "serial_number": "CMP-WS-401",
            "specs": "Intel Core i7-13700, 32GB RAM, LLVM/Clang compiler framework, ANTLR4 v4.13, Graphviz visualizer"
        },
        {
            "name": "Lex & Yacc Language Engineering Workstation #02",
            "category": "Software & Dev Workstations",
            "description": "Linux development workstation dedicated to lexical analyzer generators, LALR parser construction, and intermediate code generators.",
            "status": "booked",
            "lab_name": "Compiler Design Lab",
            "serial_number": "CMP-WS-402",
            "specs": "AMD Ryzen 7 5800X, 16GB DDR4, Flex 2.6, Bison 3.8, GCC 13.2, VS Code Remote Dev environment"
        },

        # --- 5. DBMS Lab (BVS Block) ---
        {
            "name": "Oracle & PostgreSQL Enterprise Database Workstation #01",
            "category": "Software & Dev Workstations",
            "description": "Client terminal configured with Oracle Database 19c Enterprise Client, DBeaver Ultimate, and PostgreSQL 16.",
            "status": "available",
            "lab_name": "DBMS Lab",
            "serial_number": "DB-WS-501",
            "specs": "Intel Core i7-13700, 32GB RAM, 1TB NVMe, Oracle SQL Developer, pgAdmin 4, MongoDB Compass"
        },
        {
            "name": "High-IOPS Distributed NoSQL & Sharding Cluster Node",
            "category": "Software & Dev Workstations",
            "description": "Cluster node equipped for bench testing distributed database queries, Cassandra replica sets, and Redis caching.",
            "status": "available",
            "lab_name": "DBMS Lab",
            "serial_number": "DB-SRV-502",
            "specs": "Dual Intel Xeon Silver (16 Cores), 64GB ECC RAM, 4x 1TB NVMe U.2 in RAID-0 for 1M+ IOPS benchmarking"
        },

        # --- 6. Programming in Java Lab (BVS Block) ---
        {
            "name": "OpenJDK 21 & IntelliJ Ultimate Development Pod #01",
            "category": "Software & Dev Workstations",
            "description": "Dedicated Java workstation configured with JDK 17 & 21, IntelliJ IDEA Ultimate, Maven, Gradle, and JavaFX SDK.",
            "status": "available",
            "lab_name": "Programming in Java Lab",
            "serial_number": "JAV-WS-601",
            "specs": "Intel Core i5-14500, 32GB DDR5, 1TB SSD, OpenJDK 21 LTS, VisualVM Profiler, JUnit 5 test harness"
        },
        {
            "name": "Spring Boot & Microservices Sandbox Station #02",
            "category": "Software & Dev Workstations",
            "description": "Full-stack development station for building RESTful microservices, Hibernate ORM backends, and Kafka event pipelines.",
            "status": "available",
            "lab_name": "Programming in Java Lab",
            "serial_number": "JAV-WS-602",
            "specs": "AMD Ryzen 7 7700, 32GB DDR5, Docker Desktop, Postman Enterprise, Eclipse Enterprise Edition"
        },

        # --- 7. OOPS (C++) Lab (BVS Block) ---
        {
            "name": "Modern C++20 Clang/GCC STL Development Workstation #01",
            "category": "Software & Dev Workstations",
            "description": "High-speed developer workstation with Clang 17, GCC 13, CMake, and Boost C++ libraries for object-oriented systems design.",
            "status": "available",
            "lab_name": "OOPS (C++) Lab",
            "serial_number": "CPP-WS-701",
            "specs": "Intel Core i7-14700, 32GB DDR5, CLion IDE, Boost C++ 1.84, Google Test framework, Ninja build system"
        },
        {
            "name": "Valgrind Memory Profiler & Qt6 GUI Design Pod #02",
            "category": "Software & Dev Workstations",
            "description": "Object-oriented software station featuring Qt Creator 13, Valgrind leak detection, and AddressSanitizer toolchains.",
            "status": "available",
            "lab_name": "OOPS (C++) Lab",
            "serial_number": "CPP-WS-702",
            "specs": "AMD Ryzen 7 5700G, 32GB RAM, Qt 6.6 Framework, GDB 14.1, Valgrind 3.22, Clang-Tidy static analyzer"
        },

        # --- 8. Computer Network Lab (MMS Block) ---
        {
            "name": "Cisco Catalyst 2960 24-Port Managed Gigabit Switch",
            "category": "Networking & Cyber Security",
            "description": "Enterprise-grade layer-2 managed Ethernet switch configured with VLANs, 802.1Q trunking, and port security features.",
            "status": "available",
            "lab_name": "Computer Network Lab",
            "serial_number": "NET-CISCO-801",
            "specs": "24x 10/100/1000 Gigabit Ports, 2x SFP uplink ports, Cisco IOS LAN Base, Spanning Tree (RSTP/MSTP) support"
        },
        {
            "name": "Cisco 2811 Integrated Services Modular Router",
            "category": "Networking & Cyber Security",
            "description": "Modular dual-FastEthernet enterprise router with serial WAN interfaces for OSPF, EIGRP, and BGP routing protocol labs.",
            "status": "available",
            "lab_name": "Computer Network Lab",
            "serial_number": "NET-ROUT-802",
            "specs": "Dual 10/100 Ethernet, 4x HWIC Slots with WIC-2T Dual Serial WAN cards, IPBase IOS, Hardware Encryption"
        },
        {
            "name": "Wireshark Hardware Packet Sniffer & Network Tap Unit",
            "category": "Networking & Cyber Security",
            "description": "Gigabit inline passive copper network tap with dedicated packet analyzer console for deep protocol inspection.",
            "status": "booked",
            "lab_name": "Computer Network Lab",
            "serial_number": "NET-TAP-803",
            "specs": "Zero-packet-loss full duplex 10/100/1000Base-T monitoring tap, USB 3.0 capture bridge, Wireshark v4.2"
        },
        {
            "name": "Fluke CableIQ Gigabit Qualification Network Tester",
            "category": "Networking & Cyber Security",
            "description": "Handheld network technician tester for bandwidth qualification (10/100/1000/VoIP) and wiremap fault location.",
            "status": "available",
            "lab_name": "Computer Network Lab",
            "serial_number": "NET-FLUKE-804",
            "specs": "Tests Cat 5e/6/6a/Coax, Wiremap fault locator, cross-talk and impedance qualification, IntelliTone toning"
        },

        # --- 9. Computational Methods Lab (MMS Block) ---
        {
            "name": "MATLAB & Mathematica Numerical Acceleration Terminal #01",
            "category": "AI & GPU Systems",
            "description": "High-compute numerical terminal with CUDA accelerated matrix math libraries and MATLAB Optimization Toolboxes.",
            "status": "available",
            "lab_name": "Computational Methods Lab",
            "serial_number": "NUM-MAT-901",
            "specs": "Intel Core i9-13900K (24 Cores), 64GB DDR5, NVIDIA RTX 4070 12GB, MATLAB R2024a, Mathematica 14"
        },
        {
            "name": "Runge-Kutta & Finite Element Simulation Workstation #02",
            "category": "Software & Dev Workstations",
            "description": "Dedicated workstation for solving differential equations, numerical ODE/PDE modeling, and scientific visualization.",
            "status": "available",
            "lab_name": "Computational Methods Lab",
            "serial_number": "NUM-FEM-902",
            "specs": "AMD Ryzen 9 7900, 32GB RAM, SciPy / NumPy / SymPy suites, GNU Octave 9.1, Paraview 5.12"
        },

        # --- 10. IT Lab (MMS Block) ---
        {
            "name": "Full-Stack Web Development & Docker Container Terminal #01",
            "category": "Software & Dev Workstations",
            "description": "Web and cloud technologies development terminal equipped with Node.js, Python, React, and local Docker Engine.",
            "status": "available",
            "lab_name": "IT Lab",
            "serial_number": "IT-WS-1001",
            "specs": "Intel Core i7-13700, 32GB RAM, 1TB NVMe, Node.js v20, Python 3.12, Docker Compose, Postman"
        },
        {
            "name": "VMware ESXi Virtualization Server Node #02",
            "category": "Software & Dev Workstations",
            "description": "Bare-metal hypervisor node used for student virtualization, multi-OS deployment, and Linux server management.",
            "status": "available",
            "lab_name": "IT Lab",
            "serial_number": "IT-SRV-1002",
            "specs": "Dual Intel Xeon Silver 4314 (32 Cores), 128GB ECC RAM, 4x 2TB SAS SSDs, VMware ESXi 8.0, 10GbE SFP+"
        },

        # --- 11. CAD Lab (MMS Block) ---
        {
            "name": "HP Z-Series Quadro RTX 4000 3D CAD Workstation #01",
            "category": "CAD & Design Terminals",
            "description": "ISV-certified engineering workstation optimized for parametric 3D CAD assemblies and photorealistic rendering.",
            "status": "available",
            "lab_name": "CAD Lab",
            "serial_number": "CAD-HP-1101",
            "specs": "Intel Xeon W5-2465X, 64GB DDR5 ECC RAM, NVIDIA RTX 4000 Ada Generation (20GB GDDR6), Dual 4K Displays"
        },
        {
            "name": "SolidWorks & CATIA 3D Modeling Terminal with SpaceNavigator",
            "category": "CAD & Design Terminals",
            "description": "High-end modeling terminal loaded with SolidWorks 2024 and 3Dconnexion SpaceMouse 6-DOF optical controller.",
            "status": "available",
            "lab_name": "CAD Lab",
            "serial_number": "CAD-SW-1102",
            "specs": "AMD Ryzen 9 7950X, 64GB RAM, NVIDIA RTX A4500 20GB, 3Dconnexion SpaceMouse Pro 3D Controller"
        },

        # --- 12. AI Lab (MMS Block) ---
        {
            "name": "NVIDIA DGX A100 Tensor-Core Supercomputing Station",
            "category": "AI & GPU Systems",
            "description": "Flagship multi-GPU compute cluster node for training transformer models and enterprise generative AI research.",
            "status": "available",
            "lab_name": "AI Lab",
            "serial_number": "AI-DGX-1201",
            "specs": "8x NVIDIA A100 80GB SXM4, 2TB DDR4 ECC RAM, Dual AMD EPYC 7742 (128 Cores), 30TB NVMe storage pod"
        },
        {
            "name": "NVIDIA RTX 4090 Deep Learning Rig #01",
            "category": "AI & GPU Systems",
            "description": "Liquid-cooled deep learning training workstation with TensorRT and CUDA acceleration for computer vision.",
            "status": "booked",
            "lab_name": "AI Lab",
            "serial_number": "AI-RTX-1202",
            "specs": "Intel Core i9-14900K, 64GB DDR5, NVIDIA GeForce RTX 4090 24GB, 2TB PCIe 5.0 SSD, Ubuntu 24.04 LTS"
        },
        {
            "name": "NVIDIA Jetson AGX Orin 64GB Autonomous Edge AI Kit",
            "category": "AI & GPU Systems",
            "description": "Server-class AI compute development kit delivering up to 275 TOPS for autonomous robots and intelligent edge vision.",
            "status": "available",
            "lab_name": "AI Lab",
            "serial_number": "AI-JET-1203",
            "specs": "275 TOPS AI compute, 64GB 256-bit LPDDR5, 2048-core NVIDIA Ampere GPU with 64 Tensor Cores, JetPack 6.0"
        },

        # --- 13. Cyber Security Lab (MMS Block) ---
        {
            "name": "Air-Gapped Kali Linux Pen-Testing & Forensic Rig #01",
            "category": "Networking & Cyber Security",
            "description": "Physical isolated penetration testing console with hardware write-blockers for digital forensics and exploit analysis.",
            "status": "available",
            "lab_name": "Cyber Security Lab",
            "serial_number": "SEC-PEN-1301",
            "specs": "Intel Core i7-14700K, 64GB RAM, Tableau T8u Forensic USB 3.0 Bridge, Kali Linux 2024.1, Metasploit Pro"
        },
        {
            "name": "HackRF One Software-Defined Radio (SDR) Defense Kit",
            "category": "Networking & Cyber Security",
            "description": "Wideband software-defined radio transceiver kit for analyzing wireless protocols, GSM, BLE, and RF spectrum security.",
            "status": "available",
            "lab_name": "Cyber Security Lab",
            "serial_number": "SEC-SDR-1302",
            "specs": "1 MHz to 6 GHz operating frequency, 20 MHz sample rate, ANT500 telescopic antenna, GNU Radio & SDR# suites"
        },
        {
            "name": "Hardware Security Module (HSM) Cryptographic Pod",
            "category": "Networking & Cyber Security",
            "description": "FIPS 140-2 Level 3 compliant hardware cryptographic accelerator for PKI, AES/RSA key generation, and hash acceleration.",
            "status": "under_maintenance",
            "lab_name": "Cyber Security Lab",
            "serial_number": "SEC-HSM-1303",
            "specs": "Tamper-evident active zeroization enclosure, PKCS#11 API, 10,000 RSA-2048 ops/sec, secure internal key storage"
        },

        # --- 14. Smart Room (MMS Block) ---
        {
            "name": "86-Inch 4K UHD Interactive Touch Smart Board",
            "category": "Smart Classroom & AV Tech",
            "description": "Ultra-HD interactive collaborative touchscreen with 40-point touch, digital whiteboard, and wireless screen cast.",
            "status": "available",
            "lab_name": "Smart Room",
            "serial_number": "SMT-DISP-1401",
            "specs": "86\" 4K IPS Panel (3840x2160), Zero-bonding touch, Android 13 + Windows 11 OPS PC, dual 20W speakers"
        },
        {
            "name": "Polycom Studio AI Voice & Face Tracking 4K Video Bar",
            "category": "Smart Classroom & AV Tech",
            "description": "Integrated conference audio-video system with automatic speaker tracking, acoustic fence, and 6-element beamforming mic.",
            "status": "available",
            "lab_name": "Smart Room",
            "serial_number": "SMT-CAM-1402",
            "specs": "120° FOV 4K Camera, 5x digital zoom, Automatic group framing & active speaker tracking, Acoustic Fence"
        },
        {
            "name": "Barco ClickShare CX-50 Wireless Presentation Gateway",
            "category": "Smart Classroom & AV Tech",
            "description": "Dual-screen enterprise wireless presentation and conferencing system with HDMI pass-through and touchback support.",
            "status": "available",
            "lab_name": "Smart Room",
            "serial_number": "SMT-BARCO-1403",
            "specs": "4K UHD video output, Dual screen support, 2x USB-C ClickShare Conferencing Buttons, AirPlay & Miracast"
        },

        # --- 15. Mechanical Workshop (MMS Block) ---
        {
            "name": "Heavy-Duty Precision Metal Engine Lathe Machine #01",
            "category": "Workshop Tools & Machinery",
            "description": "Gear-head precision metal turning lathe with 3-jaw self-centering chuck, metric/imperial thread cutting gearbox.",
            "status": "available",
            "lab_name": "Mechanical Workshop",
            "serial_number": "MECH-LATHE-1501",
            "specs": "330mm swing over bed, 750mm center distance, 38mm spindle bore, 2HP 3-Phase Induction Motor, digital readout (DRO)"
        },
        {
            "name": "Vertical Knee-Type Milling & Drilling Machine #02",
            "category": "Workshop Tools & Machinery",
            "description": "Universal milling machine with swivel head for face milling, gear hobbing, keyway cutting, and precision boring.",
            "status": "available",
            "lab_name": "Mechanical Workshop",
            "serial_number": "MECH-MILL-1502",
            "specs": "Table size 1000x240mm, R8 spindle taper, 3-Axis Sino Digital Readout, 3HP motor with variable spindle speed"
        },
        {
            "name": "Multi-Process Arc, TIG & MIG Shielded Welding Rig",
            "category": "Workshop Tools & Machinery",
            "description": "Inverter-based industrial multi-process welding station with argon shielding gas regulator and auto-darkening helmet.",
            "status": "available",
            "lab_name": "Mechanical Workshop",
            "serial_number": "MECH-WELD-1503",
            "specs": "250A Output @ 60% Duty Cycle, SMAW / GTAW / GMAW capable, digital current display, thermal overload protection"
        },

        # --- 16. DLCD Lab (Digital Logic & Circuit Design, MMS Block) ---
        {
            "name": "Xilinx Spartan-7 FPGA Digital Logic Trainer Board #01",
            "category": "Digital Logic & Electronics",
            "description": "Comprehensive FPGA development board with onboard 7-segment displays, LEDs, toggle switches, and PMOD expansion ports.",
            "status": "available",
            "lab_name": "DLCD Lab (Digital Logic & Circuit Design)",
            "serial_number": "DLC-FPGA-1601",
            "specs": "Xilinx Spartan-7 XC7S50 FPGA, Vivado ML Standard edition support, 16 user switches, 16 LEDs, 4-digit display"
        },
        {
            "name": "32-Channel High-Speed Digital Logic State Analyzer",
            "category": "Digital Logic & Electronics",
            "description": "USB 3.0 digital logic analyzer for decoding bus transactions (I2C, SPI, UART, Parallel) up to 500 MS/s.",
            "status": "available",
            "lab_name": "DLCD Lab (Digital Logic & Circuit Design)",
            "serial_number": "DLC-LOGIC-1602",
            "specs": "32 Digital Channels, 500 MS/s sample rate, 2Gbits memory depth, protocol decoders for 40+ digital protocols"
        },
        {
            "name": "Master Digital IC Tester & Logic Probe Workstation #03",
            "category": "Digital Logic & Electronics",
            "description": "Automatic tester for verifying 74-series TTL, 40-series CMOS, RAM/ROM ICs and truth table integrity.",
            "status": "available",
            "lab_name": "DLCD Lab (Digital Logic & Circuit Design)",
            "serial_number": "DLC-ICTEST-1603",
            "specs": "40-Pin universal ZIF socket, Auto-search IC identifier, testing capability for over 3,000 digital logic IC models"
        },

        # --- 17. Electrical Lab (MMS Block) ---
        {
            "name": "3-Phase AC Induction Motor Dynamometer Test Bench",
            "category": "Digital Logic & Electronics",
            "description": "Complete test bench with 3-phase squirrel cage induction motor coupled to an eddy current brake dynamometer.",
            "status": "available",
            "lab_name": "Electrical Lab",
            "serial_number": "ELE-MOTOR-1701",
            "specs": "3-Phase 415V 3HP AC Motor, 1440 RPM, Eddy current dynamometer with load cell torque sensor, digital tachometer"
        },
        {
            "name": "100MHz 4-Channel Mixed Signal Digital Storage Oscilloscope",
            "category": "Digital Logic & Electronics",
            "description": "Benchtop digital oscilloscope featuring 1 GSa/s real-time sample rate, FFT analysis, and digital waveform recording.",
            "status": "available",
            "lab_name": "Electrical Lab",
            "serial_number": "ELE-DSO-1702",
            "specs": "100MHz bandwidth, 4 Analog Channels, 1 GSa/s sampling, 28 Mpts memory depth, 8-inch color TFT display"
        },
        {
            "name": "0-300V Regulated Variac with Digital Power Factor Meter",
            "category": "Digital Logic & Electronics",
            "description": "Continuous variable autotransformer test station with true-RMS wattmeter, voltmeter, ammeter, and power factor readout.",
            "status": "available",
            "lab_name": "Electrical Lab",
            "serial_number": "ELE-VARIAC-1703",
            "specs": "Single Phase 230V input, 0-300V 10A variable output, Digital power analyzer measuring V, I, W, VAR, PF, and Frequency"
        },

        # --- 18. Engineering Graphics Lab (MMS Block) ---
        {
            "name": "Professional Drafting Table with Precision Parallel Motion Arm",
            "category": "CAD & Design Terminals",
            "description": "Heavy-duty drafting table with tilt-adjustable melamine board, counterbalanced drafting arm, and 360° protractor head.",
            "status": "available",
            "lab_name": "Engineering Graphics Lab",
            "serial_number": "EG-DRAFT-1801",
            "specs": "Board size 1000x700mm, 0-90° tilt angle, spring counterbalance drafting arm, metric scales and locking knobs"
        },
        {
            "name": "27-Inch 4K AutoCAD Engineering Graphics Workstation",
            "category": "CAD & Design Terminals",
            "description": "High-fidelity graphics drafting workstation calibrated for 2D orthographic projections, isometric diagrams, and section views.",
            "status": "available",
            "lab_name": "Engineering Graphics Lab",
            "serial_number": "EG-CAD-1802",
            "specs": "Intel Core i7-13700, 32GB RAM, NVIDIA RTX 3060 12GB, 27\" 4K IPS 100% sRGB Display, AutoCAD 2024, DraftSight"
        },
        {
            "name": "A1 Large-Format Engineering Drawing Blueprint Plotter",
            "category": "CAD & Design Terminals",
            "description": "High-resolution thermal inkjet technical plotter for printing full-scale engineering diagrams, architectural schematics, and plans.",
            "status": "available",
            "lab_name": "Engineering Graphics Lab",
            "serial_number": "EG-PLOT-1803",
            "specs": "24-inch (A1) roll feed, 2400x1200 optimized dpi, 30 sec/A1 page speed, HP-GL/2 & raster print language support"
        },

        # --- 19. Programming in C Lab (PIC Lab) (MMS Block, 2nd Floor) ---
        {
            "name": "GCC/Clang Low-Level Systems Programming Terminal #01",
            "category": "Software & Dev Workstations",
            "description": "Linux terminal dedicated to C systems programming, pointer manipulation, memory architecture, and POSIX system calls.",
            "status": "available",
            "lab_name": "Programming in C Lab (PIC Lab)",
            "serial_number": "C-WS-1901",
            "specs": "Intel Core i5-13400, 16GB RAM, 512GB NVMe, Ubuntu Linux 24.04 LTS, GCC 13, Clang 17, Vim, VS Code, GDB"
        },
        {
            "name": "GDB & Valgrind Memory Profiling Linux Terminal #02",
            "category": "Software & Dev Workstations",
            "description": "Student programming terminal loaded with low-level memory inspection tools, heap analyzers, and C standard libraries.",
            "status": "available",
            "lab_name": "Programming in C Lab (PIC Lab)",
            "serial_number": "C-WS-1902",
            "specs": "Intel Core i5-13400, 16GB RAM, GDB with GDBGUI graphical interface, Valgrind Memcheck suite, GNU Make"
        },

        # --- 20. Computer Centre (MMS Block, 1st Floor) ---
        {
            "name": "Dell OptiPlex 7010 Central Computing Workstation Pod #01",
            "category": "Software & Dev Workstations",
            "description": "High-throughput campus computing node with dual-channel high-speed RAM and multi-user OS environment.",
            "status": "available",
            "lab_name": "Computer Centre",
            "serial_number": "CC-WS-2001",
            "specs": "Intel Core i7-13700, 32GB DDR5 RAM, 1TB NVMe, Dual 24-inch FHD Displays, Windows 11 Enterprise / Ubuntu Dual Boot"
        },
        {
            "name": "Digital Examination & Secure Assessment Terminal Pod #02",
            "category": "Software & Dev Workstations",
            "description": "Dedicated secure testing workstation with locked-down browser environment and biometric authentication support.",
            "status": "available",
            "lab_name": "Computer Centre",
            "serial_number": "CC-WS-2002",
            "specs": "Intel Core i5-13400, 16GB RAM, Secure Boot TPM 2.0, Safe Exam Browser suite, Gigabit LAN"
        },
        {
            "name": "High-Speed Central Department Network Multifunction Station",
            "category": "CAD & Design Terminals",
            "description": "Enterprise network duplex printing, high-speed document scanning, and technical report publishing terminal.",
            "status": "available",
            "lab_name": "Computer Centre",
            "serial_number": "CC-PRN-2003",
            "specs": "55 ppm duplex laser, 1200x1200 dpi, Gigabit Ethernet & Secure PIN print release, A3/A4 feed trays"
        },
    ]

    equipments_created = []
    for eq_info in equipments_data:
        lab_ref = lab_map.get(eq_info["lab_name"])
        if not lab_ref:
            continue
        eq_item = Equipment(
            name=eq_info["name"],
            category=eq_info["category"],
            description=eq_info["description"],
            status=eq_info["status"],
            lab_id=lab_ref.id,
            serial_number=eq_info["serial_number"],
            specs=eq_info["specs"],
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80"
        )
        db.add(eq_item)
        equipments_created.append(eq_item)

    db.commit()
    for e in equipments_created:
        db.refresh(e)

    # Commissioning Lifecycle Entries
    for e in equipments_created:
        lc = Lifecycle(
            equipment_id=e.id,
            state=e.status,
            updated_by="admin@campus.edu",
            notes=f"Commissioned into {e.lab.name} ({e.lab.location}). Status: {e.status}"
        )
        db.add(lc)
    db.commit()

    # Sample Bookings for Dashboard & Calendar Slots
    student = db.query(User).filter(User.email == "student@campus.edu").first()
    researcher = db.query(User).filter(User.email == "researcher@campus.edu").first()
    now = datetime.utcnow()

    if student and len(equipments_created) >= 10:
        # 1. Past completed booking
        b1 = Booking(
            user_id=student.id,
            equipment_id=equipments_created[0].id, # He-Ne Laser
            start_time=now - timedelta(days=2, hours=3),
            end_time=now - timedelta(days=2),
            justification="Coursework experiment on optical grating wavelength calculation in Physics Lab (BVS Block).",
            status="returned",
            check_out_condition="Laser rail and diffraction grating aligned and intact.",
            check_in_condition="Optics verified clean, laser diode tested, stored in padded optical case.",
            assistant_notes="Verified by Dr. Sarah Chen.",
            created_at=now - timedelta(days=4)
        )
        # 2. Active checked-out booking
        b2 = Booking(
            user_id=student.id,
            equipment_id=equipments_created[2].id, # Hall Effect setup
            start_time=now - timedelta(hours=2),
            end_time=now + timedelta(hours=2),
            justification="Magnetic field vs Hall voltage calibration lab assignment.",
            status="checked_out",
            check_out_condition="Electromagnet calibrated with current probe in Room BVS-101.",
            created_at=now - timedelta(days=1)
        )
        # 3. Active AI Lab booking
        ai_eq = next((e for e in equipments_created if "RTX 4090" in e.name), equipments_created[10])
        b3 = Booking(
            user_id=student.id,
            equipment_id=ai_eq.id,
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=5),
            justification="Deep learning model training run for coursework capstone.",
            status="approved",
            created_at=now - timedelta(hours=6)
        )
        # 4. Networking equipment booking
        net_eq = next((e for e in equipments_created if "Wireshark" in e.name), equipments_created[8])
        b4 = Booking(
            user_id=researcher.id if researcher else student.id,
            equipment_id=net_eq.id,
            start_time=now + timedelta(days=1, hours=2),
            end_time=now + timedelta(days=1, hours=6),
            justification="Network packet analysis & TCP handshake verification in MMS-101.",
            status="pending",
            created_at=now - timedelta(hours=3)
        )
        db.add_all([b1, b2, b3, b4])

    # Sample Maintenance Log
    maint_eq = next((e for e in equipments_created if e.status == "under_maintenance"), equipments_created[0])
    m_log = MaintenanceLog(
        equipment_id=maint_eq.id,
        issue_description="Tamper detection sensor triggered during routine calibration in MMS-203. Requires hardware reset.",
        reported_by="assistant@campus.edu",
        resolved_status="open",
        cost=75.0,
        created_at=now - timedelta(days=1)
    )
    db.add(m_log)
    db.commit()

    print(f"Successfully seeded {len(labs_data)} college laboratories and {len(equipments_created)} equipment items!")

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Users
    default_password = get_password_hash("campus123")

    admin = db.query(User).filter(User.email == "admin@campus.edu").first()
    if not admin:
        admin = User(
            name="Prof. Marcus Vance",
            email="admin@campus.edu",
            password_hash=default_password,
            role="admin",
            department="CSE-1",
            is_approved=True
        )
        db.add(admin)

    assistant = db.query(User).filter(User.email == "assistant@campus.edu").first()
    if not assistant:
        assistant = User(
            name="Dr. Sarah Chen",
            email="assistant@campus.edu",
            password_hash=default_password,
            role="lab_assistant",
            department="ECE",
            is_approved=True
        )
        db.add(assistant)

    student = db.query(User).filter(User.email == "student@campus.edu").first()
    if not student:
        student = User(
            name="Alex Rivera",
            email="student@campus.edu",
            password_hash=default_password,
            role="student",
            department="CSE-AIML",
            enrollment_no="0101CS211001",
            is_approved=True
        )
        db.add(student)

    researcher = db.query(User).filter(User.email == "researcher@campus.edu").first()
    if not researcher:
        researcher = User(
            name="Maya Patel",
            email="researcher@campus.edu",
            password_hash=default_password,
            role="student",
            department="CSE-DS",
            enrollment_no="0101CS211045",
            is_approved=True
        )
        db.add(researcher)

    db.commit()

    # 2. Student Registry
    seed_student_records(db)

    # 3. 19 College Laboratories and Equipment Inventory
    sync_college_labs_and_equipment(db)

    db.close()
