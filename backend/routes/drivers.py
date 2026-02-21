"""
routes/drivers.py — Driver CRUD API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from db.supabase import get_supabase
from models.drivers import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverWithUserResponse,
    DriverListResponse,
    DriverOption,
)
from models.enums import DutyStatus
from auth import DispatcherOrAbove, ManagerOrAbove, UserInDB

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("", response_model=DriverListResponse)
async def list_drivers(
    user: UserInDB = DispatcherOrAbove,
    duty_status: Optional[DutyStatus] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all drivers with user info."""
    supabase = get_supabase()
    
    # Query drivers with joined user data
    query = supabase.table("drivers").select(
        "*, users!inner(first_name, last_name, email)",
        count="exact"
    )
    
    if duty_status:
        query = query.eq("duty_status", duty_status.value)
    
    # Pagination
    query = query.range(skip, skip + limit - 1).order("id", desc=True)
    
    result = query.execute()
    
    # Transform data to match response schema
    drivers = []
    for d in result.data:
        user_data = d.pop("users", {})
        drivers.append(DriverWithUserResponse(
            **d,
            first_name=user_data.get("first_name", ""),
            last_name=user_data.get("last_name", ""),
            email=user_data.get("email", ""),
        ))
    
    return DriverListResponse(
        data=drivers,
        total=result.count or len(result.data)
    )


@router.get("/options")
async def get_driver_options(
    user: UserInDB = DispatcherOrAbove,
    available_only: bool = True,
):
    """Get driver options for dropdowns."""
    supabase = get_supabase()
    
    query = supabase.table("drivers").select(
        "id, license_number, duty_status, users!inner(first_name, last_name)"
    )
    
    if available_only:
        # Available = not on_duty and not suspended
        query = query.not_.in_("duty_status", ["on_duty", "suspended"])
    
    result = query.execute()
    
    options = []
    for d in result.data:
        user_data = d.get("users", {})
        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
        is_available = d["duty_status"] not in ["on_duty", "suspended"]
        options.append({
            "id": d["id"],
            "name": name,
            "license_number": d["license_number"],
            "is_available": is_available,
        })
    
    return options


@router.get("/{driver_id}", response_model=DriverWithUserResponse)
async def get_driver(
    driver_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Get a single driver by ID with user info."""
    supabase = get_supabase()
    
    result = supabase.table("drivers").select(
        "*, users!inner(first_name, last_name, email)"
    ).eq("id", driver_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    d = result.data[0]
    user_data = d.pop("users", {})
    
    return DriverWithUserResponse(
        **d,
        first_name=user_data.get("first_name", ""),
        last_name=user_data.get("last_name", ""),
        email=user_data.get("email", ""),
    )


@router.post("", response_model=DriverResponse, status_code=201)
async def create_driver(
    driver: DriverCreate,
    user: UserInDB = ManagerOrAbove,
):
    """
    Create a driver profile for an existing user.
    Requires Manager or Admin role.
    """
    supabase = get_supabase()
    
    # Check if user exists
    user_exists = supabase.table("users").select("id").eq("id", driver.user_id).execute()
    if not user_exists.data:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Check if driver already exists for this user
    existing_driver = supabase.table("drivers").select("id").eq("user_id", driver.user_id).execute()
    if existing_driver.data:
        raise HTTPException(status_code=400, detail="Driver profile already exists for this user")
    
    # Check for duplicate license
    existing_license = supabase.table("drivers").select("id").eq("license_number", driver.license_number).execute()
    if existing_license.data:
        raise HTTPException(status_code=400, detail="License number already registered")
    
    # Insert driver
    data = driver.model_dump()
    data["license_expiry"] = data["license_expiry"].isoformat()
    if data.get("safety_score"):
        data["safety_score"] = float(data["safety_score"])
    
    result = supabase.table("drivers").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create driver")
    
    return DriverResponse(**result.data[0])


@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    driver: DriverUpdate,
    user: UserInDB = ManagerOrAbove,
):
    """Update a driver profile. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    # Check if driver exists
    existing = supabase.table("drivers").select("id").eq("id", driver_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Filter out None values
    update_data = {k: v for k, v in driver.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert types for Supabase
    if "license_expiry" in update_data:
        update_data["license_expiry"] = update_data["license_expiry"].isoformat()
    if "safety_score" in update_data:
        update_data["safety_score"] = float(update_data["safety_score"])
    
    result = supabase.table("drivers").update(update_data).eq("id", driver_id).execute()
    
    return DriverResponse(**result.data[0])


@router.put("/{driver_id}/suspend")
async def suspend_driver(
    driver_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """Suspend a driver. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    # Check if driver exists and is not already suspended
    existing = supabase.table("drivers").select("id, duty_status").eq("id", driver_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if existing.data[0]["duty_status"] == "suspended":
        raise HTTPException(status_code=400, detail="Driver is already suspended")
    
    if existing.data[0]["duty_status"] == "on_duty":
        raise HTTPException(status_code=400, detail="Cannot suspend driver who is currently on duty")
    
    supabase.table("drivers").update({"duty_status": "suspended"}).eq("id", driver_id).execute()
    
    return {"message": f"Driver {driver_id} suspended successfully"}


@router.put("/{driver_id}/activate")
async def activate_driver(
    driver_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """Reactivate a suspended driver. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    existing = supabase.table("drivers").select("id, duty_status").eq("id", driver_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    supabase.table("drivers").update({"duty_status": "off_duty"}).eq("id", driver_id).execute()
    
    return {"message": f"Driver {driver_id} activated successfully"}


@router.delete("/{driver_id}", status_code=204)
async def delete_driver(
    driver_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """Delete a driver profile. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    existing = supabase.table("drivers").select("id, duty_status").eq("id", driver_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if existing.data[0]["duty_status"] == "on_duty":
        raise HTTPException(status_code=400, detail="Cannot delete driver who is currently on duty")
    
    supabase.table("drivers").delete().eq("id", driver_id).execute()
    
    return None
