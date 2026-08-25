import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Text, Date, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    project_type_id = Column(UUID(as_uuid=True), ForeignKey("project_types.id"), nullable=True, index=True)
    customer_name = Column(String(255), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    site_address = Column(Text, nullable=True)
    contract_value = Column(Numeric(15, 2), nullable=False, default=0)
    built_up_area = Column(Numeric(12, 2), nullable=True)  # in Sq Ft
    plot_area = Column(Numeric(12, 2), nullable=True)      # in Sq Ft
    num_floors = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    expected_end_date = Column(Date, nullable=True)
    status = Column(String(50), default="planning")  # planning, active, on_hold, completed, cancelled
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    project_workers = relationship("ProjectWorker", back_populates="project")
    attendances = relationship("Attendance", back_populates="project")
    expenses = relationship("Expense", back_populates="project")
    materials = relationship("MaterialPurchase", back_populates="project")
    payments = relationship("Payment", back_populates="project")
    activity_logs = relationship("ActivityLog", back_populates="project")

    __table_args__ = (
        Index("ix_projects_org_status", "organization_id", "status"),
    )
