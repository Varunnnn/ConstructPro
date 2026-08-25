from pydantic import BaseModel, field_validator
from typing import Optional
import uuid
from datetime import date, datetime
from decimal import Decimal


class WorkerCreate(BaseModel):
    name: str
    mobile: Optional[str] = None
    worker_type: str = "helper"
    daily_wage: Decimal = Decimal("0")
    joining_date: Optional[date] = None
    status: str = "active"
    notes: Optional[str] = None

    @field_validator("daily_wage")
    @classmethod
    def wage_non_negative(cls, v):
        if v < 0:
            raise ValueError("Daily wage cannot be negative")
        return v

    @field_validator("worker_type")
    @classmethod
    def type_valid(cls, v):
        valid = {"mason", "helper", "carpenter", "electrician", "plumber", "painter", "other"}
        if v not in valid:
            raise ValueError(f"Worker type must be one of {valid}")
        return v


class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    worker_type: Optional[str] = None
    daily_wage: Optional[Decimal] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class WorkerResponse(BaseModel):
    id: uuid.UUID
    name: str
    mobile: Optional[str]
    worker_type: str
    daily_wage: Decimal
    joining_date: Optional[date]
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectWorkerAssign(BaseModel):
    worker_id: uuid.UUID
    assigned_date: Optional[date] = None


class ProjectWorkerResponse(BaseModel):
    id: uuid.UUID
    worker: WorkerResponse
    assigned_date: Optional[date]
    is_active: bool

    class Config:
        from_attributes = True
