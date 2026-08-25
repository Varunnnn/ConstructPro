from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import time

from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.workers import worker_router, project_worker_router
from app.api.attendance import router as attendance_router
from app.api.transactions import expenses_router, materials_router
from app.api.reports import router as reports_router
from app.api.dashboard import router as dashboard_router
from app.api.master_data import router as master_data_router
from app.api.billing import router as billing_router
from app.api.admin import router as admin_router
from app.api.new_modules import router as new_modules_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 ConstructPro API starting up...")
    yield
    # Shutdown
    print("👋 ConstructPro API shutting down...")


# ─── Security Headers Middleware ────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if settings.APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Remove server identification header if present
        try:
            del response.headers["server"]
        except KeyError:
            pass
        return response


app = FastAPI(
    title="ConstructPro API",
    description="Construction Contractor Management SaaS — Control every project, every worker, every rupee.",
    version="1.0.0",
    lifespan=lifespan,
    # Hide docs in production to prevent API discovery
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
)

# ─── Security Headers ────────────────────────────────────────────────────────
app.add_middleware(SecurityHeadersMiddleware)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Only allow specific known origins — never use wildcard in production
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
if settings.APP_ENV == "production" and settings.FRONTEND_URL:
    ALLOWED_ORIGINS = [settings.FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    expose_headers=["X-Total-Count"],
    max_age=600,
)

# API routers
API_PREFIX = "/api"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(projects_router, prefix=API_PREFIX)
app.include_router(worker_router, prefix=API_PREFIX)
app.include_router(project_worker_router, prefix=API_PREFIX)
app.include_router(attendance_router, prefix=API_PREFIX)
app.include_router(expenses_router, prefix=API_PREFIX)
app.include_router(materials_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(master_data_router, prefix=API_PREFIX)
app.include_router(billing_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(new_modules_router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "app": "ConstructPro API",
        "version": "1.0.0",
        "tagline": "Control every project. Every worker. Every rupee.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
