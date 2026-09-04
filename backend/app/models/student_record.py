from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class StudentRecord(Base):
    __tablename__ = "student_records"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)  # CSE-1, CSE-2, CSE-AIML, CSE-IT, CSE-DS, ECE
    batch_year = Column(String(20), nullable=False, default="2023-2027")
    status = Column(String(30), nullable=False, default="Active Enrolled")  # Active Enrolled, Graduated, Suspended
    created_at = Column(DateTime, default=datetime.utcnow)
