from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from typing import Optional, List
from datetime import date
from decimal import Decimal
import csv
import io

from app.models.project import Project
from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.expense import Expense
from app.models.material import MaterialPurchase
from app.schemas.dashboard import (
    ProjectProfitReportRow, LabourReportRow, ExpenseReportRow, MaterialReportRow
)


def get_project_profit_report(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = None,
) -> List[ProjectProfitReportRow]:
    query = db.query(Project).filter(
        Project.organization_id == org_id,
        Project.is_active == True,
    )
    if project_id:
        query = query.filter(Project.id == project_id)
    if status_filter:
        query = query.filter(Project.status == status_filter)

    rows = []
    for p in query.all():
        labour = db.query(func.sum(Attendance.labour_cost)).filter(
            Attendance.project_id == p.id
        ).scalar() or Decimal("0")
        material = db.query(func.sum(MaterialPurchase.total_amount)).filter(
            MaterialPurchase.project_id == p.id
        ).scalar() or Decimal("0")
        expenses = db.query(func.sum(Expense.amount)).filter(
            Expense.project_id == p.id
        ).scalar() or Decimal("0")

        total_cost = labour + material + expenses
        profit = (p.contract_value or Decimal("0")) - total_cost
        margin = float(profit / p.contract_value * 100) if p.contract_value else 0.0

        rows.append(ProjectProfitReportRow(
            project_id=p.id,
            project_name=p.name,
            contract_value=p.contract_value or Decimal("0"),
            labour_cost=labour,
            material_cost=material,
            other_expenses=expenses,
            total_cost=total_cost,
            profit=profit,
            profit_margin=margin,
            status=p.status,
        ))

    return rows


def get_labour_report(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[LabourReportRow]:
    att_query = db.query(Attendance).filter(Attendance.organization_id == org_id)
    if project_id:
        att_query = att_query.filter(Attendance.project_id == project_id)
    if date_from:
        att_query = att_query.filter(Attendance.date >= date_from)
    if date_to:
        att_query = att_query.filter(Attendance.date <= date_to)

    all_att = att_query.all()

    # Group by worker + project
    summary = {}
    for att in all_att:
        key = (att.worker_id, att.project_id)
        if key not in summary:
            summary[key] = {"present": 0, "half_day": 0, "absent": 0, "labour_cost": Decimal("0")}
        summary[key][att.status] = summary[key].get(att.status, 0) + 1
        summary[key]["labour_cost"] += att.labour_cost

    rows = []
    for (worker_id, proj_id), stats in summary.items():
        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        project = db.query(Project).filter(Project.id == proj_id).first()
        if not worker or not project:
            continue
        rows.append(LabourReportRow(
            worker_id=worker_id,
            worker_name=worker.name,
            worker_type=worker.worker_type,
            project_id=proj_id,
            project_name=project.name,
            days_present=stats["present"],
            half_days=stats["half_day"],
            days_absent=stats["absent"],
            total_labour_cost=stats["labour_cost"],
        ))

    return rows


def get_expense_report(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[ExpenseReportRow]:
    query = db.query(Expense).filter(Expense.organization_id == org_id)
    if project_id:
        query = query.filter(Expense.project_id == project_id)
    if category:
        query = query.filter(Expense.category == category)
    if date_from:
        query = query.filter(Expense.date >= date_from)
    if date_to:
        query = query.filter(Expense.date <= date_to)

    rows = []
    for e in query.order_by(Expense.date.desc()).all():
        project = db.query(Project).filter(Project.id == e.project_id).first()
        rows.append(ExpenseReportRow(
            id=e.id,
            date=e.date,
            project_name=project.name if project else "Unknown",
            category=e.category,
            amount=e.amount,
            payment_method=e.payment_method,
            description=e.description,
        ))
    return rows


def get_material_report(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[MaterialReportRow]:
    query = db.query(MaterialPurchase).filter(MaterialPurchase.organization_id == org_id)
    if project_id:
        query = query.filter(MaterialPurchase.project_id == project_id)
    if category:
        query = query.filter(MaterialPurchase.category == category)
    if date_from:
        query = query.filter(MaterialPurchase.purchase_date >= date_from)
    if date_to:
        query = query.filter(MaterialPurchase.purchase_date <= date_to)

    rows = []
    for m in query.order_by(MaterialPurchase.purchase_date.desc()).all():
        project = db.query(Project).filter(Project.id == m.project_id).first()
        rows.append(MaterialReportRow(
            id=m.id,
            purchase_date=m.purchase_date,
            project_name=project.name if project else "Unknown",
            material_name=m.material_name,
            supplier=m.supplier,
            quantity=m.quantity,
            unit=m.unit,
            unit_price=m.unit_price,
            total_amount=m.total_amount,
            payment_status=m.payment_status,
        ))
    return rows


def export_to_csv(headers: List[str], rows: List[List]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()
