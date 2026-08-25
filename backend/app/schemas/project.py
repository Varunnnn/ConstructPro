from pydantic import BaseModel, field_validator
from typing import Optional, List
import uuid
from datetime import date, datetime
from decimal import Decimal


class ProjectCreate(BaseModel):
    name: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    site_address: Optional[str] = None
    contract_value: Decimal = Decimal("0")
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    status: str = "planning"
    notes: Optional[str] = None

    @field_validator("contract_value")
    @classmethod
    def contract_value_non_negative(cls, v):
        if v < 0:
            raise ValueError("Contract value cannot be negative")
        return v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        valid = {"planning", "active", "on_hold", "completed", "cancelled"}
        if v not in valid:
            raise ValueError(f"Status must be one of {valid}")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    site_address: Optional[str] = None
    contract_value: Optional[Decimal] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    site_address: Optional[str]
    contract_value: Decimal
    start_date: Optional[date]
    expected_end_date: Optional[date]
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectFinancials(BaseModel):
    contract_value: Decimal
    labour_cost: Decimal
    material_cost: Decimal
    other_expenses: Decimal
    total_cost: Decimal
    profit: Decimal
    profit_margin: float
    budget_used_pct: float


class ProjectDetailResponse(ProjectResponse):
    financials: ProjectFinancials
    worker_count: int
    attendance_days: int
