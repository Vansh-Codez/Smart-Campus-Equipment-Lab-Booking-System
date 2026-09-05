from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.student_record import StudentRecord
from app.models.notification import Notification
from app.schemas.user import (
    UserOut,
    UserUpdateRole,
    UserApprovalUpdate,
    RecordVerification,
    StudentRecordOut,
    StudentRecordCreate,
)
from app.auth.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users Management"])

def attach_record_verification(user: User, db: Session) -> UserOut:
    user_out = UserOut.model_validate(user)
    if user.enrollment_no:
        clean_enroll = user.enrollment_no.strip().upper()
        record = db.query(StudentRecord).filter(StudentRecord.enrollment_no == clean_enroll).first()
        if record:
            user_name_lower = user.name.lower().strip()
            rec_name_lower = record.name.lower().strip()
            name_matches = user_name_lower in rec_name_lower or rec_name_lower in user_name_lower
            dept_matches = (user.department or "").strip().upper() == record.department.strip().upper()

            msg_parts = []
            if not name_matches:
                msg_parts.append(f"Name mismatch (Registry: {record.name})")
            if not dept_matches:
                msg_parts.append(f"Dept mismatch (Registry: {record.department})")
            if not msg_parts:
                msg_parts.append("Official record verified & active")

            user_out.record_verification = RecordVerification(
                matched=True,
                record_id=record.id,
                official_name=record.name,
                official_department=record.department,
                batch_year=record.batch_year,
                status=record.status,
                name_matches=name_matches,
                department_matches=dept_matches,
                message="; ".join(msg_parts)
            )
        else:
            user_out.record_verification = RecordVerification(
                matched=False,
                message=f"Enrollment number '{user.enrollment_no}' not found in campus registry"
            )
    else:
        user_out.record_verification = RecordVerification(
            matched=False,
            message="No enrollment number registered"
        )
    return user_out

@router.get("", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    users = db.query(User).order_by(User.id.asc()).all()
    return [attach_record_verification(u, db) for u in users]

@router.put("/{user_id}/approve", response_model=UserOut)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user.is_approved = True
    
    # Send welcoming notification to student
    notif = Notification(
        user_id=user.id,
        title="Portal Access Approved",
        message=f"Your account registration has been verified and approved by {current_user.name}. You may now book equipment and reserve labs.",
        type="info",
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(user)
    return attach_record_verification(user, db)

@router.put("/{user_id}/approval", response_model=UserOut)
def update_user_approval(
    user_id: int,
    approval_data: UserApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot alter your own approval status.")

    user.is_approved = approval_data.is_approved
    db.commit()
    db.refresh(user)
    return attach_record_verification(user, db)

@router.put("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_data: UserUpdateRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if role_data.role not in ["student", "lab_assistant", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.id == current_user.id and role_data.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot change your own admin role.")

    user.role = role_data.role
    db.commit()
    db.refresh(user)
    return attach_record_verification(user, db)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")

    db.delete(user)
    db.commit()
    return None

# Institutional Student Records Management
@router.get("/student-records", response_model=List[StudentRecordOut])
def get_student_records(
    search: Optional[str] = Query(None, description="Search by name, enrollment no., or department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(StudentRecord)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (StudentRecord.enrollment_no.ilike(search_term)) |
            (StudentRecord.name.ilike(search_term)) |
            (StudentRecord.department.ilike(search_term))
        )
    return query.order_by(StudentRecord.enrollment_no.asc()).all()

@router.post("/student-records", response_model=StudentRecordOut, status_code=status.HTTP_201_CREATED)
def create_student_record(
    record_in: StudentRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    clean_enroll = record_in.enrollment_no.strip().upper()
    existing = db.query(StudentRecord).filter(StudentRecord.enrollment_no == clean_enroll).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Student record with enrollment number '{clean_enroll}' already exists."
        )
    
    new_record = StudentRecord(
        enrollment_no=clean_enroll,
        name=record_in.name.strip(),
        department=record_in.department.strip(),
        batch_year=record_in.batch_year or "2023-2027",
        status=record_in.status or "Active Enrolled"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
