from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.lab import LabOut

class EquipmentBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    status: Optional[str] = "available"
    lab_id: int
    image_url: Optional[str] = None
    serial_number: Optional[str] = None
    specs: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    lab_id: Optional[int] = None
    image_url: Optional[str] = None
    serial_number: Optional[str] = None
    specs: Optional[str] = None

class EquipmentOut(EquipmentBase):
    id: int
    created_at: datetime
    lab: Optional[LabOut] = None

    class Config:
        from_attributes = True
