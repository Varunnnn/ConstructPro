from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
import uuid
from decimal import Decimal
from typing import Optional, List

from app.models.project import Project
from app.models.attendance import Attendance
from app.models.expense import Expense
from app.models.material import MaterialPurchase
from app.models.worker import ProjectWorker, Worker
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectFinancials, ProjectDetailResponse


def _get_project_or_404(db: Session, project_id: uuid.UUID, org_id: uuid.UUID) -> Project:
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == org_id,
        Project.is_active == True,
    ).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def calculate_project_financials(db: Session, project_id: uuid.UUID, org_id: uuid.UUID) -> ProjectFinancials:
    project = _get_project_or_404(db, project_id, org_id)

    labour_cost = db.query(func.sum(Attendance.labour_cost)).filter(
        Attendance.project_id == project_id,
        Attendance.organization_id == org_id,
    ).scalar() or Decimal("0")

    material_cost = db.query(func.sum(MaterialPurchase.total_amount)).filter(
        MaterialPurchase.project_id == project_id,
        MaterialPurchase.organization_id == org_id,
    ).scalar() or Decimal("0")

    other_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.project_id == project_id,
        Expense.organization_id == org_id,
    ).scalar() or Decimal("0")

    contract_value = project.contract_value or Decimal("0")
    total_cost = labour_cost + material_cost + other_expenses
    profit = contract_value - total_cost

    profit_margin = float((profit / contract_value * 100) if contract_value > 0 else Decimal("0"))
    budget_used_pct = float((total_cost / contract_value * 100) if contract_value > 0 else Decimal("0"))

    return ProjectFinancials(
        contract_value=contract_value,
        labour_cost=labour_cost,
        material_cost=material_cost,
        other_expenses=other_expenses,
        total_cost=total_cost,
        profit=profit,
        profit_margin=profit_margin,
        budget_used_pct=budget_used_pct,
    )


def list_projects(
    db: Session,
    org_id: uuid.UUID,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    query = db.query(Project).filter(
        Project.organization_id == org_id,
        Project.is_active == True,
    )
    if status_filter:
        query = query.filter(Project.status == status_filter)
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))

    total = query.count()
    projects = query.order_by(Project.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"data": projects, "total": total, "page": page, "per_page": per_page}


def get_project(db: Session, project_id: uuid.UUID, org_id: uuid.UUID) -> Project:
    return _get_project_or_404(db, project_id, org_id)


def create_project(db: Session, org_id: uuid.UUID, project_in: ProjectCreate) -> Project:
    # Enforce subscription project limit
    from app.services.subscription_service import SubscriptionLimitService
    SubscriptionLimitService.check_project_limit(db, org_id)

    project = Project(
        organization_id=org_id,
        **project_in.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: uuid.UUID, org_id: uuid.UUID, data: ProjectUpdate) -> Project:
    project = _get_project_or_404(db, project_id, org_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: uuid.UUID, org_id: uuid.UUID) -> None:
    project = _get_project_or_404(db, project_id, org_id)
    project.is_active = False
    db.commit()


def get_project_detail(db: Session, project_id: uuid.UUID, org_id: uuid.UUID) -> dict:
    project = _get_project_or_404(db, project_id, org_id)
    financials = calculate_project_financials(db, project_id, org_id)

    worker_count = db.query(ProjectWorker).filter(
        ProjectWorker.project_id == project_id,
        ProjectWorker.is_active == True,
    ).count()

    attendance_days = db.query(func.count(func.distinct(Attendance.date))).filter(
        Attendance.project_id == project_id,
    ).scalar() or 0

    return {
        "project": project,
        "financials": financials,
        "worker_count": worker_count,
        "attendance_days": attendance_days,
    }
