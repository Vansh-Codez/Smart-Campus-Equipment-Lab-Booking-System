from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, RegistrationResponse, ACADEMIC_DEPARTMENTS
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email_clean = user_in.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    
    assigned_role = user_in.role if user_in.role in ["student", "lab_assistant", "admin"] else "student"
    department = user_in.department if user_in.department in ACADEMIC_DEPARTMENTS else "CSE-1"

    enrollment_no = (user_in.enrollment_no or "").strip() if user_in.enrollment_no else None
    
    if assigned_role == "student":
        if not enrollment_no:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student enrollment number is mandatory for registration."
            )
        existing_enroll = db.query(User).filter(User.enrollment_no == enrollment_no).first()
        if existing_enroll:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with enrollment number '{enrollment_no}' is already registered."
            )

    # Students and newly self-registered accounts require administrator approval
    is_approved = False

    new_user = User(
        name=user_in.name.strip(),
        email=email_clean,
        password_hash=get_password_hash(user_in.password),
        role=assigned_role,
        department=department,
        enrollment_no=enrollment_no,
        is_approved=is_approved
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return RegistrationResponse(
        message="Registration request submitted successfully! Your account is pending administrator approval. The admin will verify your student enrollment in academic records before activating access.",
        is_approved=False,
        user=UserOut.model_validate(new_user),
        access_token=None,
        token_type="bearer"
    )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    email_clean = login_data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending administrator approval. An administrator must verify your student enrollment in institutional records before granting access.",
        )
    
    token = create_access_token(subject=user.id, role=user.role)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
