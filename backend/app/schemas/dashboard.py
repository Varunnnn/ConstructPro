from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
import uuid
from datetime import date


class DashboardFinancials(BaseModel):
    total_contract_value: Decimal
    total_labour_cost: Decimal
    total_material_cost: Decimal
    total_other_expenses: Decimal
    total_cost: Decimal
    estimated_profit: Decimal


class DashboardProjectSummary(BaseModel):
    active: int
    completed: int
    planning: int
    on_hold: int
    over_budget: int


class ActivityItem(BaseModel):
    id: uuid.UUID
    description: str
    entity_type: str
    created_at: str
    project_name: Optional[str] = None


class DashboardResponse(BaseModel):
    financials: DashboardFinancials
    project_summary: DashboardProjectSummary
    recent_activity: List[ActivityItem]


class ProjectProfitReportRow(BaseModel):
    project_id: uuid.UUID
    project_name: str
    contract_value: Decimal
    labour_cost: Decimal
    material_cost: Decimal
    other_expenses: Decimal
    total_cost: Decimal
    profit: Decimal
    profit_margin: float
    status: str


class LabourReportRow(BaseModel):
    worker_id: uuid.UUID
    worker_name: str
    worker_type: str
    project_id: uuid.UUID
    project_name: str
    days_present: int
    half_days: int
    days_absent: int
    total_labour_cost: Decimal


class ExpenseReportRow(BaseModel):
    id: uuid.UUID
    date: date
    project_name: str
    category: str
    amount: Decimal
    payment_method: str
    description: Optional[str]


class MaterialReportRow(BaseModel):
    id: uuid.UUID
    purchase_date: date
    project_name: str
    material_name: str
    supplier: Optional[str]
    quantity: Decimal
    unit: str
    unit_price: Decimal
    total_amount: Decimal
    payment_status: str
