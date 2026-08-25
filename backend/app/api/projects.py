from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=dict)
def list_projects(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    result = project_service.list_projects(db, org_id, status_filter=status, search=search, page=page, per_page=per_page)
    return {
        "data": [ProjectResponse.model_validate(p).model_dump() for p in result["data"]],
        "total": result["total"],
        "page": result["page"],
        "per_page": result["per_page"],
    }


@router.post("", response_model=dict, status_code=201)
def create_project(
    data: ProjectCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = project_service.create_project(db, org_id, data)
    # Log activity
    from app.services.notification_service import NotificationService
    ns = NotificationService(db, org_id, current_user.id)
    ns.log_activity("created", "project", f"Project '{project.name}' created", entity_id=project.id)
    return {"data": ProjectResponse.model_validate(project).model_dump(), "message": "Project created"}


@router.get("/{project_id}", response_model=dict)
def get_project(
    project_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    detail = project_service.get_project_detail(db, project_id, org_id)
    project = detail["project"]
    resp = ProjectResponse.model_validate(project).model_dump()
    resp["financials"] = detail["financials"].model_dump()
    resp["worker_count"] = detail["worker_count"]
    resp["attendance_days"] = detail["attendance_days"]
    return {"data": resp}


@router.put("/{project_id}", response_model=dict)
def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    project = project_service.update_project(db, project_id, org_id, data)
    return {"data": ProjectResponse.model_validate(project).model_dump(), "message": "Project updated"}


@router.delete("/{project_id}", response_model=dict)
def delete_project(
    project_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    project_service.delete_project(db, project_id, org_id)
    return {"message": "Project deleted"}


@router.get("/{project_id}/financials", response_model=dict)
def get_project_financials(
    project_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    financials = project_service.calculate_project_financials(db, project_id, org_id)
    return {"data": financials.model_dump()}
