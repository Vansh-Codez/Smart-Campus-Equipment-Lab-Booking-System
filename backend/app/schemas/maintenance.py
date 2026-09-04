from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.equipment import EquipmentOut

class MaintenanceBase(BaseModel):
    equipment_id: int
    issue_description: str
    reported_by: str
    resolved_status: Optional[str] = "open"
    cost: Optional[float] = 0.0
    resolution_notes: Optional[str] = None

class MaintenanceCreate(BaseModel):
    equipment_id: int
    issue_description: str
    cost: Optional[float] = 0.0

class MaintenanceUpdate(BaseModel):
    resolved_status: Optional[str] = None
    cost: Optional[float] = None
    resolution_notes: Optional[str] = None

class MaintenanceOut(MaintenanceBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None
    equipment: Optional[EquipmentOut] = None

    class Config:
        from_attributes = True

class LifecycleOut(BaseModel):
    id: int
    equipment_id: int
    state: str
    timestamp: datetime
    updated_by: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True
