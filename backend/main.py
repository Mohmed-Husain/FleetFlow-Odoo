"""
main.py — FleetFlow API entrypoint.
Shows how to mount the auth router and use RBAC guards on other routes.
"""

from fastapi import FastAPI, Depends

import os
from dotenv import load_dotenv
load_dotenv()  # before anything else


from auth import (
    auth_router,
    UserInDB,
    AnyAuthenticatedUser,
    ManagerOrAbove,
    DispatcherOrAbove,
    require_roles,
    UserRole,
)

app = FastAPI(title="FleetFlow API", version="0.1.0")

# Mount auth routes: /auth/register, /auth/login, /auth/refresh, /auth/me
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Example protected routes — replace bodies with real logic
# ---------------------------------------------------------------------------

@app.get("/vehicles")
async def list_vehicles(user: UserInDB = DispatcherOrAbove):
    """Dispatchers, Managers, and Admins can list vehicles."""
    return {"message": f"Hello {user.first_name}, here are your vehicles."}


@app.post("/vehicles")
async def add_vehicle(user: UserInDB = ManagerOrAbove):
    """Only Managers and Admins can register new vehicles."""
    return {"message": "Vehicle added."}


@app.get("/trips")
async def list_trips(user: UserInDB = DispatcherOrAbove):
    return {"message": "Trip list."}


@app.post("/trips")
async def create_trip(user: UserInDB = DispatcherOrAbove):
    """Dispatchers create trips; cargo validation lives in the service layer."""
    return {"message": "Trip created."}


@app.get("/reports")
async def financial_reports(
    # Financial Analysts are 'viewer' by default in the schema; promote them
    # to 'manager' if they should see reports, or add a dedicated analyst role.
    user: UserInDB = ManagerOrAbove,
):
    return {"message": "Reports."}


@app.put("/drivers/{driver_id}/suspend")
async def suspend_driver(
    driver_id: int,
    user: UserInDB = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    """Only Admins and Managers can suspend drivers."""
    return {"message": f"Driver {driver_id} suspended by {user.email}."}


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
# pip install fastapi uvicorn "python-jose[cryptography]" passlib[bcrypt] pydantic[email]
#
# Run:
#   uvicorn main:app --reload
