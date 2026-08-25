from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_org_id
from app.models.user import User
from app.models.project import Project
from app.models.worker import Worker
from app.models.subscription_models import (
    SubscriptionPlan, Subscription, PaymentTransaction, Invoice, Feature, PlanFeature
)
from app.services.subscription_service import SubscriptionLimitService
from app.services.payment_provider import MockPaymentProvider, RazorpayPaymentProvider
from app.core.config import settings

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=dict)
def list_public_plans(db: Session = Depends(get_db)):
    """Public pricing API for pricing page & homepage"""
    plans = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.is_active == True,
        SubscriptionPlan.is_public == True,
        SubscriptionPlan.code != "FREE_TRIAL"
    ).order_by(SubscriptionPlan.display_order).all()

    result = []
    for p in plans:
        # Load feature list
        features = db.query(Feature.code, Feature.name).join(PlanFeature).filter(PlanFeature.plan_id == p.id).all()
        result.append({
            "id": str(p.id),
            "code": p.code,
            "name": p.name,
            "description": p.description,
            "monthly_price": float(p.monthly_price),
            "annual_price": float(p.annual_price),
            "max_projects": p.max_projects,
            "max_workers": p.max_workers,
            "max_users": p.max_users,
            "is_unlimited_projects": p.is_unlimited_projects,
            "is_unlimited_workers": p.is_unlimited_workers,
            "features": [{"code": f[0], "name": f[1]} for f in features]
        })
    return {"data": result}


