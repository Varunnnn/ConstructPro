import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Date, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)

    amount = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(String(50), default="cash")  # cash, upi, bank_transfer, other
    payment_date = Column(Date, nullable=False)
    payment_type = Column(String(50), nullable=False)  # received_from_customer, paid_to_supplier, paid_to_worker, other
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="payments")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    action = Column(String(100), nullable=False)  # created, updated, deleted
    entity_type = Column(String(100), nullable=False)  # project, worker, attendance, expense, material
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    description = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="activity_logs")

    __table_args__ = (
        Index("ix_activity_org_created", "organization_id", "created_at"),
    )
