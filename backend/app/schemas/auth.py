from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import uuid
from datetime import datetime


class RegisterRequest(BaseModel):
    full_name: str
    company_name: str
    mobile: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("mobile")
    @classmethod
    def mobile_valid(cls, v):
        digits = v.replace("+", "").replace("-", "").replace(" ", "")
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Invalid mobile number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    email: EmailStr
    full_name: str
    firebase_uid: Optional[str] = None



class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    mobile: Optional[str]
    role: str
    organization_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    subscription_status: str

    class Config:
        from_attributes = True


class MeResponse(BaseModel):
    user: UserResponse
    organization: Optional[OrganizationResponse]
