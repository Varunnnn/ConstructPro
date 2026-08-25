from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import date
import io

from app.db.session import get_db
from app.core.dependencies import get_current_org_id
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/project-profit", response_model=dict)
def project_profit_report(
    project_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_project_profit_report(db, org_id, project_id=project_id, status_filter=status)
    return {"data": [r.model_dump() for r in rows]}


@router.get("/project-profit/csv")
def project_profit_csv(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_project_profit_report(db, org_id)
    headers = ["Project", "Contract Value", "Labour Cost", "Material Cost", "Other Expenses", "Total Cost", "Profit", "Margin %", "Status"]
    csv_rows = [
        [r.project_name, r.contract_value, r.labour_cost, r.material_cost, r.other_expenses, r.total_cost, r.profit, f"{r.profit_margin:.2f}", r.status]
        for r in rows
    ]
    csv_content = report_service.export_to_csv(headers, csv_rows)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=project-profit-report.csv"},
    )


@router.get("/labour", response_model=dict)
def labour_report(
    project_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_labour_report(db, org_id, project_id=project_id, date_from=date_from, date_to=date_to)
    return {"data": [r.model_dump() for r in rows]}


@router.get("/labour/csv")
def labour_csv(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_labour_report(db, org_id)
    headers = ["Worker", "Type", "Project", "Days Present", "Half Days", "Days Absent", "Total Labour Cost"]
    csv_rows = [
        [r.worker_name, r.worker_type, r.project_name, r.days_present, r.half_days, r.days_absent, r.total_labour_cost]
        for r in rows
    ]
    csv_content = report_service.export_to_csv(headers, csv_rows)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=labour-report.csv"},
    )


@router.get("/expenses", response_model=dict)
def expense_report(
    project_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_expense_report(db, org_id, project_id=project_id, category=category, date_from=date_from, date_to=date_to)
    return {"data": [r.model_dump() for r in rows]}


@router.get("/expenses/csv")
def expense_csv(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_expense_report(db, org_id)
    headers = ["Date", "Project", "Category", "Amount", "Payment Method", "Description"]
    csv_rows = [
        [r.date, r.project_name, r.category, r.amount, r.payment_method, r.description or ""]
        for r in rows
    ]
    csv_content = report_service.export_to_csv(headers, csv_rows)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expense-report.csv"},
    )


@router.get("/materials", response_model=dict)
def material_report(
    project_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_material_report(db, org_id, project_id=project_id, category=category, date_from=date_from, date_to=date_to)
    return {"data": [r.model_dump() for r in rows]}


@router.get("/materials/csv")
def material_csv(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db),
):
    rows = report_service.get_material_report(db, org_id)
    headers = ["Date", "Project", "Material", "Supplier", "Quantity", "Unit", "Unit Price", "Total Amount", "Payment Status"]
    csv_rows = [
        [r.purchase_date, r.project_name, r.material_name, r.supplier or "", r.quantity, r.unit, r.unit_price, r.total_amount, r.payment_status]
        for r in rows
    ]
    csv_content = report_service.export_to_csv(headers, csv_rows)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=material-report.csv"},
    )
