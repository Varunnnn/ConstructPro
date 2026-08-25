from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date, datetime
import json

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.new_modules import Client, Estimate, SiteUpdate, ClientInvoice
from app.models.project import Project

router = APIRouter(prefix="/new-modules", tags=["new-modules"])

# ── CLIENTS ENDPOINTS ─────────────────────────────────────────────────────────

@router.get("/clients")
def list_clients(org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    clients = db.query(Client).filter(Client.organization_id == org_id, Client.is_active == True).order_by(Client.created_at.desc()).all()
    return {"data": [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "company_name": c.company_name,
            "address": c.address,
            "gstin": c.gstin,
            "notes": c.notes,
            "created_at": c.created_at.isoformat() if c.created_at else None
        } for c in clients
    ]}

@router.post("/clients")
def create_client(payload: dict, org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    c = Client(
        organization_id=org_id,
        name=payload["name"],
        email=payload.get("email"),
        phone=payload.get("phone"),
        company_name=payload.get("company_name"),
        address=payload.get("address"),
        gstin=payload.get("gstin"),
        notes=payload.get("notes")
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"message": "Client created successfully", "data": {"id": str(c.id), "name": c.name}}

@router.delete("/clients/{client_id}")
def delete_client(client_id: uuid.UUID, org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    c = db.query(Client).filter(Client.id == client_id, Client.organization_id == org_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    c.is_active = False
    db.commit()
    return {"message": "Client deleted"}


# ── ESTIMATES / BOQ ENDPOINTS ──────────────────────────────────────────────────

@router.get("/estimates")
def list_estimates(org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    estimates = db.query(Estimate).filter(Estimate.organization_id == org_id).order_by(Estimate.created_at.desc()).all()
    return {"data": [
        {
            "id": str(e.id),
            "estimate_number": e.estimate_number,
            "title": e.title,
            "project_id": str(e.project_id) if e.project_id else None,
            "client_id": str(e.client_id) if e.client_id else None,
            "total_amount": float(e.total_amount),
            "tax_amount": float(e.tax_amount),
            "grand_total": float(e.grand_total),
            "status": e.status,
            "date": e.date.isoformat() if e.date else None,
            "valid_until": e.valid_until.isoformat() if e.valid_until else None,
            "boq_json": json.loads(e.boq_json) if e.boq_json else [],
            "notes": e.notes
        } for e in estimates
    ]}

@router.post("/estimates")
def create_estimate(payload: dict, org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    now = datetime.now()
    est_num = f"EST-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
    
    total = float(payload.get("total_amount", 0))
    tax = float(payload.get("tax_amount", 0))
    grand = total + tax

    e = Estimate(
        organization_id=org_id,
        estimate_number=est_num,
        title=payload["title"],
        project_id=uuid.UUID(payload["project_id"]) if payload.get("project_id") else None,
        client_id=uuid.UUID(payload["client_id"]) if payload.get("client_id") else None,
        total_amount=total,
        tax_amount=tax,
        grand_total=grand,
        status=payload.get("status", "draft"),
        date=datetime.strptime(payload["date"], "%Y-%m-%d").date() if payload.get("date") else date.today(),
        valid_until=datetime.strptime(payload["valid_until"], "%Y-%m-%d").date() if payload.get("valid_until") else None,
        boq_json=json.dumps(payload.get("boq_items", [])),
        notes=payload.get("notes")
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"message": "Estimate created successfully", "data": {"id": str(e.id), "estimate_number": e.estimate_number}}


# ── SITE UPDATES ENDPOINTS ──────────────────────────────────────────────────

@router.get("/site-updates")
def list_site_updates(project_id: Optional[str] = None, org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    query = db.query(SiteUpdate).filter(SiteUpdate.organization_id == org_id)
    if project_id:
        query = query.filter(SiteUpdate.project_id == uuid.UUID(project_id))
    updates = query.order_by(SiteUpdate.date.desc()).all()
    
    return {"data": [
        {
            "id": str(su.id),
            "project_id": str(su.project_id),
            "date": su.date.isoformat() if su.date else None,
            "progress_percentage": su.progress_percentage,
            "title": su.title,
            "description": su.description,
            "work_completed": su.work_completed,
            "issues_blockers": su.issues_blockers,
            "weather_condition": su.weather_condition
        } for su in updates
    ]}

@router.post("/site-updates")
def create_site_update(payload: dict, org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    su = SiteUpdate(
        organization_id=org_id,
        project_id=uuid.UUID(payload["project_id"]),
        date=datetime.strptime(payload["date"], "%Y-%m-%d").date() if payload.get("date") else date.today(),
        progress_percentage=int(payload.get("progress_percentage", 0)),
        title=payload["title"],
        description=payload.get("description"),
        work_completed=payload.get("work_completed"),
        issues_blockers=payload.get("issues_blockers"),
        weather_condition=payload.get("weather_condition", "Sunny")
    )
    db.add(su)
    db.commit()
    db.refresh(su)
    return {"message": "Site update logged successfully", "data": {"id": str(su.id)}}


# ── CLIENT MILESTONE INVOICES ENDPOINTS ──────────────────────────────────────

@router.get("/client-invoices")
def list_client_invoices(org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    invoices = db.query(ClientInvoice).filter(ClientInvoice.organization_id == org_id).order_by(ClientInvoice.created_at.desc()).all()
    return {"data": [
        {
            "id": str(inv.id),
            "invoice_number": inv.invoice_number,
            "project_id": str(inv.project_id),
            "client_id": str(inv.client_id) if inv.client_id else None,
            "milestone_name": inv.milestone_name,
            "amount": float(inv.amount),
            "tax_amount": float(inv.tax_amount),
            "total_amount": float(inv.total_amount),
            "status": inv.status,
            "issue_date": inv.issue_date.isoformat() if inv.issue_date else None,
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
            "paid_date": inv.paid_date.isoformat() if inv.paid_date else None,
            "notes": inv.notes
        } for inv in invoices
    ]}

@router.post("/client-invoices")
def create_client_invoice(payload: dict, org_id: uuid.UUID = Depends(get_current_org_id), db: Session = Depends(get_db)):
    now = datetime.now()
    inv_num = f"INV-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
    
    amount = float(payload.get("amount", 0))
    tax = float(payload.get("tax_amount", 0))
    total = amount + tax

    inv = ClientInvoice(
        organization_id=org_id,
        project_id=uuid.UUID(payload["project_id"]),
        client_id=uuid.UUID(payload["client_id"]) if payload.get("client_id") else None,
        invoice_number=inv_num,
        milestone_name=payload["milestone_name"],
        amount=amount,
        tax_amount=tax,
        total_amount=total,
        status=payload.get("status", "pending"),
        issue_date=datetime.strptime(payload["issue_date"], "%Y-%m-%d").date() if payload.get("issue_date") else date.today(),
        due_date=datetime.strptime(payload["due_date"], "%Y-%m-%d").date() if payload.get("due_date") else date.today(),
        notes=payload.get("notes")
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return {"message": "Client invoice generated successfully", "data": {"id": str(inv.id), "invoice_number": inv.invoice_number}}
