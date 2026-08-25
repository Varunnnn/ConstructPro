import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class ProjectType(Base):
    __tablename__ = "project_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # residential, commercial, other
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ConstructionStage(Base):
    __tablename__ = "construction_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    stage_group = Column(String(100), nullable=False)  # pre_construction, foundation, structural, masonry, etc.
    sort_order = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class WorkerCategory(Base):
    __tablename__ = "worker_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    types = relationship("WorkerType", back_populates="category")


class WorkerType(Base):
    __tablename__ = "worker_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("worker_categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    default_skill_level = Column(String(50), default="skilled")  # unskilled, semi_skilled, skilled, highly_skilled, supervisor
    is_system = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("WorkerCategory", back_populates="types")


class MaterialCategory(Base):
    __tablename__ = "material_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("material_categories.id"), nullable=True)

    # Relationships
    materials = relationship("Material", back_populates="category")


class Unit(Base):
    __tablename__ = "units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    unit_type = Column(String(50), nullable=False)  # quantity, weight, length, area, volume, packaging


class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("material_categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    primary_unit_code = Column(String(50), nullable=False)
    allowed_unit_codes = Column(Text, nullable=True)  # Comma-separated or JSON
    specification = Column(Text, nullable=True)
    brand_examples = Column(Text, nullable=True)
    is_system = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("MaterialCategory", back_populates="materials")
    aliases = relationship("MaterialAlias", back_populates="material")


class MaterialAlias(Base):
    __tablename__ = "material_aliases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=False)
    alias_name = Column(String(255), nullable=False, index=True)
    language = Column(String(10), default="hi")  # hi, en

    # Relationships
    material = relationship("Material", back_populates="aliases")


class EquipmentType(Base):
    __tablename__ = "equipment_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # earthwork, concrete, material_handling, compaction, cutting, access
    is_system = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)


class WorkCategory(Base):
    __tablename__ = "work_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)


class SubcontractorType(Base):
    __tablename__ = "subcontractor_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)


class MasterExpenseCategory(Base):
    __tablename__ = "master_expense_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    group_name = Column(String(100), nullable=False)  # labour, material, equipment, site, transport, admin, misc
    is_system = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)
