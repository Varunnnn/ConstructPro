import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Date, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False, index=True)

    date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="present")  # present, half_day, absent
    labour_cost = Column(Numeric(10, 2), nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="attendances")
    worker = relationship("Worker", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("project_id", "worker_id", "date", name="uq_attendance_project_worker_date"),
        Index("ix_attendance_org_date", "organization_id", "date"),
        Index("ix_attendance_project_date", "project_id", "date"),
    )
