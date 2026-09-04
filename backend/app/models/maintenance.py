from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.database import Base

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    issue_description = Column(Text, nullable=False)
    reported_by = Column(String(120), nullable=False)
    resolved_status = Column(String(30), nullable=False, default="open")  # open, in_progress, resolved
    cost = Column(Float, nullable=True, default=0.0)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    equipment = relationship("Equipment", back_populates="maintenance_logs")
