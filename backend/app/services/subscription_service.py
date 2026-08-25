from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
import uuid

from app.models.subscription_models import SubscriptionPlan, Subscription, Feature, PlanFeature
from app.models.project import Project
from app.models.worker import Worker
from app.models.user import User


class SubscriptionLimitService:
    @staticmethod
    def get_org_subscription(db: Session, org_id: uuid.UUID) -> Subscription:
        sub = db.query(Subscription).filter(Subscription.organization_id == org_id).first()
        if not sub:
            # Fallback: create free trial
            trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "FREE_TRIAL").first()
            if not trial_plan:
                raise HTTPException(status_code=500, detail="Free trial plan not found")
            now = datetime.now(timezone.utc)
            sub = Subscription(
                organization_id=org_id,
                plan_id=trial_plan.id,
                billing_cycle="MONTHLY",
                status="TRIALING",
                started_at=now,
                trial_started_at=now,
                trial_ends_at=now + timedelta(days=30),
                current_period_start=now,
                current_period_end=now + timedelta(days=30),
                provider="manual"
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)
        
        # Check trial expiry
        now = datetime.now(timezone.utc)
        if sub.status == "TRIALING" and sub.trial_ends_at:
            trial_end = sub.trial_ends_at
            # Handle both naive and aware datetimes (SQLite stores naive)
            if trial_end.tzinfo is None:
                now_compare = datetime.now()  # naive
            else:
                now_compare = now
            if trial_end < now_compare:
                sub.status = "EXPIRED"
                db.commit()

        return sub

    @staticmethod
    def check_project_limit(db: Session, org_id: uuid.UUID):
        sub = SubscriptionLimitService.get_org_subscription(db, org_id)
        if sub.status in ["EXPIRED", "CANCELLED"] and not sub.plan.is_unlimited_projects:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "SUBSCRIPTION_EXPIRED",
                    "message": "Your subscription has expired. Upgrade your plan to create projects.",
                    "upgrade_required": True
                }
            )

        if sub.plan.is_unlimited_projects:
            return True

        active_projects_count = db.query(Project).filter(
            Project.organization_id == org_id,
            Project.is_active == True,
            Project.status.in_(["active", "planning"])
        ).count()

        if active_projects_count >= sub.plan.max_projects:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PROJECT_LIMIT_REACHED",
                    "message": f"Your {sub.plan.name} plan allows up to {sub.plan.max_projects} active project(s). Upgrade to add more.",
                    "upgrade_required": True,
                    "recommended_plan": "PROFESSIONAL" if sub.plan.code in ["FREE_TRIAL", "STARTER"] else "BUSINESS"
                }
            )
        return True

    @staticmethod
    def check_worker_limit(db: Session, org_id: uuid.UUID):
        sub = SubscriptionLimitService.get_org_subscription(db, org_id)
        if sub.status in ["EXPIRED", "CANCELLED"] and not sub.plan.is_unlimited_workers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "SUBSCRIPTION_EXPIRED",
                    "message": "Your subscription has expired. Upgrade your plan to add workers.",
                    "upgrade_required": True
                }
            )

        if sub.plan.is_unlimited_workers:
            return True

        active_workers_count = db.query(Worker).filter(
            Worker.organization_id == org_id,
            Worker.status == "active"
        ).count()

        if active_workers_count >= sub.plan.max_workers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "WORKER_LIMIT_REACHED",
                    "message": f"Your {sub.plan.name} plan allows up to {sub.plan.max_workers} active workers. Upgrade to Professional for unlimited workers.",
                    "upgrade_required": True,
                    "recommended_plan": "PROFESSIONAL"
                }
            )
        return True

    @staticmethod
    def check_user_limit(db: Session, org_id: uuid.UUID):
        sub = SubscriptionLimitService.get_org_subscription(db, org_id)
        users_count = db.query(User).filter(User.organization_id == org_id, User.is_active == True).count()
        if users_count >= sub.plan.max_users:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "USER_LIMIT_REACHED",
                    "message": f"Your {sub.plan.name} plan allows up to {sub.plan.max_users} user(s). Upgrade to add more team members.",
                    "upgrade_required": True
                }
            )
        return True

    @staticmethod
    def has_feature(db: Session, org_id: uuid.UUID, feature_code: str) -> bool:
        sub = SubscriptionLimitService.get_org_subscription(db, org_id)
        if sub.status == "EXPIRED":
            return False

        # Query plan features
        feat = db.query(Feature).filter(Feature.code == feature_code).first()
        if not feat:
            return False

        pf = db.query(PlanFeature).filter(
            PlanFeature.plan_id == sub.plan_id,
            PlanFeature.feature_id == feat.id
        ).first()
        return pf is not None

    @staticmethod
    def require_feature_dep(feature_code: str):
        def dependency(org_id: uuid.UUID = None, db: Session = None):
            # Enforce feature
            pass
        return dependency
