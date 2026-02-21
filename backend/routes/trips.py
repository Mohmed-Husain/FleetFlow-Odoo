"""
routes/trips.py — Trip CRUD API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from db.supabase import get_supabase
from models.trips import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TripDetailResponse,
    TripListResponse,
)
from models.enums import TripStatus
from auth import DispatcherOrAbove, UserInDB

router = APIRouter(prefix="/trips", tags=["Trips"])


def _build_trip_detail(trip: dict, vehicles: dict, drivers: dict) -> TripDetailResponse:
    """Helper to build TripDetailResponse with joined data."""
    vehicle = vehicles.get(trip["vehicle_id"], {})
    driver = drivers.get(trip["driver_id"], {})
    
    return TripDetailResponse(
        id=trip["id"],
        vehicle_id=trip["vehicle_id"],
        driver_id=trip["driver_id"],
        cargo_weight_kg=trip["cargo_weight_kg"],
        origin=trip["origin"],
        destination=trip["destination"],
        distance_km=trip.get("distance_km"),
        revenue=trip["revenue"],
        status=trip["status"],
        scheduled_departure=trip["scheduled_departure"],
        actual_arrival=trip.get("actual_arrival"),
        vehicle_plate=vehicle.get("license_plate", "Unknown"),
        vehicle_model=f"{vehicle.get('make', '')} {vehicle.get('model', '')}".strip() or "Unknown",
        driver_name=driver.get("name", "Unknown"),
    )


@router.get("", response_model=TripListResponse)
async def list_trips(
    user: UserInDB = DispatcherOrAbove,
    status: Optional[TripStatus] = None,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all trips with filtering."""
    supabase = get_supabase()
    
    query = supabase.table("trips").select("*", count="exact")
    
    if status:
        query = query.eq("status", status.value)
    if vehicle_id:
        query = query.eq("vehicle_id", vehicle_id)
    if driver_id:
        query = query.eq("driver_id", driver_id)
    if search:
        query = query.or_(f"origin.ilike.%{search}%,destination.ilike.%{search}%")
    
    query = query.range(skip, skip + limit - 1).order("scheduled_departure", desc=True)
    
    result = query.execute()
    
    if not result.data:
        return TripListResponse(data=[], total=0)
    
    # Get vehicle and driver info for joined response
    vehicle_ids = list(set(t["vehicle_id"] for t in result.data))
    driver_ids = list(set(t["driver_id"] for t in result.data))
    
    vehicles_result = supabase.table("vehicles").select(
        "id, license_plate, make, model"
    ).in_("id", vehicle_ids).execute()
    
    drivers_result = supabase.table("drivers").select(
        "id, users!inner(first_name, last_name)"
    ).in_("id", driver_ids).execute()
    
    vehicles = {v["id"]: v for v in vehicles_result.data}
    drivers = {}
    for d in drivers_result.data:
        user_data = d.get("users", {})
        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
        drivers[d["id"]] = {"name": name}
    
    trips = [_build_trip_detail(t, vehicles, drivers) for t in result.data]
    
    return TripListResponse(
        data=trips,
        total=result.count or len(result.data)
    )


