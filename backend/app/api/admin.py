from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.models.project import Project
from app.models.worker import Worker
from app.models.subscription_models import (
    SubscriptionPlan, Subscription, PaymentTransaction, Invoice, AdminAuditLog
)

router = APIRouter(prefix="/admin", tags=["admin"])


def require_super_admin(current_user: User = Depends(get_current_user)):
    """RBAC Guard: Enforces Super Admin access server-side"""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required to access Admin Portal"
        )
    return current_user


@router.get("/dashboard", response_model=dict)
def get_admin_dashboard(
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Platform Super Admin Dashboard — Real MRR/ARR & Metrics"""
    total_orgs = db.query(Organization).count()
    active_subs = db.query(Subscription).filter(Subscription.status == "ACTIVE").all()
    trials_count = db.query(Subscription).filter(Subscription.status == "TRIALING").count()
    expired_count = db.query(Subscription).filter(Subscription.status == "EXPIRED").count()
    cancelled_count = db.query(Subscription).filter(Subscription.status == "CANCELLED").count()

    # Calculate real MRR & ARR from active paid subscriptions
    mrr = 0.0
    plan_distribution = {"STARTER": 0, "PROFESSIONAL": 0, "BUSINESS": 0, "ENTERPRISE": 0}

    for sub in active_subs:
        plan = sub.plan
        if plan.code in plan_distribution:
            plan_distribution[plan.code] += 1

        if sub.billing_cycle == "ANNUAL":
            mrr += float(plan.annual_price) / 12.0
        else:
            mrr += float(plan.monthly_price)

    arr = mrr * 12.0

    # Total Platform Usage
    total_projects = db.query(Project).count()
    total_workers = db.query(Worker).count()
    total_users = db.query(User).count()

    # Trial Conversion Rate
    paid_count = len(active_subs)
    total_conversions_denominator = paid_count + expired_count
    conversion_rate = (paid_count / total_conversions_denominator * 100.0) if total_conversions_denominator > 0 else 0.0

    return {
        "data": {
            "mrr": round(mrr, 2),
            "arr": round(arr, 2),
            "organizations": {
                "total": total_orgs,
                "active_paid": paid_count,
                "trialing": trials_count,
                "expired": expired_count,
                "cancelled": cancelled_count,
            },
            "plan_distribution": plan_distribution,
            "usage": {
                "total_projects": total_projects,
                "total_workers": total_workers,
                "total_users": total_users,
            },
            "trial_conversion_rate_pct": round(conversion_rate, 1)
        }
    }


@router.get("/organizations", response_model=dict)
def list_organizations(
    search: str = Query(None),
    status_filter: str = Query(None),
    plan_filter: str = Query(None),
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List customer organizations with subscription info"""
    query = db.query(Organization)
    if search:
        query = query.filter(Organization.name.ilike(f"%{search}%"))

    orgs = query.order_by(Organization.created_at.desc()).all()

    result = []
    for org in orgs:
        owner = db.query(User).filter(User.organization_id == org.id).first()
        sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
        projects_count = db.query(Project).filter(Project.organization_id == org.id).count()
        workers_count = db.query(Worker).filter(Worker.organization_id == org.id).count()

        if status_filter and sub and sub.status != status_filter:
            continue
        if plan_filter and sub and sub.plan.code != plan_filter:
            continue

        result.append({
            "id": str(org.id),
            "name": org.name,
            "owner": {
                "name": owner.full_name if owner else "—",
                "email": owner.email if owner else "—",
                "mobile": owner.mobile if owner else "—",
            },
            "subscription": {
                "status": sub.status if sub else "NONE",
                "plan_code": sub.plan.code if sub else "NONE",
                "plan_name": sub.plan.name if sub else "NONE",
                "billing_cycle": sub.billing_cycle if sub else "—",
                "trial_ends_at": sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
                "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
            },
            "usage": {
                "projects": projects_count,
                "workers": workers_count,
            },
            "created_at": org.created_at.isoformat()
        })

    return {"data": result}


@router.post("/organizations/{org_id}/assign-plan", response_model=dict)
def admin_assign_plan(
    org_id: uuid.UUID,
    payload: dict,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin action: Assign custom/Enterprise plan or override subscription.
    Payload: {"plan_code": "ENTERPRISE", "billing_cycle": "ANNUAL", "custom_price": 7500}
    """
    plan_code = payload.get("plan_code")
    billing_cycle = payload.get("billing_cycle", "MONTHLY")

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    sub = db.query(Subscription).filter(Subscription.organization_id == org_id).first()
    if not sub:
        sub = Subscription(organization_id=org_id, plan_id=plan.id)
        db.add(sub)

    old_plan_name = sub.plan.name if sub.plan else "None"

    now = datetime.now(timezone.utc)
    sub.plan_id = plan.id
    sub.billing_cycle = billing_cycle
    sub.status = "ACTIVE"
    sub.current_period_start = now
    sub.current_period_end = now + timedelta(days=365 if billing_cycle == "ANNUAL" else 30)

    # Explicitly update organization table columns using target plan
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org:
        org.plan = plan.code.lower()
        org.subscription_status = "active"
        db.add(org)

    # Audit log
    audit = AdminAuditLog(
        admin_user_id=admin.id,
        action="ASSIGN_PLAN",
        target_type="organization",
        target_id=str(org_id),
        old_value=old_plan_name,
        new_value=plan.name
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully assigned {plan.name} to organization"}


@router.post("/organizations/{org_id}/extend-trial", response_model=dict)
def admin_extend_trial(
    org_id: uuid.UUID,
    payload: dict,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin action: Extend free trial by N days"""
    extra_days = payload.get("days", 14)
    sub = db.query(Subscription).filter(Subscription.organization_id == org_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    now = datetime.now(timezone.utc)
    sub.status = "TRIALING"
    sub.trial_ends_at = (sub.trial_ends_at or now) + timedelta(days=extra_days)
    sub.current_period_end = sub.trial_ends_at

    # Sync organization table columns via relationship
    if sub.organization:
        sub.organization.subscription_status = "trial"
        sub.organization.trial_ends_at = sub.trial_ends_at
        db.add(sub.organization)

    audit = AdminAuditLog(
        admin_user_id=admin.id,
        action="EXTEND_TRIAL",
        target_type="organization",
        target_id=str(org_id),
        new_value=f"Extended trial by {extra_days} days to {sub.trial_ends_at.isoformat()}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Trial extended by {extra_days} days"}


@router.get("/audit-logs", response_model=dict)
def get_admin_audit_logs(
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(100).all()
    return {
        "data": [
            {
                "id": str(l.id),
                "action": l.action,
                "target_type": l.target_type,
                "target_id": l.target_id,
                "old_value": l.old_value,
                "new_value": l.new_value,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs
        ]
    }
