from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

ACADEMIC_DEPARTMENTS = [
    "CSE-1",
    "CSE-2",
    "CSE-AIML",
    "CSE-IT",
    "CSE-DS",
    "ECE"
]

class RecordVerification(BaseModel):
    matched: bool = False
    record_id: Optional[int] = None
    official_name: Optional[str] = None
    official_department: Optional[str] = None
    batch_year: Optional[str] = None
    status: Optional[str] = None
    name_matches: bool = False
    department_matches: bool = False
    message: str = "No record checked"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    department: Optional[str] = "CSE-1"
    enrollment_no: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdateRole(BaseModel):
    role: str

class UserApprovalUpdate(BaseModel):
    is_approved: bool

class UserOut(UserBase):
    id: int
    role: str
    is_approved: bool
    created_at: datetime
    record_verification: Optional[RecordVerification] = None

    class Config:
        from_attributes = True

class RegistrationResponse(BaseModel):
    message: str
    is_approved: bool
    user: UserOut
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

# Institutional Student Record Schemas
class StudentRecordBase(BaseModel):
    enrollment_no: str
    name: str
    department: str
    batch_year: Optional[str] = "2023-2027"
    status: Optional[str] = "Active Enrolled"

class StudentRecordCreate(StudentRecordBase):
    pass

class StudentRecordOut(StudentRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
