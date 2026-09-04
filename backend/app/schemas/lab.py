from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LabBase(BaseModel):
    name: str
    location: str
    capacity: int = 30
    description: Optional[str] = None
    department: Optional[str] = "CSE-1"

class LabCreate(LabBase):
    pass

class LabUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    department: Optional[str] = None

class LabOut(LabBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
