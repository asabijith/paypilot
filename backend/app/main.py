import time
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.config import settings
from app.database import init_db, SessionLocal, engine
from app.seed_data import seed_database
from app.routes import (
    auth, dashboard, employees, attendance,
    leave, salary_structure, payroll, auditor,
    assistant, reports, seed, billing, intelligence,
    expenses, tax_vault, contractors, compliance
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Commercial-Ready AI-Powered HR & Payroll SaaS for Indian Startups & SMEs",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. DevSecOps Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# 2. CORS configuration (explicitly whitelisted trusted origins with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# 3. Include Routers
app.include_router(auth.router)
app.include_router(billing.router)
app.include_router(dashboard.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(salary_structure.router)
app.include_router(payroll.router)
app.include_router(auditor.router)
app.include_router(assistant.router)
app.include_router(reports.router)
app.include_router(seed.router)
app.include_router(intelligence.router)
app.include_router(expenses.router)
app.include_router(tax_vault.router)
app.include_router(contractors.router)
app.include_router(compliance.router)

@app.on_event("startup")
def startup_event():
    init_db()
    db = SessionLocal()
    try:
        seed_database(db=db, force=False)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Smarter Payroll. Confident Decisions.",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Liveness probe reporting backend availability."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION
    }

@app.get("/ready")
def readiness_check():
    """Readiness probe checking database connectivity and system status."""
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "disconnected", "error": str(e)}
        )

    return {
        "status": "ready",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }
