from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.user import User
from app.models.master_data import (
    ProjectType, ConstructionStage, WorkerCategory, WorkerType,
    MaterialCategory, Unit, Material, MaterialAlias, EquipmentType, MasterExpenseCategory
)
from app.models.material import MaterialPurchase

router = APIRouter(prefix="/master-data", tags=["master-data"])


@router.get("/project-types", response_model=dict)
def get_project_types(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    pts = db.query(ProjectType).filter(
        or_(ProjectType.is_system == True, ProjectType.organization_id == org_id)
    ).order_by(ProjectType.category, ProjectType.name).all()
    return {"data": [{"id": str(p.id), "code": p.code, "name": p.name, "category": p.category, "description": p.description} for p in pts]}


@router.get("/construction-stages", response_model=dict)
def get_construction_stages(db: Session = Depends(get_db)):
    stages = db.query(ConstructionStage).order_by(ConstructionStage.sort_order).all()
    return {"data": [{"id": str(s.id), "code": s.code, "name": s.name, "stage_group": s.stage_group, "sort_order": s.sort_order} for s in stages]}


@router.get("/worker-categories", response_model=dict)
def get_worker_categories(db: Session = Depends(get_db)):
    cats = db.query(WorkerCategory).all()
    return {"data": [{"id": str(c.id), "code": c.code, "name": c.name} for c in cats]}


@router.get("/worker-types", response_model=dict)
def get_worker_types(
    category_id: Optional[uuid.UUID] = Query(None),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    query = db.query(WorkerType).filter(
        or_(WorkerType.is_system == True, WorkerType.organization_id == org_id)
    )
    if category_id:
        query = query.filter(WorkerType.category_id == category_id)
    wtypes = query.order_by(WorkerType.name).all()
    return {"data": [{"id": str(w.id), "code": w.code, "name": w.name, "category_id": str(w.category_id), "default_skill_level": w.default_skill_level} for w in wtypes]}


@router.get("/units", response_model=dict)
def get_units(db: Session = Depends(get_db)):
    units = db.query(Unit).all()
    return {"data": [{"id": str(u.id), "code": u.code, "name": u.name, "unit_type": u.unit_type} for u in units]}


@router.get("/material-categories", response_model=dict)
def get_material_categories(db: Session = Depends(get_db)):
    mcats = db.query(MaterialCategory).order_by(MaterialCategory.name).all()
    return {"data": [{"id": str(mc.id), "code": mc.code, "name": mc.name} for mc in mcats]}


@router.get("/materials", response_model=dict)
def search_materials(
    q: Optional[str] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    """
    Search materials by name, code, specification, or Hindi/English search aliases.
    """
    query = db.query(Material).filter(
        or_(Material.is_system == True, Material.organization_id == org_id)
    )

    if category_id:
        query = query.filter(Material.category_id == category_id)

    if q:
        search_pattern = f"%{q}%"
        # Find matching alias IDs
        alias_mat_ids = db.query(MaterialAlias.material_id).filter(
            MaterialAlias.alias_name.ilike(search_pattern)
        ).subquery()

        query = query.filter(
            or_(
                Material.name.ilike(search_pattern),
                Material.code.ilike(search_pattern),
                Material.specification.ilike(search_pattern),
                Material.id.in_(alias_mat_ids)
            )
        )

    materials = query.order_by(Material.name).limit(50).all()

    result = []
    for m in materials:
        # Check last purchase price for this org
        last_pur = db.query(MaterialPurchase).filter(
            MaterialPurchase.organization_id == org_id,
            MaterialPurchase.material_name == m.name
        ).order_by(MaterialPurchase.purchase_date.desc()).first()

        result.append({
            "id": str(m.id),
            "code": m.code,
            "name": m.name,
            "category_id": str(m.category_id),
            "primary_unit_code": m.primary_unit_code,
            "allowed_unit_codes": m.allowed_unit_codes.split(",") if m.allowed_unit_codes else [m.primary_unit_code],
            "specification": m.specification,
            "brand_examples": m.brand_examples,
            "last_purchase_price": str(last_pur.unit_price) if last_pur else None,
            "last_supplier": last_pur.supplier if last_pur else None,
            "last_purchase_date": last_pur.purchase_date.isoformat() if last_pur else None,
        })

    return {"data": result}


@router.get("/expense-categories", response_model=dict)
def get_expense_categories(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    cats = db.query(MasterExpenseCategory).filter(
        or_(MasterExpenseCategory.is_system == True, MasterExpenseCategory.organization_id == org_id)
    ).all()
    return {"data": [{"id": str(c.id), "code": c.code, "name": c.name, "group_name": c.group_name} for c in cats]}
