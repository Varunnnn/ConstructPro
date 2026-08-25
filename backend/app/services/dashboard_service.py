from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from decimal import Decimal

from app.models.project import Project
from app.models.attendance import Attendance
from app.models.expense import Expense
from app.models.material import MaterialPurchase
from app.models.payment import ActivityLog
from app.schemas.dashboard import (
    DashboardFinancials, DashboardProjectSummary, ActivityItem, DashboardResponse
)


def get_dashboard(db: Session, org_id: uuid.UUID) -> DashboardResponse:
    # Financial aggregates across all projects in org
    labour_cost = db.query(func.sum(Attendance.labour_cost)).filter(
        Attendance.organization_id == org_id
    ).scalar() or Decimal("0")

    material_cost = db.query(func.sum(MaterialPurchase.total_amount)).filter(
        MaterialPurchase.organization_id == org_id
    ).scalar() or Decimal("0")

    other_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.organization_id == org_id
    ).scalar() or Decimal("0")

    total_contract_value = db.query(func.sum(Project.contract_value)).filter(
        Project.organization_id == org_id,
        Project.is_active == True,
    ).scalar() or Decimal("0")

    total_cost = labour_cost + material_cost + other_expenses
    estimated_profit = total_contract_value - total_cost

    financials = DashboardFinancials(
        total_contract_value=total_contract_value,
        total_labour_cost=labour_cost,
        total_material_cost=material_cost,
        total_other_expenses=other_expenses,
        total_cost=total_cost,
        estimated_profit=estimated_profit,
    )

    # Project status counts
    projects = db.query(Project).filter(
        Project.organization_id == org_id,
        Project.is_active == True,
    ).all()

    status_counts = {"active": 0, "completed": 0, "planning": 0, "on_hold": 0}
    over_budget = 0

    for p in projects:
        s = p.status
        if s in status_counts:
            status_counts[s] = status_counts.get(s, 0) + 1

        # Calculate if over budget
        p_labour = db.query(func.sum(Attendance.labour_cost)).filter(
            Attendance.project_id == p.id).scalar() or Decimal("0")
        p_material = db.query(func.sum(MaterialPurchase.total_amount)).filter(
            MaterialPurchase.project_id == p.id).scalar() or Decimal("0")
        p_expense = db.query(func.sum(Expense.amount)).filter(
            Expense.project_id == p.id).scalar() or Decimal("0")
        p_total_cost = p_labour + p_material + p_expense
        if p.contract_value and p_total_cost > p.contract_value:
            over_budget += 1

    project_summary = DashboardProjectSummary(
        active=status_counts.get("active", 0),
        completed=status_counts.get("completed", 0),
        planning=status_counts.get("planning", 0),
        on_hold=status_counts.get("on_hold", 0),
        over_budget=over_budget,
    )

    # Recent activity (last 10 items)
    activity_records = db.query(ActivityLog).filter(
        ActivityLog.organization_id == org_id
    ).order_by(ActivityLog.created_at.desc()).limit(10).all()

    recent_activity = []
    for a in activity_records:
        project_name = None
        if a.project_id:
            p = db.query(Project).filter(Project.id == a.project_id).first()
            project_name = p.name if p else None

        recent_activity.append(ActivityItem(
            id=a.id,
            description=a.description,
            entity_type=a.entity_type,
            created_at=a.created_at.isoformat(),
            project_name=project_name,
        ))

    return DashboardResponse(
        financials=financials,
        project_summary=project_summary,
        recent_activity=recent_activity,
    )
