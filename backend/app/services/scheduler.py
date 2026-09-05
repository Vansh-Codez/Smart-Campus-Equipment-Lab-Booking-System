import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.booking import Booking
from app.models.equipment import Equipment
from app.models.lifecycle import Lifecycle
from app.models.notification import Notification
from app.models.user import User
from app.services.websocket import ws_manager

logger = logging.getLogger("smart_campus.scheduler")
scheduler = AsyncIOScheduler()

async def check_due_reminders_and_overdue():
    """Background task to check return reminders and overdue equipment."""
    db: Session = SessionLocal()
    now = datetime.utcnow()
    try:
        # 1. Check for 24h return reminders on approved or checked_out bookings
        reminder_window = now + timedelta(hours=24)
        upcoming_bookings = (
            db.query(Booking)
            .filter(
                Booking.status.in_(["approved", "checked_out"]),
                Booking.end_time <= reminder_window,
                Booking.end_time > now,
                Booking.reminder_sent == 0,
            )
            .all()
        )

        for booking in upcoming_bookings:
            booking.reminder_sent = 1
            equipment_name = booking.equipment.name if booking.equipment else f"Equipment #{booking.equipment_id}"
            
            # Create user notification
            hours_left = max(1, int((booking.end_time - now).total_seconds() // 3600))
            notif = Notification(
                user_id=booking.user_id,
                title="Return Deadline Approaching",
                message=f"Reminder: You have approximately {hours_left} hour(s) left for '{equipment_name}'. Please return it before {booking.end_time.strftime('%Y-%m-%d %H:%M UTC')}.",
                type="reminder_24h"
            )
            db.add(notif)
            logger.info(f"[EMAIL SIMULATION] Sent 24h return reminder to User ID {booking.user_id} for {equipment_name}")

            # Notify live clients
            await ws_manager.broadcast({
                "type": "NOTIFICATION_ALERT",
                "user_id": booking.user_id,
                "title": notif.title,
                "message": notif.message,
                "notification_type": notif.type
            })

        # 2. Check for overdue bookings (checked_out and end_time < now)
        overdue_bookings = (
            db.query(Booking)
            .filter(
                Booking.status.in_(["checked_out", "approved"]),
                Booking.end_time < now,
            )
            .all()
        )

        for booking in overdue_bookings:
            old_status = booking.status
            booking.status = "overdue"
            equipment = db.query(Equipment).filter(Equipment.id == booking.equipment_id).first()
            if equipment and equipment.status != "overdue":
                equipment.status = "overdue"
                # Record lifecycle audit
                lifecycle = Lifecycle(
                    equipment_id=equipment.id,
                    state="overdue",
                    updated_by="System (Auto-Scheduler)",
                    notes=f"Overdue alert: Scheduled booking #{booking.id} elapsed at {booking.end_time.isoformat()}."
                )
                db.add(lifecycle)

                # Send student overdue escalation notification
                notif_student = Notification(
                    user_id=booking.user_id,
                    title="OVERDUE: Immediate Return Required",
                    message=f"Your booking for '{equipment.name}' is now overdue! Please return it to the lab immediately to prevent account lock or penalty.",
                    type="overdue_alert"
                )
                db.add(notif_student)

                # Send alert to lab assistants/admins
                staff_users = db.query(User).filter(User.role.in_(["lab_assistant", "admin"])).all()
                for staff in staff_users:
                    notif_staff = Notification(
                        user_id=staff.id,
                        title=f"Equipment Overdue: {equipment.name}",
                        message=f"Item '{equipment.name}' is overdue from user #{booking.user_id}. Due time was {booking.end_time.strftime('%Y-%m-%d %H:%M')}.",
                        type="overdue_alert"
                    )
                    db.add(notif_staff)

                logger.warning(f"[EMAIL ESCALATION] Equipment {equipment.name} is OVERDUE for booking {booking.id}")

                # Broadcast to live clients
                await ws_manager.broadcast({
                    "type": "EQUIPMENT_STATUS_CHANGED",
                    "equipment_id": equipment.id,
                    "status": "overdue",
                    "booking_id": booking.id
                })

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error in scheduler check_due_reminders_and_overdue: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_due_reminders_and_overdue,
            "interval",
            seconds=60,
            id="overdue_checker",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started successfully for overdue & reminder checks.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
