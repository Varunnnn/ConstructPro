from pydantic import BaseModel, field_validator
from typing import Optional, List
import uuid
from datetime import date, datetime
from decimal import Decimal


class AttendanceRecord(BaseModel):
    worker_id: uuid.UUID
    status: str  # present, half_day, absent

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        if v not in {"present", "half_day", "absent"}:
            raise ValueError("Status must be present, half_day, or absent")
        return v


class AttendanceBulkCreate(BaseModel):
    project_id: uuid.UUID
    date: date
    records: List[AttendanceRecord]


class AttendanceResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    worker_id: uuid.UUID
    date: date
    status: str
    labour_cost: Decimal
    worker_name: Optional[str] = None
    worker_type: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    project_id: uuid.UUID
    total_present: int
    total_half_day: int
    total_absent: int
    total_labour_cost: Decimal


class ExpenseCreate(BaseModel):
    project_id: uuid.UUID
    date: date
    category: str
    amount: Decimal
    description: Optional[str] = None
    payment_method: str = "cash"

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("category")
    @classmethod
    def category_valid(cls, v):
        valid = {"transport", "fuel", "electricity", "tools", "food", "equipment", "labour_advance", "miscellaneous"}
        if v not in valid:
            raise ValueError(f"Category must be one of {valid}")
        return v

    @field_validator("payment_method")
    @classmethod
    def payment_method_valid(cls, v):
        if v not in {"cash", "upi", "bank_transfer", "other"}:
            raise ValueError("Invalid payment method")
        return v


class ExpenseUpdate(BaseModel):
    project_id: Optional[uuid.UUID] = None
    date: Optional[date] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    date: date
    category: str
    amount: Decimal
    description: Optional[str]
    payment_method: str
    created_at: datetime
    project_name: Optional[str] = None

    class Config:
        from_attributes = True


class MaterialCreate(BaseModel):
    project_id: uuid.UUID
    material_name: str
    category: str
    quantity: Decimal
    unit: str
    unit_price: Decimal
    supplier: Optional[str] = None
    purchase_date: date
    payment_status: str = "paid"
    notes: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v

    @field_validator("unit_price")
    @classmethod
    def price_non_negative(cls, v):
        if v < 0:
            raise ValueError("Unit price cannot be negative")
        return v


class MaterialUpdate(BaseModel):
    project_id: Optional[uuid.UUID] = None
    material_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None
    supplier: Optional[str] = None
    purchase_date: Optional[date] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class MaterialResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    material_name: str
    category: str
    quantity: Decimal
    unit: str
    unit_price: Decimal
    total_amount: Decimal
    supplier: Optional[str]
    purchase_date: date
    payment_status: str
    notes: Optional[str]
    created_at: datetime
    project_name: Optional[str] = None

    class Config:
        from_attributes = True
