from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lab import Lab
from app.models.user import User
from app.schemas.lab import LabCreate, LabUpdate, LabOut
from app.auth.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/labs", tags=["Labs"])

@router.get("", response_model=List[LabOut])
def list_labs(db: Session = Depends(get_db)):
    return db.query(Lab).order_by(Lab.name.asc()).all()

@router.get("/{lab_id}", response_model=LabOut)
def get_lab(lab_id: int, db: Session = Depends(get_db)):
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found.")
    return lab

@router.post("", response_model=LabOut, status_code=status.HTTP_201_CREATED)
def create_lab(lab_in: LabCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(Lab).filter(Lab.name.ilike(lab_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A lab with this name already exists.")
    
    lab = Lab(
        name=lab_in.name,
        location=lab_in.location,
        capacity=lab_in.capacity,
        description=lab_in.description,
        department=lab_in.department
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab

@router.put("/{lab_id}", response_model=LabOut)
def update_lab(lab_id: int, lab_in: LabUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found.")
    
    update_data = lab_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lab, field, value)
    
    db.commit()
    db.refresh(lab)
    return lab

@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab(lab_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found.")
    
    db.delete(lab)
    db.commit()
    return None