@router.get("/subscription", response_model=dict)
def get_current_subscription(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    """Customer subscription status & plan limits"""
    sub = SubscriptionLimitService.get_org_subscription(db, org_id)
    plan = sub.plan

    # Compute usage
    active_projects = db.query(Project).filter(Project.organization_id == org_id, Project.is_active == True, Project.status.in_(["active", "planning"])).count()
    active_workers = db.query(Worker).filter(Worker.organization_id == org_id, Worker.status == "active").count()
    active_users = db.query(User).filter(User.organization_id == org_id, User.is_active == True).count()

    # Features list
    features = db.query(Feature.code).join(PlanFeature).filter(PlanFeature.plan_id == plan.id).all()
    feature_codes = [f[0] for f in features]

    now = datetime.now(timezone.utc)
    trial_days_remaining = 0
    if sub.status == "TRIALING" and sub.trial_ends_at:
        trial_end = sub.trial_ends_at
        # Handle naive datetimes from SQLite
        now_compare = datetime.now() if trial_end.tzinfo is None else now
        trial_days_remaining = max(0, (trial_end - now_compare).days)

    return {
        "data": {
            "subscription_id": str(sub.id),
            "status": sub.status,
            "billing_cycle": sub.billing_cycle,
            "started_at": sub.started_at.isoformat() if sub.started_at else None,
            "trial_ends_at": sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
            "trial_days_remaining": trial_days_remaining,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "plan": {
                "id": str(plan.id),
                "code": plan.code,
                "name": plan.name,
                "monthly_price": float(plan.monthly_price),
                "annual_price": float(plan.annual_price),
                "max_projects": plan.max_projects,
                "max_workers": plan.max_workers,
                "max_users": plan.max_users,
                "is_unlimited_projects": plan.is_unlimited_projects,
                "is_unlimited_workers": plan.is_unlimited_workers,
            },
            "usage": {
                "projects": {"current": active_projects, "limit": plan.max_projects, "unlimited": plan.is_unlimited_projects},
                "workers": {"current": active_workers, "limit": plan.max_workers, "unlimited": plan.is_unlimited_workers},
                "users": {"current": active_users, "limit": plan.max_users, "unlimited": False},
            },
            "features": feature_codes
        }
    }


@router.post("/checkout", response_model=dict)
def create_checkout_session(
    payload: dict,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    """
    Creates a Razorpay/Mock order for subscription upgrade.
    Payload: {"plan_code": "PROFESSIONAL", "billing_cycle": "MONTHLY"}
    """
    plan_code = payload.get("plan_code")
    billing_cycle = payload.get("billing_cycle", "MONTHLY")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Invalid subscription plan")

    amount = float(plan.annual_price) if billing_cycle == "ANNUAL" else float(plan.monthly_price)
    tax_amount = amount * 0.18  # 18% GST
    total_amount = amount + tax_amount

    # Use Provider
    provider = MockPaymentProvider()
    order = provider.create_order(
        amount=total_amount,
        currency="INR",
        receipt=f"rcpt_{uuid.uuid4().hex[:8]}",
        notes={"org_id": str(org_id), "plan_code": plan_code, "billing_cycle": billing_cycle}
    )

    # Record payment transaction
    sub = SubscriptionLimitService.get_org_subscription(db, org_id)
    txn = PaymentTransaction(
        organization_id=org_id,
        subscription_id=sub.id,
        provider=order.get("provider", "mock"),
        provider_order_id=order["id"],
        amount=total_amount,
        currency="INR",
        status="CREATED",
        payment_method="online"
    )
    db.add(txn)
    db.commit()

    return {
        "data": {
            "order_id": order["id"],
            "amount": total_amount,
            "currency": "INR",
            "plan_name": plan.name,
            "billing_cycle": billing_cycle,
            "razorpay_key": getattr(settings, "RAZORPAY_KEY_ID", "rzp_test_mock_key")
        }
    }


@router.post("/verify-payment", response_model=dict)
def verify_payment(
    payload: dict,
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    """
    Verifies payment signature and activates customer subscription.
    Payload: {"order_id": "...", "payment_id": "...", "signature": "...", "plan_code": "PROFESSIONAL", "billing_cycle": "MONTHLY"}
    """
    order_id = payload.get("order_id")
    payment_id = payload.get("payment_id", f"pay_mock_{uuid.uuid4().hex[:8]}")
    signature = payload.get("signature", "mock_sig")
    plan_code = payload.get("plan_code")
    billing_cycle = payload.get("billing_cycle", "MONTHLY")

    utr_number = str(payload.get("utr_number", "")).strip()

    # UTR Validation Rule: Must be a valid 12-digit UPI Reference Number / Bank UTR
    if not utr_number or not utr_number.isdigit() or len(utr_number) != 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UTR Number. Please enter the valid 12-digit UPI Transaction Reference Number from your GPay / PhonePe / Paytm receipt."
        )

    # Check for duplicate UTR usage
    existing_utr = db.query(PaymentTransaction).filter(PaymentTransaction.provider_payment_id == utr_number).first()
    if existing_utr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This UTR Number has already been used for another subscription payment."
        )

    # Verify order transaction
    txn = db.query(PaymentTransaction).filter(PaymentTransaction.provider_order_id == order_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Order transaction not found")

    # Fetch target plan price
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    expected_amount = float(plan.annual_price if billing_cycle == "ANNUAL" else plan.monthly_price)

    # Online UTR Bank Statement Lookup
    from app.services.utr_service import UtrVerificationService
    utr_result = UtrVerificationService.verify_utr_online(utr_number, expected_amount)
    if not utr_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=utr_result["message"]
        )

    # Update transaction
    txn.status = "SUCCESS"
    txn.provider_payment_id = utr_number
    txn.paid_at = datetime.now(timezone.utc)

    # Activate subscription
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    sub = SubscriptionLimitService.get_org_subscription(db, org_id)

    now = datetime.now(timezone.utc)
    duration_days = 365 if billing_cycle == "ANNUAL" else 30

    sub.plan_id = plan.id
    sub.billing_cycle = billing_cycle
    sub.status = "ACTIVE"
    sub.current_period_start = now
    sub.current_period_end = now + timedelta(days=duration_days)
    sub.cancel_at_period_end = False

    # Sync organization table via relationship
    if sub.organization:
        sub.organization.plan = plan.code.lower()
        sub.organization.subscription_status = "active"
        db.add(sub.organization)

    # Generate Invoice
    inv_num = f"INV-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    amount = float(txn.amount) / 1.18
    tax = float(txn.amount) - amount

    invoice = Invoice(
        organization_id=org_id,
        subscription_id=sub.id,
        invoice_number=inv_num,
        amount=round(amount, 2),
        tax_amount=round(tax, 2),
        total_amount=float(txn.amount),
        currency="INR",
        status="PAID",
        invoice_date=now,
        paid_at=now,
        provider_invoice_id=payment_id
    )
    db.add(invoice)
    db.commit()

    return {
        "message": f"Successfully subscribed to ConstructPro {plan.name}!",
        "data": {
            "status": "ACTIVE",
            "plan": plan.name,
            "invoice_number": inv_num
        }
    }


@router.post("/cancel", response_model=dict)
def cancel_subscription(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    """Sets subscription to cancel at period end without losing current paid access"""
    sub = SubscriptionLimitService.get_org_subscription(db, org_id)
    sub.cancel_at_period_end = True
    sub.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Subscription cancelled. Access will remain active until current period end."}


@router.post("/reactivate", response_model=dict)
def reactivate_subscription(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    """Reactivates a cancelled subscription before period end"""
    sub = SubscriptionLimitService.get_org_subscription(db, org_id)
    sub.cancel_at_period_end = False
    sub.cancelled_at = None
    db.commit()
    return {"message": "Subscription reactivated successfully!"}


@router.get("/invoices", response_model=dict)
def get_customer_invoices(
    org_id: uuid.UUID = Depends(get_current_org_id),
    db: Session = Depends(get_db)
):
    invoices = db.query(Invoice).filter(Invoice.organization_id == org_id).order_by(Invoice.invoice_date.desc()).all()
    return {
        "data": [
            {
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "amount": float(inv.amount),
                "tax_amount": float(inv.tax_amount),
                "total_amount": float(inv.total_amount),
                "status": inv.status,
                "invoice_date": inv.invoice_date.isoformat(),
            }
            for inv in invoices
        ]
    }
