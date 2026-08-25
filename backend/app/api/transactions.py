from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import date
import io

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.user import User
from app.schemas.transaction import ExpenseCreate, ExpenseUpdate, MaterialCreate, MaterialUpdate
from app.services import transaction_service
from app.services.notification_service import NotificationService

expenses_router = APIRouter(prefix="/expenses", tags=["expenses"])
materials_router = APIRouter(prefix="/materials", tags=["materials"])


# ── Expenses ────────────────────────────────────────────────────────────────

@expenses_router.get("", response_model=dict)
def list_expenses(
    project_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    return transaction_service.list_expenses(db, org_id, project_id=project_id, category=category, date_from=date_from, date_to=date_to, page=page, per_page=per_page)


@expenses_router.post("", response_model=dict, status_code=201)
def create_expense(
    data: ExpenseCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = transaction_service.create_expense(db, org_id, data)
    ns = NotificationService(db, org_id, current_user.id)
    ns.log_activity(
        "created", "expense",
        f"₹{expense.amount:,.0f} {expense.category} expense added",
        entity_id=expense.id,
        project_id=expense.project_id,
    )
    return {"data": {**{c.name: getattr(expense, c.name) for c in expense.__table__.columns}}, "message": "Expense added"}


@expenses_router.put("/{expense_id}", response_model=dict)
def update_expense(
    expense_id: uuid.UUID,
    data: ExpenseUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    expense = transaction_service.update_expense(db, expense_id, org_id, data)
    return {"data": {**{c.name: getattr(expense, c.name) for c in expense.__table__.columns}}, "message": "Expense updated"}


@expenses_router.delete("/{expense_id}", response_model=dict)
def delete_expense(
    expense_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    transaction_service.delete_expense(db, expense_id, org_id)
    return {"message": "Expense deleted"}


# ── Materials ───────────────────────────────────────────────────────────────

@materials_router.get("", response_model=dict)
def list_materials(
    project_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    return transaction_service.list_materials(db, org_id, project_id=project_id, category=category, date_from=date_from, date_to=date_to, page=page, per_page=per_page)


@materials_router.post("", response_model=dict, status_code=201)
def create_material(
    data: MaterialCreate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    material = transaction_service.create_material(db, org_id, data)
    ns = NotificationService(db, org_id, current_user.id)
    ns.log_activity(
        "created", "material",
        f"₹{material.total_amount:,.0f} {material.material_name} purchase added",
        entity_id=material.id,
        project_id=material.project_id,
    )
    return {"data": {**{c.name: getattr(material, c.name) for c in material.__table__.columns}}, "message": "Material added"}


@materials_router.put("/{material_id}", response_model=dict)
def update_material(
    material_id: uuid.UUID,
    data: MaterialUpdate,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    material = transaction_service.update_material(db, material_id, org_id, data)
    return {"data": {**{c.name: getattr(material, c.name) for c in material.__table__.columns}}, "message": "Material updated"}


@materials_router.delete("/{material_id}", response_model=dict)
def delete_material(
    material_id: uuid.UUID,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    transaction_service.delete_material(db, material_id, org_id)
    return {"message": "Material deleted"}
