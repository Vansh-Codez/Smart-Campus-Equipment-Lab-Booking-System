from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    location = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False, default=30)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=True, default="CSE-1")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    equipment = relationship("Equipment", back_populates="lab", cascade="all, delete-orphan")
