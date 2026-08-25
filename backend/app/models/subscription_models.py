import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Text, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)  # FREE_TRIAL, STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    monthly_price = Column(Numeric(10, 2), nullable=False, default=0)
    annual_price = Column(Numeric(10, 2), nullable=False, default=0)
    currency = Column(String(10), default="INR")
    trial_days = Column(Integer, default=30)
    max_projects = Column(Integer, default=1)
    max_workers = Column(Integer, default=10)
    max_users = Column(Integer, default=1)
    is_unlimited_projects = Column(Boolean, default=False)
    is_unlimited_workers = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    plan_features = relationship("PlanFeature", back_populates="plan")
    subscriptions = relationship("Subscription", back_populates="plan")


class Feature(Base):
    __tablename__ = "features"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    plan_features = relationship("PlanFeature", back_populates="feature")


class PlanFeature(Base):
    __tablename__ = "plan_features"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    feature_id = Column(UUID(as_uuid=True), ForeignKey("features.id"), nullable=False)

    # Relationships
    plan = relationship("SubscriptionPlan", back_populates="plan_features")
    feature = relationship("Feature", back_populates="plan_features")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, unique=True, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    billing_cycle = Column(String(20), default="MONTHLY")  # MONTHLY, ANNUAL
    status = Column(String(50), default="TRIALING", index=True)  # TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED, PAUSED

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    trial_started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    current_period_start = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)

    provider = Column(String(50), default="manual")  # razorpay, manual
    provider_customer_id = Column(String(255), nullable=True)
    provider_subscription_id = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
    transactions = relationship("PaymentTransaction", back_populates="subscription")
    invoices = relationship("Invoice", back_populates="subscription")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True, index=True)

    provider = Column(String(50), default="razorpay")
    provider_payment_id = Column(String(255), nullable=True, index=True)
    provider_order_id = Column(String(255), nullable=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="CREATED")  # CREATED, SUCCESS, FAILED, REFUNDED
    payment_method = Column(String(50), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    subscription = relationship("Subscription", back_populates="transactions")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True, index=True)

    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="PAID")  # PAID, PENDING, VOID
    invoice_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    paid_at = Column(DateTime(timezone=True), nullable=True)
    provider_invoice_id = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    subscription = relationship("Subscription", back_populates="invoices")


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(255), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
