from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
import uuid
from decimal import Decimal
from typing import Optional, List
from datetime import date

from app.models.attendance import Attendance
from app.models.worker import Worker, ProjectWorker
from app.models.project import Project
from app.schemas.transaction import AttendanceBulkCreate, AttendanceResponse


def _calc_labour_cost(daily_wage: Decimal, attendance_status: str) -> Decimal:
    if attendance_status == "present":
        return daily_wage
    elif attendance_status == "half_day":
        return daily_wage / 2
    else:
        return Decimal("0")


def bulk_save_attendance(
    db: Session,
    org_id: uuid.UUID,
    data: AttendanceBulkCreate,
) -> List[Attendance]:
    # Verify project belongs to org
    project = db.query(Project).filter(
        Project.id == data.project_id,
        Project.organization_id == org_id,
    ).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    results = []
    for record in data.records:
        worker = db.query(Worker).filter(
            Worker.id == record.worker_id,
            Worker.organization_id == org_id,
        ).first()
        if not worker:
            continue

        labour_cost = _calc_labour_cost(worker.daily_wage, record.status)

        # Upsert attendance (update if exists for same project/worker/date)
        existing = db.query(Attendance).filter(
            Attendance.project_id == data.project_id,
            Attendance.worker_id == record.worker_id,
            Attendance.date == data.date,
        ).first()

        if existing:
            existing.status = record.status
            existing.labour_cost = labour_cost
            results.append(existing)
        else:
            att = Attendance(
                organization_id=org_id,
                project_id=data.project_id,
                worker_id=record.worker_id,
                date=data.date,
                status=record.status,
                labour_cost=labour_cost,
            )
            db.add(att)
            results.append(att)

    db.commit()
    for r in results:
        db.refresh(r)
    return results


def get_attendance(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    worker_id: Optional[uuid.UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    query = db.query(Attendance).filter(Attendance.organization_id == org_id)
    if project_id:
        query = query.filter(Attendance.project_id == project_id)
    if worker_id:
        query = query.filter(Attendance.worker_id == worker_id)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    total = query.count()
    records = query.order_by(Attendance.date.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Enrich with worker info
    enriched = []
    for att in records:
        worker = db.query(Worker).filter(Worker.id == att.worker_id).first()
        enriched.append({
            "id": att.id,
            "project_id": att.project_id,
            "worker_id": att.worker_id,
            "date": att.date,
            "status": att.status,
            "labour_cost": att.labour_cost,
            "worker_name": worker.name if worker else None,
            "worker_type": worker.worker_type if worker else None,
        })

    return {"data": enriched, "total": total, "page": page, "per_page": per_page}


def get_attendance_by_project_date(
    db: Session,
    org_id: uuid.UUID,
    project_id: uuid.UUID,
    att_date: date,
) -> List[dict]:
    """Get attendance records for a project on a specific date, with all assigned workers."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == org_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all active workers assigned to this project
    project_workers = db.query(ProjectWorker).filter(
        ProjectWorker.project_id == project_id,
        ProjectWorker.is_active == True,
    ).all()

    result = []
    for pw in project_workers:
        worker = db.query(Worker).filter(Worker.id == pw.worker_id).first()
        if not worker:
            continue

        att = db.query(Attendance).filter(
            Attendance.project_id == project_id,
            Attendance.worker_id == pw.worker_id,
            Attendance.date == att_date,
        ).first()

        result.append({
            "worker_id": worker.id,
            "worker_name": worker.name,
            "worker_type": worker.worker_type,
            "daily_wage": worker.daily_wage,
            "status": att.status if att else "absent",
            "labour_cost": att.labour_cost if att else Decimal("0"),
        })

    return result
