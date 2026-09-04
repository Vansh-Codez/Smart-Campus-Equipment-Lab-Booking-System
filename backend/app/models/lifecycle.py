from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Lifecycle(Base):
    __tablename__ = "lifecycles"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    state = Column(String(40), nullable=False)  # available, booked, issued, under_maintenance, overdue
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    updated_by = Column(String(120), nullable=False)  # User email or 'System'
    notes = Column(Text, nullable=True)

    # Relationships
    equipment = relationship("Equipment", back_populates="lifecycles")
