import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Text, Date, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Worker(Base):
    __tablename__ = "workers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=True)
    worker_type_id = Column(UUID(as_uuid=True), ForeignKey("worker_types.id"), nullable=True, index=True)
    worker_type = Column(String(50), nullable=False, default="helper")
    skill_level = Column(String(50), nullable=False, default="skilled")  # unskilled, semi_skilled, skilled, highly_skilled, supervisor
    daily_wage = Column(Numeric(10, 2), nullable=False, default=0)
    overtime_rate = Column(Numeric(10, 2), nullable=True, default=0)  # Hourly or per-shift rate
    joining_date = Column(Date, nullable=True)
    status = Column(String(20), default="active")  # active, inactive
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="workers")
    project_workers = relationship("ProjectWorker", back_populates="worker")
    attendances = relationship("Attendance", back_populates="worker")

    __table_args__ = (
        Index("ix_workers_org_status", "organization_id", "status"),
    )


class ProjectWorker(Base):
    __tablename__ = "project_workers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False, index=True)
    assigned_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="project_workers")
    worker = relationship("Worker", back_populates="project_workers")