@router.get("/{trip_id}", response_model=TripDetailResponse)
async def get_trip(
    trip_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Get a single trip by ID."""
    supabase = get_supabase()
    
    result = supabase.table("trips").select("*").eq("id", trip_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip = result.data[0]
    
    # Get vehicle and driver info
    vehicle_result = supabase.table("vehicles").select(
        "id, license_plate, make, model"
    ).eq("id", trip["vehicle_id"]).execute()
    
    driver_result = supabase.table("drivers").select(
        "id, users!inner(first_name, last_name)"
    ).eq("id", trip["driver_id"]).execute()
    
    vehicles = {v["id"]: v for v in vehicle_result.data} if vehicle_result.data else {}
    drivers = {}
    if driver_result.data:
        d = driver_result.data[0]
        user_data = d.get("users", {})
        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
        drivers[d["id"]] = {"name": name}
    
    return _build_trip_detail(trip, vehicles, drivers)


@router.post("", response_model=TripResponse, status_code=201)
async def create_trip(
    trip: TripCreate,
    user: UserInDB = DispatcherOrAbove,
):
    """
    Create a new trip. Validates:
    - Vehicle exists and is idle
    - Driver exists and is eligible
    - Cargo weight doesn't exceed vehicle capacity
    """
    supabase = get_supabase()
    
    # Validate vehicle
    vehicle = supabase.table("vehicles").select(
        "id, status, max_load_capacity_kg"
    ).eq("id", trip.vehicle_id).execute()
    
    if not vehicle.data:
        raise HTTPException(status_code=400, detail="Vehicle not found")
    
    if vehicle.data[0]["status"] != "idle":
        raise HTTPException(
            status_code=400, 
            detail=f"Vehicle is '{vehicle.data[0]['status']}' — only idle vehicles can be dispatched"
        )
    
    if float(trip.cargo_weight_kg) > float(vehicle.data[0]["max_load_capacity_kg"]):
        raise HTTPException(
            status_code=400,
            detail=f"Cargo weight ({trip.cargo_weight_kg} kg) exceeds vehicle capacity ({vehicle.data[0]['max_load_capacity_kg']} kg)"
        )
    
    # Validate driver
    driver = supabase.table("drivers").select(
        "id, license_expiry, duty_status"
    ).eq("id", trip.driver_id).execute()
    
    if not driver.data:
        raise HTTPException(status_code=400, detail="Driver not found")
    
    if driver.data[0]["duty_status"] == "suspended":
        raise HTTPException(status_code=400, detail="Driver is currently suspended")
    
    if driver.data[0]["duty_status"] == "on_duty":
        raise HTTPException(status_code=400, detail="Driver is currently on duty")
    
    license_expiry = datetime.fromisoformat(driver.data[0]["license_expiry"]).date()
    if license_expiry < datetime.now().date():
        raise HTTPException(status_code=400, detail=f"Driver license expired on {license_expiry}")
    
    # Insert trip
    data = trip.model_dump()
    data["cargo_weight_kg"] = float(data["cargo_weight_kg"])
    if data.get("distance_km"):
        data["distance_km"] = float(data["distance_km"])
    data["revenue"] = float(data["revenue"])
    data["scheduled_departure"] = data["scheduled_departure"].isoformat()
    
    result = supabase.table("trips").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create trip")
    
    return TripResponse(**result.data[0])


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: int,
    trip: TripUpdate,
    user: UserInDB = DispatcherOrAbove,
):
    """Update a trip."""
    supabase = get_supabase()
    
    existing = supabase.table("trips").select("id, status").eq("id", trip_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    current_status = existing.data[0]["status"]
    
    # Cannot modify delivered or cancelled trips
    if current_status in ["delivered", "cancelled"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot modify trip with status '{current_status}'"
        )
    
    # Filter out None values
    update_data = {k: v for k, v in trip.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert types for Supabase
    if "cargo_weight_kg" in update_data:
        update_data["cargo_weight_kg"] = float(update_data["cargo_weight_kg"])
    if "distance_km" in update_data:
        update_data["distance_km"] = float(update_data["distance_km"])
    if "revenue" in update_data:
        update_data["revenue"] = float(update_data["revenue"])
    if "scheduled_departure" in update_data:
        update_data["scheduled_departure"] = update_data["scheduled_departure"].isoformat()
    if "actual_arrival" in update_data:
        update_data["actual_arrival"] = update_data["actual_arrival"].isoformat()
    
    result = supabase.table("trips").update(update_data).eq("id", trip_id).execute()
    
    return TripResponse(**result.data[0])


@router.put("/{trip_id}/start")
async def start_trip(
    trip_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Mark a trip as in_transit."""
    supabase = get_supabase()
    
    existing = supabase.table("trips").select("id, status").eq("id", trip_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing.data[0]["status"] != "scheduled":
        raise HTTPException(status_code=400, detail="Only scheduled trips can be started")
    
    result = supabase.table("trips").update({"status": "in_transit"}).eq("id", trip_id).execute()
    
    return {"message": "Trip started", "trip": TripResponse(**result.data[0])}


@router.put("/{trip_id}/complete")
async def complete_trip(
    trip_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Mark a trip as delivered."""
    supabase = get_supabase()
    
    existing = supabase.table("trips").select("id, status").eq("id", trip_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing.data[0]["status"] != "in_transit":
        raise HTTPException(status_code=400, detail="Only in_transit trips can be completed")
    
    result = supabase.table("trips").update({
        "status": "delivered",
        "actual_arrival": datetime.now().isoformat()
    }).eq("id", trip_id).execute()
    
    return {"message": "Trip completed", "trip": TripResponse(**result.data[0])}


@router.put("/{trip_id}/cancel")
async def cancel_trip(
    trip_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Cancel a trip."""
    supabase = get_supabase()
    
    existing = supabase.table("trips").select("id, status").eq("id", trip_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing.data[0]["status"] in ["delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Trip is already completed or cancelled")
    
    result = supabase.table("trips").update({"status": "cancelled"}).eq("id", trip_id).execute()
    
    return {"message": "Trip cancelled", "trip": TripResponse(**result.data[0])}


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(
    trip_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Delete a trip (only scheduled trips can be deleted)."""
    supabase = get_supabase()
    
    existing = supabase.table("trips").select("id, status").eq("id", trip_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if existing.data[0]["status"] != "scheduled":
        raise HTTPException(
            status_code=400, 
            detail="Only scheduled trips can be deleted. Use cancel for active trips."
        )
    
    supabase.table("trips").delete().eq("id", trip_id).execute()
    
    return None
