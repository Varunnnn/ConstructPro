from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
from typing import Optional
from datetime import date

from app.models.worker import Worker, ProjectWorker
from app.models.project import Project
from app.schemas.worker import WorkerCreate, WorkerUpdate, ProjectWorkerAssign


def _get_worker_or_404(db: Session, worker_id: uuid.UUID, org_id: uuid.UUID) -> Worker:
    worker = db.query(Worker).filter(
        Worker.id == worker_id,
        Worker.organization_id == org_id,
    ).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return worker


def list_workers(
    db: Session,
    org_id: uuid.UUID,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    worker_type: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    query = db.query(Worker).filter(Worker.organization_id == org_id)
    if status_filter:
        query = query.filter(Worker.status == status_filter)
    if search:
        query = query.filter(Worker.name.ilike(f"%{search}%"))
    if worker_type:
        query = query.filter(Worker.worker_type == worker_type)

    total = query.count()
    workers = query.order_by(Worker.name.asc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"data": workers, "total": total, "page": page, "per_page": per_page}


def get_worker(db: Session, worker_id: uuid.UUID, org_id: uuid.UUID) -> Worker:
    return _get_worker_or_404(db, worker_id, org_id)


def create_worker(db: Session, org_id: uuid.UUID, data: WorkerCreate) -> Worker:
    # Enforce subscription worker limit
    from app.services.subscription_service import SubscriptionLimitService
    SubscriptionLimitService.check_worker_limit(db, org_id)

    worker = Worker(organization_id=org_id, **data.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


def update_worker(db: Session, worker_id: uuid.UUID, org_id: uuid.UUID, data: WorkerUpdate) -> Worker:
    worker = _get_worker_or_404(db, worker_id, org_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return worker


def delete_worker(db: Session, worker_id: uuid.UUID, org_id: uuid.UUID) -> None:
    worker = _get_worker_or_404(db, worker_id, org_id)
    db.delete(worker)
    db.commit()


def assign_worker_to_project(db: Session, project_id: uuid.UUID, org_id: uuid.UUID, data: ProjectWorkerAssign) -> ProjectWorker:
    # Verify project belongs to org
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Verify worker belongs to org
    worker = _get_worker_or_404(db, data.worker_id, org_id)

    # Check if already assigned
    existing = db.query(ProjectWorker).filter(
        ProjectWorker.project_id == project_id,
        ProjectWorker.worker_id == data.worker_id,
        ProjectWorker.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker already assigned to this project")

    pw = ProjectWorker(
        project_id=project_id,
        worker_id=data.worker_id,
        assigned_date=data.assigned_date or date.today(),
    )
    db.add(pw)
    db.commit()
    db.refresh(pw)
    return pw


def get_project_workers(db: Session, project_id: uuid.UUID, org_id: uuid.UUID):
    # Verify project belongs to org
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return db.query(ProjectWorker).filter(
        ProjectWorker.project_id == project_id,
        ProjectWorker.is_active == True,
    ).all()


def remove_worker_from_project(db: Session, project_id: uuid.UUID, worker_id: uuid.UUID, org_id: uuid.UUID) -> None:
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    pw = db.query(ProjectWorker).filter(
        ProjectWorker.project_id == project_id,
        ProjectWorker.worker_id == worker_id,
    ).first()
    if pw:
        pw.is_active = False
        db.commit()
