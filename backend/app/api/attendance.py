from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import date

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.user import User
from app.schemas.transaction import AttendanceBulkCreate
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("", response_model=dict)
def get_attendance(
    project_id: Optional[uuid.UUID] = Query(None),
    worker_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    result = attendance_service.get_attendance(
        db, org_id,
        project_id=project_id,
        worker_id=worker_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )
    return result


@router.get("/project/{project_id}/date/{att_date}", response_model=dict)
def get_attendance_by_project_date(
    project_id: uuid.UUID,
    att_date: date,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    records = attendance_service.get_attendance_by_project_date(db, org_id, project_id, att_date)
    return {"data": records}


@router.post("", response_model=dict, status_code=201)
def bulk_save_attendance(
    data: AttendanceBulkCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = attendance_service.bulk_save_attendance(db, org_id, data)

    # Log activity
    from app.services.notification_service import NotificationService
    ns = NotificationService(db, org_id, current_user.id)
    present_count = sum(1 for r in data.records if r.status == "present")
    ns.log_activity(
        "created", "attendance",
        f"{present_count} workers marked present at project",
        project_id=data.project_id,
    )

    return {
        "data": [
            {
                "worker_id": str(r.worker_id),
                "date": r.date.isoformat(),
                "status": r.status,
                "labour_cost": str(r.labour_cost),
            }
            for r in records
        ],
        "message": f"Attendance saved for {len(records)} workers",
    }
