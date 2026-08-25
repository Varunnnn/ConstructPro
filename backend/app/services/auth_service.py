from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from collections import defaultdict
import threading
import uuid
import re

from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug[:50]


def _unique_slug(db: Session, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def _validate_email(email: str) -> str:
    """Basic email format check and normalise to lowercase."""
    email = email.strip().lower()[:254]
    if not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid email address")
    return email


def register_user(db: Session, data: RegisterRequest) -> dict:
    # Sanitise inputs
    email = _validate_email(data.email)
    full_name = data.full_name.strip()[:100]
    company_name = data.company_name.strip()[:150]
    mobile = (data.mobile or '').strip()[:20]

    if len(data.password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters")
    if len(data.password) > 128:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password too long")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Create organization
    base_slug = _slugify(company_name)
    slug = _unique_slug(db, base_slug)
    org = Organization(name=company_name, slug=slug)
    db.add(org)
    db.flush()

    # Create user
    user = User(
        full_name=full_name,
        email=email,
        mobile=mobile,
        hashed_password=hash_password(data.password),
        organization_id=org.id,
    )
    db.add(user)
    db.flush()

    # Create membership
    member = OrganizationMember(organization_id=org.id, user_id=user.id, role="owner")
    db.add(member)

    # Automatically create 30-day FREE_TRIAL subscription
    from app.models.subscription_models import SubscriptionPlan, Subscription
    from datetime import datetime, timedelta, timezone
    trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "FREE_TRIAL").first()
    if trial_plan:
        now = datetime.now(timezone.utc)
        sub = Subscription(
            organization_id=org.id,
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
    db.refresh(user)
    db.refresh(org)

    access_token = create_access_token({"sub": str(user.id), "org_id": str(org.id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "org_id": str(org.id)})

    return {"user": user, "organization": org, "access_token": access_token, "refresh_token": refresh_token}


# In-memory tracking of failed login attempts per account
_failed_attempts: dict = defaultdict(int)
_failed_lock = threading.Lock()
MAX_FAILED_ATTEMPTS = 5


def login_user(db: Session, data: LoginRequest) -> dict:
    email = _validate_email(data.email)
    user = db.query(User).filter(User.email == email, User.is_active == True).first()

    with _failed_lock:
        if _failed_attempts[email] >= MAX_FAILED_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ACCOUNT_LOCKED_PASSWORD_RESET_REQUIRED",
                    "message": "Account locked due to 5 consecutive wrong password attempts. Please reset your password or contact support to unlock."
                }
            )

    if not user or not verify_password(data.password, user.hashed_password):
        with _failed_lock:
            _failed_attempts[email] += 1
            attempts_left = MAX_FAILED_ATTEMPTS - _failed_attempts[email]
            if attempts_left <= 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "ACCOUNT_LOCKED_PASSWORD_RESET_REQUIRED",
                        "message": "Account locked due to 5 consecutive wrong password attempts. Please reset your password or contact support to unlock."
                    }
                )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. {attempts_left} attempt(s) remaining before account lockout."
        )

    # Successful login — reset failed attempts
    with _failed_lock:
        _failed_attempts[email] = 0

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if org:
        from app.models.subscription_models import Subscription, SubscriptionPlan
        sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
        if sub and sub.plan_id:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
            if plan:
                org.plan = plan.code.lower()
                org.subscription_status = sub.status.lower()
                db.add(org)
                db.commit()
                db.refresh(org)

    access_token = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "org_id": str(user.organization_id)})

    return {"user": user, "organization": org, "access_token": access_token, "refresh_token": refresh_token}


def google_login_user(db: Session, email_str: str, full_name_str: str) -> dict:
    email = _validate_email(email_str)
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create organization & user automatically for Google login
        company_name = f"{full_name_str}'s Org"
        base_slug = _slugify(company_name)
        slug = _unique_slug(db, base_slug)
        org = Organization(name=company_name, slug=slug)
        db.add(org)
        db.flush()

        user = User(
            full_name=full_name_str,
            email=email,
            hashed_password=hash_password(uuid.uuid4().hex),
            organization_id=org.id,
        )
        db.add(user)
        db.flush()

        member = OrganizationMember(organization_id=org.id, user_id=user.id, role="owner")
        db.add(member)

        from app.models.subscription_models import SubscriptionPlan, Subscription
        from datetime import datetime, timedelta, timezone
        trial_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "FREE_TRIAL").first()
        if trial_plan:
            now = datetime.now(timezone.utc)
            sub = Subscription(
                organization_id=org.id,
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
        db.refresh(user)
        db.refresh(org)
    else:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()

    access_token = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "org_id": str(user.organization_id)})

    return {"user": user, "organization": org, "access_token": access_token, "refresh_token": refresh_token}



def refresh_tokens(db: Session, refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
    new_refresh = create_refresh_token({"sub": str(user.id), "org_id": str(user.organization_id)})
    return {"access_token": new_access, "refresh_token": new_refresh}
