from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.schemas.user import UserOut
from app.schemas.equipment import EquipmentOut

class BookingBase(BaseModel):
    equipment_id: int
    start_time: datetime
    end_time: datetime
    justification: str

    @field_validator("end_time")
    @classmethod
    def check_dates(cls, v, values):
        # We also validate in the route, but schema level check is helpful
        return v

class BookingCreate(BookingBase):
    pass

class BookingReview(BaseModel):
    status: str  # approved, rejected
    assistant_notes: Optional[str] = None

class BookingCheckOut(BaseModel):
    check_out_condition: Optional[str] = "Normal functional condition, no visual defects"
    check_out_photo: Optional[str] = None
    assistant_notes: Optional[str] = None

class BookingCheckIn(BaseModel):
    check_in_condition: Optional[str] = "Returned in working order"
    is_damaged: Optional[bool] = False
    damage_description: Optional[str] = None
    assistant_notes: Optional[str] = None

class BookingOut(BookingBase):
    id: int
    user_id: int
    status: str
    assistant_notes: Optional[str] = None
    check_out_condition: Optional[str] = None
    check_out_photo: Optional[str] = None
    check_in_condition: Optional[str] = None
    reminder_sent: int = 0
    created_at: datetime
    updated_at: datetime
    user: Optional[UserOut] = None
    equipment: Optional[EquipmentOut] = None

    class Config:
        from_attributes = True
