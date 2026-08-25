import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Date, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)

    date = Column(Date, nullable=False, index=True)
    category = Column(String(100), nullable=False)
    # transport, fuel, electricity, tools, food, equipment, labour_advance, miscellaneous
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    payment_method = Column(String(50), default="cash")  # cash, upi, bank_transfer, other

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="expenses")

    __table_args__ = (
        Index("ix_expenses_org_date", "organization_id", "date"),
        Index("ix_expenses_project_date", "project_id", "date"),
    )
