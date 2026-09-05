from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.equipment import Equipment
from app.models.lab import Lab
from app.models.lifecycle import Lifecycle
from app.models.user import User
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentOut
from app.schemas.maintenance import LifecycleOut
from app.auth.dependencies import require_admin, require_staff_or_admin, get_current_user
from app.services.websocket import ws_manager

router = APIRouter(prefix="/equipment", tags=["Equipment Directory"])

@router.get("", response_model=List[EquipmentOut])
def list_equipment(
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    lab_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Equipment)
    if category and category != "All":
        query = query.filter(Equipment.category == category)
    if status_filter and status_filter != "All":
        query = query.filter(Equipment.status == status_filter)
    if lab_id:
        query = query.filter(Equipment.lab_id == lab_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Equipment.name.ilike(search_fmt),
                Equipment.description.ilike(search_fmt),
                Equipment.serial_number.ilike(search_fmt),
                Equipment.specs.ilike(search_fmt)
            )
        )
    return query.order_by(Equipment.id.asc()).all()

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Equipment.category).distinct().all()
    return [c[0] for c in cats if c[0]]

@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment_detail(equipment_id: int, db: Session = Depends(get_db)):
    item = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    return item

@router.get("/{equipment_id}/lifecycles", response_model=List[LifecycleOut])
def get_equipment_lifecycles(equipment_id: int, db: Session = Depends(get_db)):
    item = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    return db.query(Lifecycle).filter(Lifecycle.equipment_id == equipment_id).order_by(Lifecycle.timestamp.desc()).all()

@router.post("", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    eq_in: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lab = db.query(Lab).filter(Lab.id == eq_in.lab_id).first()
    if not lab:
        raise HTTPException(status_code=400, detail="Specified Lab ID does not exist.")
    
    if eq_in.serial_number:
        existing = db.query(Equipment).filter(Equipment.serial_number == eq_in.serial_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Equipment with this serial number already exists.")
    
    item = Equipment(
        name=eq_in.name,
        category=eq_in.category,
        description=eq_in.description,
        status="available",
        lab_id=eq_in.lab_id,
        image_url=eq_in.image_url,
        serial_number=eq_in.serial_number,
        specs=eq_in.specs
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Add initial lifecycle entry
    lifecycle = Lifecycle(
        equipment_id=item.id,
        state="available",
        updated_by=current_user.email,
        notes="Initial item commissioning into inventory."
    )
    db.add(lifecycle)
    db.commit()

    await ws_manager.broadcast({
        "type": "EQUIPMENT_CREATED",
        "equipment_id": item.id,
        "name": item.name
    })

    return item

@router.put("/{equipment_id}", response_model=EquipmentOut)
async def update_equipment(
    equipment_id: int,
    eq_in: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    item = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    
    update_data = eq_in.model_dump(exclude_unset=True)
    status_changed = "status" in update_data and update_data["status"] != item.status
    old_status = item.status

    for field, value in update_data.items():
        setattr(item, field, value)
    
    if status_changed:
        lifecycle = Lifecycle(
            equipment_id=item.id,
            state=item.status,
            updated_by=current_user.email,
            notes=f"Manual status update from '{old_status}' to '{item.status}'."
        )
        db.add(lifecycle)

    db.commit()
    db.refresh(item)

    if status_changed:
        await ws_manager.broadcast({
            "type": "EQUIPMENT_STATUS_CHANGED",
            "equipment_id": item.id,
            "status": item.status
        })

    return item

@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    item = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    
    db.delete(item)
    db.commit()

    await ws_manager.broadcast({
        "type": "EQUIPMENT_DELETED",
        "equipment_id": equipment_id
    })

    return None
