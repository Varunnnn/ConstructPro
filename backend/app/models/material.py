import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Date, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class MaterialPurchase(Base):
    __tablename__ = "material_purchases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=True, index=True)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=True, index=True)

    material_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    # cement, steel, sand, bricks, stone, plumbing, electrical, paint, hardware, other
    quantity = Column(Numeric(12, 3), nullable=False)
    unit = Column(String(50), nullable=False)  # bags, kg, tonnes, pieces, litres, sq_ft, etc.
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)  # auto-calculated quantity * unit_price

    supplier = Column(String(255), nullable=True)
    purchase_date = Column(Date, nullable=False, index=True)
    payment_status = Column(String(50), default="paid")  # paid, pending, partial
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="materials")

    __table_args__ = (
        Index("ix_materials_org_date", "organization_id", "purchase_date"),
        Index("ix_materials_project_date", "project_id", "purchase_date"),
    )


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
