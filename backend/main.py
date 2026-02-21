"""
main.py — FleetFlow API entrypoint.
Mounts all API routers with CORS support for the Next.js frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv
load_dotenv()  # before anything else


from auth import auth_router
from routes import (
    vehicles_router,
    drivers_router,
    trips_router,
    maintenance_router,
    expenses_router,
    fuel_logs_router,
    analytics_router,
)

# ---------------------------------------------------------------------------
# App Configuration
# ---------------------------------------------------------------------------

app = FastAPI(
    title="FleetFlow API",
    description="Fleet & Logistics Management System API",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS Middleware — Allow Next.js frontend
# ---------------------------------------------------------------------------

# Configure allowed origins (update for production)
origins = [
    "http://localhost:3000",      # Next.js dev server
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    os.getenv("FRONTEND_URL", ""),  # Production frontend URL from env
]
# Filter out empty strings
origins = [o for o in origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount Routers
# ---------------------------------------------------------------------------

# Auth routes: /auth/register, /auth/login, /auth/refresh, /auth/me
app.include_router(auth_router)

# Resource routes
app.include_router(vehicles_router)      # /vehicles
app.include_router(drivers_router)       # /drivers
app.include_router(trips_router)         # /trips
app.include_router(maintenance_router)   # /maintenance
app.include_router(expenses_router)      # /expenses
app.include_router(fuel_logs_router)     # /fuel-logs
app.include_router(analytics_router)     # /analytics


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "fleetflow-api"}


@app.get("/", tags=["Root"])
async def root():
    """API root endpoint."""
    return {
        "message": "Welcome to FleetFlow API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ---------------------------------------------------------------------------
# Run Configuration
# ---------------------------------------------------------------------------
# Dependencies:
#   pip install fastapi uvicorn "python-jose[cryptography]" passlib[bcrypt] pydantic[email] supabase python-dotenv
#
# Run:
#   uvicorn main:app --reload --port 8000
