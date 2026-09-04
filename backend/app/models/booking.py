from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    justification = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="pending")  # pending, approved, rejected, cancelled, checked_out, returned, overdue
    assistant_notes = Column(Text, nullable=True)
    check_out_condition = Column(Text, nullable=True)
    check_out_photo = Column(String(500), nullable=True)
    check_in_condition = Column(Text, nullable=True)
    reminder_sent = Column(Integer, default=0)  # 0: not sent, 1: 24h reminder sent
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bookings")
    equipment = relationship("Equipment", back_populates="bookings")
