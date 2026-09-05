from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.maintenance import MaintenanceLog
from app.models.equipment import Equipment
from app.models.lifecycle import Lifecycle
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.auth.dependencies import require_staff_or_admin, get_current_user
from app.services.websocket import ws_manager

router = APIRouter(prefix="/maintenance", tags=["Maintenance & Damage Logs"])

@router.get("", response_model=List[MaintenanceOut])
def list_maintenance_records(
    resolved_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    query = db.query(MaintenanceLog)
    if resolved_status and resolved_status != "all":
        query = query.filter(MaintenanceLog.resolved_status == resolved_status)
    return query.order_by(MaintenanceLog.created_at.desc()).all()

@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
async def create_maintenance_record(
    maint_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    equipment = db.query(Equipment).filter(Equipment.id == maint_in.equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found.")

    maint = MaintenanceLog(
        equipment_id=maint_in.equipment_id,
        issue_description=maint_in.issue_description,
        reported_by=current_user.email,
        resolved_status="open",
        cost=maint_in.cost or 0.0
    )
    db.add(maint)

    # Transition equipment status to 'under_maintenance'
    old_status = equipment.status
    equipment.status = "under_maintenance"

    # Add lifecycle audit
    lifecycle = Lifecycle(
        equipment_id=equipment.id,
        state="under_maintenance",
        updated_by=current_user.email,
        notes=f"Flagged for maintenance: {maint_in.issue_description} (Previous state: {old_status})"
    )
    db.add(lifecycle)
    db.commit()
    db.refresh(maint)

    await ws_manager.broadcast({
        "type": "EQUIPMENT_STATUS_CHANGED",
        "equipment_id": equipment.id,
        "status": "under_maintenance"
    })

    return maint

@router.put("/{maint_id}", response_model=MaintenanceOut)
async def update_maintenance_record(
    maint_id: int,
    maint_in: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    maint = db.query(MaintenanceLog).filter(MaintenanceLog.id == maint_id).first()
    if not maint:
        raise HTTPException(status_code=404, detail="Maintenance log not found.")

    if maint_in.resolved_status:
        maint.resolved_status = maint_in.resolved_status
    if maint_in.cost is not None:
        maint.cost = maint_in.cost
    if maint_in.resolution_notes:
        maint.resolution_notes = maint_in.resolution_notes

    if maint_in.resolved_status == "resolved":
        maint.resolved_at = datetime.utcnow()
        # Mark equipment back to available
        equipment = maint.equipment
        if equipment:
            equipment.status = "available"
            lifecycle = Lifecycle(
                equipment_id=equipment.id,
                state="available",
                updated_by=current_user.email,
                notes=f"Maintenance resolved: {maint_in.resolution_notes or 'Repairs completed.'}"
            )
            db.add(lifecycle)
            await ws_manager.broadcast({
                "type": "EQUIPMENT_STATUS_CHANGED",
                "equipment_id": equipment.id,
                "status": "available"
            })

    db.commit()
    db.refresh(maint)
    return maint
