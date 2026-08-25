from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
import uuid
from typing import Optional
from datetime import date

from app.models.expense import Expense
from app.models.material import MaterialPurchase
from app.models.project import Project
from app.schemas.transaction import ExpenseCreate, ExpenseUpdate, MaterialCreate, MaterialUpdate


def _verify_project(db: Session, project_id: uuid.UUID, org_id: uuid.UUID) -> Project:
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == org_id,
        Project.is_active == True,
    ).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


# ── Expenses ────────────────────────────────────────────────────────────────

def list_expenses(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    query = db.query(Expense).filter(Expense.organization_id == org_id)
    if project_id:
        query = query.filter(Expense.project_id == project_id)
    if category:
        query = query.filter(Expense.category == category)
    if date_from:
        query = query.filter(Expense.date >= date_from)
    if date_to:
        query = query.filter(Expense.date <= date_to)

    total = query.count()
    expenses = query.order_by(Expense.date.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Enrich with project name
    enriched = []
    for e in expenses:
        project = db.query(Project).filter(Project.id == e.project_id).first()
        enriched.append({
            **{c.name: getattr(e, c.name) for c in e.__table__.columns},
            "project_name": project.name if project else None,
        })

    return {"data": enriched, "total": total, "page": page, "per_page": per_page}


def create_expense(db: Session, org_id: uuid.UUID, data: ExpenseCreate) -> Expense:
    _verify_project(db, data.project_id, org_id)
    expense = Expense(organization_id=org_id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(db: Session, expense_id: uuid.UUID, org_id: uuid.UUID, data: ExpenseUpdate) -> Expense:
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.organization_id == org_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: uuid.UUID, org_id: uuid.UUID) -> None:
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.organization_id == org_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(expense)
    db.commit()


# ── Materials ───────────────────────────────────────────────────────────────

def list_materials(
    db: Session,
    org_id: uuid.UUID,
    project_id: Optional[uuid.UUID] = None,
    category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    query = db.query(MaterialPurchase).filter(MaterialPurchase.organization_id == org_id)
    if project_id:
        query = query.filter(MaterialPurchase.project_id == project_id)
    if category:
        query = query.filter(MaterialPurchase.category == category)
    if date_from:
        query = query.filter(MaterialPurchase.purchase_date >= date_from)
    if date_to:
        query = query.filter(MaterialPurchase.purchase_date <= date_to)

    total = query.count()
    materials = query.order_by(MaterialPurchase.purchase_date.desc()).offset((page - 1) * per_page).limit(per_page).all()

    enriched = []
    for m in materials:
        project = db.query(Project).filter(Project.id == m.project_id).first()
        enriched.append({
            **{c.name: getattr(m, c.name) for c in m.__table__.columns},
            "project_name": project.name if project else None,
        })

    return {"data": enriched, "total": total, "page": page, "per_page": per_page}


def create_material(db: Session, org_id: uuid.UUID, data: MaterialCreate) -> MaterialPurchase:
    _verify_project(db, data.project_id, org_id)
    total_amount = data.quantity * data.unit_price
    material_data = data.model_dump()
    material = MaterialPurchase(
        organization_id=org_id,
        total_amount=total_amount,
        **material_data,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def update_material(db: Session, material_id: uuid.UUID, org_id: uuid.UUID, data: MaterialUpdate) -> MaterialPurchase:
    material = db.query(MaterialPurchase).filter(
        MaterialPurchase.id == material_id,
        MaterialPurchase.organization_id == org_id,
    ).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(material, field, value)

    # Recalculate total
    material.total_amount = material.quantity * material.unit_price
    db.commit()
    db.refresh(material)
    return material


def delete_material(db: Session, material_id: uuid.UUID, org_id: uuid.UUID) -> None:
    material = db.query(MaterialPurchase).filter(
        MaterialPurchase.id == material_id,
        MaterialPurchase.organization_id == org_id,
    ).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    db.delete(material)
    db.commit()
