"""
routes/vehicles.py — Vehicle CRUD API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from db.supabase import get_supabase
from models.vehicles import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleListResponse,
)
from models.enums import VehicleStatus, VehicleType
from auth import DispatcherOrAbove, ManagerOrAbove, UserInDB

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=VehicleListResponse)
async def list_vehicles(
    user: UserInDB = DispatcherOrAbove,
    status: Optional[VehicleStatus] = None,
    vehicle_type: Optional[VehicleType] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all vehicles with optional filtering."""
    supabase = get_supabase()
    
    query = supabase.table("vehicles").select("*", count="exact")
    
    # Apply filters
    if status:
        query = query.eq("status", status.value)
    else:
        # Exclude retired vehicles by default
        query = query.neq("status", "retired")
    
    if vehicle_type:
        query = query.eq("vehicle_type", vehicle_type.value)
    
    if search:
        query = query.or_(f"license_plate.ilike.%{search}%,make.ilike.%{search}%,model.ilike.%{search}%")
    
    # Pagination
    query = query.range(skip, skip + limit - 1).order("id", desc=True)
    
    result = query.execute()
    
    return VehicleListResponse(
        data=[VehicleResponse(**v) for v in result.data],
        total=result.count or len(result.data)
    )


@router.get("/options")
async def get_vehicle_options(
    user: UserInDB = DispatcherOrAbove,
    status: Optional[VehicleStatus] = VehicleStatus.idle,
):
    """Get vehicle options for dropdowns (id, plate, model)."""
    supabase = get_supabase()
    
    query = supabase.table("vehicles").select("id, license_plate, make, model, max_load_capacity_kg")
    
    if status:
        query = query.eq("status", status.value)
    else:
        query = query.neq("status", "retired")
    
    result = query.order("license_plate").execute()
    
    return [
        {
            "id": v["id"],
            "label": f"{v['make']} {v['model']} - {v['license_plate']}",
            "license_plate": v["license_plate"],
            "max_load_capacity_kg": v["max_load_capacity_kg"],
        }
        for v in result.data
    ]


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Get a single vehicle by ID."""
    supabase = get_supabase()
    
    result = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return VehicleResponse(**result.data[0])


@router.post("", response_model=VehicleResponse, status_code=201)
async def create_vehicle(
    vehicle: VehicleCreate,
    user: UserInDB = ManagerOrAbove,
):
    """Register a new vehicle. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    # Check for duplicate license plate
    existing = supabase.table("vehicles").select("id").eq("license_plate", vehicle.license_plate).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Vehicle with this license plate already exists")
    
    # Insert vehicle
    data = vehicle.model_dump()
    # Convert Decimal to float for Supabase
    data["max_load_capacity_kg"] = float(data["max_load_capacity_kg"])
    data["current_odometer_km"] = float(data["current_odometer_km"])
    
    result = supabase.table("vehicles").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create vehicle")
    
    return VehicleResponse(**result.data[0])


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    user: UserInDB = ManagerOrAbove,
):
    """Update a vehicle. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    # Check if vehicle exists
    existing = supabase.table("vehicles").select("id").eq("id", vehicle_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Filter out None values
    update_data = {k: v for k, v in vehicle.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert Decimal to float for Supabase
    if "max_load_capacity_kg" in update_data:
        update_data["max_load_capacity_kg"] = float(update_data["max_load_capacity_kg"])
    if "current_odometer_km" in update_data:
        update_data["current_odometer_km"] = float(update_data["current_odometer_km"])
    
    result = supabase.table("vehicles").update(update_data).eq("id", vehicle_id).execute()
    
    return VehicleResponse(**result.data[0])


@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(
    vehicle_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """
    Retire a vehicle (soft delete by setting status to 'retired').
    Requires Manager or Admin role.
    """
    supabase = get_supabase()
    
    # Check if vehicle exists
    existing = supabase.table("vehicles").select("id, status").eq("id", vehicle_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if existing.data[0]["status"] == "on_trip":
        raise HTTPException(status_code=400, detail="Cannot retire a vehicle that is on a trip")
    
    # Soft delete by setting status to retired
    supabase.table("vehicles").update({"status": "retired"}).eq("id", vehicle_id).execute()
    
    return None
