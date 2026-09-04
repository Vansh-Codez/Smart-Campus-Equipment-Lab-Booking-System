from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(80), nullable=False, index=True)  # IoT Kits, GPU Workstations, Robotics Kits, Lab Workstations, Measurement & Sensors
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="available")  # available, booked, issued, under_maintenance, overdue
    lab_id = Column(Integer, ForeignKey("labs.id"), nullable=False)
    image_url = Column(String(500), nullable=True)
    serial_number = Column(String(80), unique=True, nullable=True)
    specs = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lab = relationship("Lab", back_populates="equipment")
    bookings = relationship("Booking", back_populates="equipment", cascade="all, delete-orphan")
    lifecycles = relationship("Lifecycle", back_populates="equipment", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="equipment", cascade="all, delete-orphan")
