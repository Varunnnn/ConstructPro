from fastapi import APIRouter, Depends, HTTPException, Request, status as http_status
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime, timezone
import threading

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import RegisterRequest, LoginRequest, GoogleLoginRequest, TokenResponse, MeResponse, UserResponse, OrganizationResponse, RefreshRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

# ─── In-memory rate limiter (brute-force protection) ────────────────────────
# Format: {ip: [(timestamp, count_in_window)]}
_rate_store: dict = defaultdict(list)
_rate_lock = threading.Lock()
RATE_WINDOW_SECONDS = 60
RATE_MAX_ATTEMPTS = 15  # max login attempts per minute per IP


def _check_rate_limit(request: Request):
    """Raises 429 if the client IP exceeds login attempts in the window."""
    ip = request.client.host if request.client else "unknown"
    now = datetime.now(timezone.utc).timestamp()
    with _rate_lock:
        # Purge old entries
        _rate_store[ip] = [t for t in _rate_store[ip] if now - t < RATE_WINDOW_SECONDS]
        if len(_rate_store[ip]) >= RATE_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a minute before trying again.",
                headers={"Retry-After": "60"}
            )
        _rate_store[ip].append(now)


@router.post("/google", response_model=dict)
def google_login(request: Request, data: GoogleLoginRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    result = auth_service.google_login_user(db, data.email, data.full_name)
    return {
        "data": {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "user": UserResponse.model_validate(result["user"]).model_dump(),
            "organization": OrganizationResponse.model_validate(result["organization"]).model_dump() if result["organization"] else None,
        },
        "message": "Google login successful",
    }




@router.post("/register", response_model=dict)
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    result = auth_service.register_user(db, data)
    return {
        "data": {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "user": UserResponse.model_validate(result["user"]).model_dump(),
            "organization": OrganizationResponse.model_validate(result["organization"]).model_dump(),
        },
        "message": "Registration successful",
    }


@router.post("/login", response_model=dict)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    result = auth_service.login_user(db, data)
    return {
        "data": {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "user": UserResponse.model_validate(result["user"]).model_dump(),
            "organization": OrganizationResponse.model_validate(result["organization"]).model_dump() if result["organization"] else None,
        },
        "message": "Login successful",
    }


@router.post("/refresh", response_model=dict)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    result = auth_service.refresh_tokens(db, data.refresh_token)
    return {"data": result, "message": "Token refreshed"}


@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
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
    return {
        "data": {
            "user": UserResponse.model_validate(current_user).model_dump(),
            "organization": OrganizationResponse.model_validate(org).model_dump() if org else None,
        }
    }
