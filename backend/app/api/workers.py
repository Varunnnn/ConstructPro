from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.user import User
from app.schemas.worker import WorkerCreate, WorkerUpdate, WorkerResponse, ProjectWorkerAssign, ProjectWorkerResponse
from app.services import worker_service

router = APIRouter(tags=["workers"])


# ── Workers ────────────────────────────────────────────────────────────────
worker_router = APIRouter(prefix="/workers")


@worker_router.get("", response_model=dict)
def list_workers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    worker_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    result = worker_service.list_workers(db, org_id, status_filter=status, search=search, worker_type=worker_type, page=page, per_page=per_page)
    return {
        "data": [WorkerResponse.model_validate(w).model_dump() for w in result["data"]],
        "total": result["total"],
        "page": result["page"],
        "per_page": result["per_page"],
    }


@worker_router.post("", response_model=dict, status_code=201)
def create_worker(
    data: WorkerCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    worker = worker_service.create_worker(db, org_id, data)
    from app.services.notification_service import NotificationService
    ns = NotificationService(db, org_id, current_user.id)
    ns.log_activity("created", "worker", f"Worker '{worker.name}' added", entity_id=worker.id)
    return {"data": WorkerResponse.model_validate(worker).model_dump(), "message": "Worker created"}


@worker_router.get("/{worker_id}", response_model=dict)
def get_worker(
    worker_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    worker = worker_service.get_worker(db, worker_id, org_id)
    return {"data": WorkerResponse.model_validate(worker).model_dump()}


@worker_router.put("/{worker_id}", response_model=dict)
def update_worker(
    worker_id: uuid.UUID,
    data: WorkerUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    worker = worker_service.update_worker(db, worker_id, org_id, data)
    return {"data": WorkerResponse.model_validate(worker).model_dump(), "message": "Worker updated"}


@worker_router.delete("/{worker_id}", response_model=dict)
def delete_worker(
    worker_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    worker_service.delete_worker(db, worker_id, org_id)
    return {"message": "Worker deleted"}


# ── Project Workers ────────────────────────────────────────────────────────
project_worker_router = APIRouter(prefix="/projects")


@project_worker_router.get("/{project_id}/workers", response_model=dict)
def get_project_workers(
    project_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    pws = worker_service.get_project_workers(db, project_id, org_id)
    result = []
    for pw in pws:
        w = WorkerResponse.model_validate(pw.worker).model_dump()
        result.append({
            "id": str(pw.id),
            "worker": w,
            "assigned_date": pw.assigned_date.isoformat() if pw.assigned_date else None,
            "is_active": pw.is_active,
        })
    return {"data": result}


@project_worker_router.post("/{project_id}/workers", response_model=dict, status_code=201)
def assign_worker(
    project_id: uuid.UUID,
    data: ProjectWorkerAssign,
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pw = worker_service.assign_worker_to_project(db, project_id, org_id, data)
    from app.services.notification_service import NotificationService
    ns = NotificationService(db, org_id, current_user.id)
    ns.log_activity("assigned", "worker", f"Worker assigned to project", project_id=project_id)
    return {"message": "Worker assigned to project"}


@project_worker_router.delete("/{project_id}/workers/{worker_id}", response_model=dict)
def remove_worker_from_project(
    project_id: uuid.UUID,
    worker_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    worker_service.remove_worker_from_project(db, project_id, worker_id, org_id)
    return {"message": "Worker removed from project"}
