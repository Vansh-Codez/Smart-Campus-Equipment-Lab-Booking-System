from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.models.booking import Booking
from app.models.equipment import Equipment
from app.models.lifecycle import Lifecycle
from app.models.maintenance import MaintenanceLog
from app.models.notification import Notification
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingReview,
    BookingCheckOut,
    BookingCheckIn,
    BookingOut
)
from app.auth.dependencies import get_current_user, require_staff_or_admin
from app.services.websocket import ws_manager

router = APIRouter(prefix="/bookings", tags=["Bookings & Slot Engine"])

def check_time_conflict(
    db: Session,
    equipment_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[int] = None
) -> Optional[Booking]:
    """
    Check if a booking overlaps with any existing booking for the equipment.
    Overlap condition: (start_time < existing.end_time) AND (end_time > existing.start_time)
    Statuses that reserve the slot: pending, approved, checked_out, overdue.
    """
    query = db.query(Booking).filter(
        Booking.equipment_id == equipment_id,
        Booking.status.in_(["pending", "approved", "checked_out", "overdue"]),
        Booking.start_time < end_time,
        Booking.end_time > start_time
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    return query.first()

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validation of times
    if booking_in.start_time >= booking_in.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be strictly after start time."
        )
    
    # 2. Check academic justification
    if not booking_in.justification or len(booking_in.justification.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A substantive academic justification (at least 10 characters) is required."
        )

    # 3. Check equipment exists & is not in maintenance
    equipment = db.query(Equipment).filter(Equipment.id == booking_in.equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Requested equipment does not exist.")
    
    if equipment.status == "under_maintenance":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This equipment is currently Under Maintenance and cannot be reserved."
        )

    # 4. Conflict detection
    conflict = check_time_conflict(db, booking_in.equipment_id, booking_in.start_time, booking_in.end_time)
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Slot conflict! '{equipment.name}' is already reserved between {conflict.start_time.strftime('%b %d, %H:%M')} and {conflict.end_time.strftime('%b %d, %H:%M')} (Status: {conflict.status})."
        )

    # 5. Create booking (Student / Researcher submissions start as 'pending')
    # If an Admin/Assistant creates it, we can auto-approve
    initial_status = "approved" if current_user.role in ["lab_assistant", "admin"] else "pending"
    booking = Booking(
        user_id=current_user.id,
        equipment_id=booking_in.equipment_id,
        start_time=booking_in.start_time,
        end_time=booking_in.end_time,
        justification=booking_in.justification.strip(),
        status=initial_status
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Broadcast real-time slot update
    await ws_manager.broadcast({
        "type": "SLOT_BOOKED",
        "booking_id": booking.id,
        "equipment_id": equipment.id,
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "status": booking.status,
        "booked_by": current_user.name
    })

    # Alert lab assistants if pending
    if initial_status == "pending":
        assistants = db.query(User).filter(User.role.in_(["lab_assistant", "admin"])).all()
        for asst in assistants:
            notif = Notification(
                user_id=asst.id,
                title="New Booking Requisition",
                message=f"{current_user.name} requested {equipment.name} from {booking.start_time.strftime('%b %d, %H:%M')} to {booking.end_time.strftime('%b %d, %H:%M')}.",
                type="booking_status"
            )
            db.add(notif)
        db.commit()

    return booking

@router.get("/my", response_model=List[BookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()

@router.get("/calendar", response_model=List[BookingOut])
def get_calendar_slots(
    equipment_id: Optional[int] = None,
    lab_id: Optional[int] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Booking).filter(
        Booking.status.in_(["pending", "approved", "checked_out", "overdue"])
    )
    if equipment_id:
        query = query.filter(Booking.equipment_id == equipment_id)
    if lab_id:
        query = query.join(Equipment).filter(Equipment.lab_id == lab_id)
    if start:
        query = query.filter(Booking.end_time >= start)
    if end:
        query = query.filter(Booking.start_time <= end)
    
    return query.order_by(Booking.start_time.asc()).all()

@router.get("/queue", response_model=List[BookingOut])
def get_requisitions_queue(
    status_filter: Optional[str] = Query("all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    query = db.query(Booking)
    if status_filter == "pending":
        query = query.filter(Booking.status == "pending")
    elif status_filter == "active":
        query = query.filter(Booking.status.in_(["approved", "checked_out", "overdue"]))
    else:
        query = query.filter(Booking.status.in_(["pending", "approved", "checked_out", "overdue"]))
    return query.order_by(Booking.created_at.desc()).all()

@router.put("/{booking_id}/review", response_model=BookingOut)
async def review_booking(
    booking_id: int,
    review_in: BookingReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot review booking with current status '{booking.status}'.")

    if review_in.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'.")

    booking.status = review_in.status
    booking.assistant_notes = review_in.assistant_notes
    booking.updated_at = datetime.utcnow()

    # If approved, update equipment state to 'booked' if currently available
    equipment = booking.equipment
    if review_in.status == "approved" and equipment.status == "available":
        equipment.status = "booked"
        lifecycle = Lifecycle(
            equipment_id=equipment.id,
            state="booked",
            updated_by=current_user.email,
            notes=f"Approved reservation #{booking.id} for student {booking.user.name}."
        )
        db.add(lifecycle)

    # Create notification for student
    decision_text = "APPROVED" if review_in.status == "approved" else "REJECTED"
    notif = Notification(
        user_id=booking.user_id,
        title=f"Booking Requisition {decision_text}",
        message=f"Your request for '{equipment.name}' was {decision_text.lower()} by {current_user.name}. Note: {review_in.assistant_notes or 'No remarks'}",
        type="booking_status"
    )
    db.add(notif)
    db.commit()
    db.refresh(booking)

    # Broadcast status
    await ws_manager.broadcast({
        "type": "BOOKING_REVIEWED",
        "booking_id": booking.id,
        "status": booking.status,
        "equipment_id": equipment.id,
        "equipment_status": equipment.status
    })

    return booking

@router.post("/{booking_id}/checkout", response_model=BookingOut)
async def checkout_equipment(
    booking_id: int,
    checkout_in: BookingCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if booking.status != "approved":
        raise HTTPException(status_code=400, detail=f"Booking must be in 'approved' status to check out. Current: '{booking.status}'")

    booking.status = "checked_out"
    booking.check_out_condition = checkout_in.check_out_condition
    booking.check_out_photo = checkout_in.check_out_photo
    if checkout_in.assistant_notes:
        booking.assistant_notes = (booking.assistant_notes or "") + f" [Check-out Note: {checkout_in.assistant_notes}]"
    booking.updated_at = datetime.utcnow()

    # Lifecycle State Machine: Issued
    equipment = booking.equipment
    equipment.status = "issued"
    lifecycle = Lifecycle(
        equipment_id=equipment.id,
        state="issued",
        updated_by=current_user.email,
        notes=f"Issued to {booking.user.name}. Condition: {checkout_in.check_out_condition}"
    )
    db.add(lifecycle)

    # Notification to student
    notif = Notification(
        user_id=booking.user_id,
        title="Equipment Checked Out",
        message=f"'{equipment.name}' has been checked out to you. Remember to return it by {booking.end_time.strftime('%b %d, %H:%M')}.",
        type="booking_status"
    )
    db.add(notif)
    db.commit()
    db.refresh(booking)

    await ws_manager.broadcast({
        "type": "EQUIPMENT_CHECKED_OUT",
        "booking_id": booking.id,
        "equipment_id": equipment.id,
        "status": "issued"
    })

    return booking

@router.post("/{booking_id}/checkin", response_model=BookingOut)
async def checkin_equipment(
    booking_id: int,
    checkin_in: BookingCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    if booking.status not in ["checked_out", "overdue"]:
        raise HTTPException(status_code=400, detail=f"Booking must be 'checked_out' or 'overdue' to return. Current: '{booking.status}'")

    booking.status = "returned"
    booking.check_in_condition = checkin_in.check_in_condition
    if checkin_in.assistant_notes:
        booking.assistant_notes = (booking.assistant_notes or "") + f" [Return Note: {checkin_in.assistant_notes}]"
    booking.updated_at = datetime.utcnow()

    equipment = booking.equipment
    if checkin_in.is_damaged:
        # Equipment flagged damaged -> Under Maintenance
        equipment.status = "under_maintenance"
        maint = MaintenanceLog(
            equipment_id=equipment.id,
            issue_description=checkin_in.damage_description or "Damage reported during check-in return inspection.",
            reported_by=current_user.email,
            resolved_status="open"
        )
        db.add(maint)

        lifecycle = Lifecycle(
            equipment_id=equipment.id,
            state="under_maintenance",
            updated_by=current_user.email,
            notes=f"Damage flagged upon return from {booking.user.name}: {checkin_in.damage_description}"
        )
        db.add(lifecycle)
    else:
        # Returned normal -> Available
        equipment.status = "available"
        lifecycle = Lifecycle(
            equipment_id=equipment.id,
            state="available",
            updated_by=current_user.email,
            notes=f"Successfully returned by {booking.user.name}. Condition: {checkin_in.check_in_condition}"
        )
        db.add(lifecycle)

    notif = Notification(
        user_id=booking.user_id,
        title="Equipment Return Recorded",
        message=f"Return of '{equipment.name}' has been processed. Thank you!",
        type="booking_status"
    )
    db.add(notif)
    db.commit()
    db.refresh(booking)

    await ws_manager.broadcast({
        "type": "EQUIPMENT_RETURNED",
        "booking_id": booking.id,
        "equipment_id": equipment.id,
        "equipment_status": equipment.status
    })

    return booking

@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    
    # Only owner or admin can cancel
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking.")

    if booking.status not in ["pending", "approved"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel booking with status '{booking.status}'.")

    booking.status = "cancelled"
    booking.updated_at = datetime.utcnow()

    equipment = booking.equipment
    if equipment and equipment.status == "booked":
        # Check if any other approved booking exists right now, otherwise make available
        equipment.status = "available"
        lifecycle = Lifecycle(
            equipment_id=equipment.id,
            state="available",
            updated_by=current_user.email,
            notes=f"Booking #{booking.id} cancelled. Equipment marked available."
        )
        db.add(lifecycle)

    db.commit()
    db.refresh(booking)

    await ws_manager.broadcast({
        "type": "BOOKING_CANCELLED",
        "booking_id": booking.id,
        "equipment_id": booking.equipment_id
    })

    return booking
