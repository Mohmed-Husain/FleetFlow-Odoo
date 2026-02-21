"""
routes/fuel_logs.py — Fuel log CRUD API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import date

from db.supabase import get_supabase
from models.fuel_logs import (
    FuelLogCreate,
    FuelLogUpdate,
    FuelLogResponse,
    FuelLogDetailResponse,
    FuelLogListResponse,
)
from auth import DispatcherOrAbove, ManagerOrAbove, UserInDB

router = APIRouter(prefix="/fuel-logs", tags=["Fuel Logs"])


def _build_fuel_log_detail(log: dict, vehicles: dict, drivers: dict) -> FuelLogDetailResponse:
    """Helper to build FuelLogDetailResponse with joined data."""
    vehicle = vehicles.get(log["vehicle_id"], {})
    driver = drivers.get(log.get("driver_id"), {})
    
    return FuelLogDetailResponse(
        id=log["id"],
        vehicle_id=log["vehicle_id"],
        driver_id=log.get("driver_id"),
        trip_id=log.get("trip_id"),
        liters=log["liters"],
        cost_per_liter=log["cost_per_liter"],
        total_cost=log["total_cost"],
        odometer_at_fill=log["odometer_at_fill"],
        fuel_date=log["fuel_date"],
        vehicle_plate=vehicle.get("license_plate", "Unknown"),
        driver_name=driver.get("name") if driver else None,
    )


@router.get("", response_model=FuelLogListResponse)
async def list_fuel_logs(
    user: UserInDB = DispatcherOrAbove,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    trip_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all fuel logs with filtering."""
    supabase = get_supabase()
    
    query = supabase.table("fuel_logs").select("*", count="exact")
    
    if vehicle_id:
        query = query.eq("vehicle_id", vehicle_id)
    if driver_id:
        query = query.eq("driver_id", driver_id)
    if trip_id:
        query = query.eq("trip_id", trip_id)
    if date_from:
        query = query.gte("fuel_date", date_from.isoformat())
    if date_to:
        query = query.lte("fuel_date", date_to.isoformat())
    
    query = query.range(skip, skip + limit - 1).order("fuel_date", desc=True)
    
    result = query.execute()
    
    if not result.data:
        return FuelLogListResponse(data=[], total=0)
    
    # Get joined data
    vehicle_ids = list(set(f["vehicle_id"] for f in result.data))
    driver_ids = [f["driver_id"] for f in result.data if f.get("driver_id")]
    
    vehicles_result = supabase.table("vehicles").select(
        "id, license_plate"
    ).in_("id", vehicle_ids).execute()
    vehicles = {v["id"]: v for v in vehicles_result.data}
    
    drivers = {}
    if driver_ids:
        drivers_result = supabase.table("drivers").select(
            "id, users!inner(first_name, last_name)"
        ).in_("id", driver_ids).execute()
        for d in drivers_result.data:
            user_data = d.get("users", {})
            name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
            drivers[d["id"]] = {"name": name}
    
    logs = [_build_fuel_log_detail(f, vehicles, drivers) for f in result.data]
    
    return FuelLogListResponse(
        data=logs,
        total=result.count or len(result.data)
    )


@router.get("/{log_id}", response_model=FuelLogDetailResponse)
async def get_fuel_log(
    log_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Get a single fuel log by ID."""
    supabase = get_supabase()
    
    result = supabase.table("fuel_logs").select("*").eq("id", log_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    
    log = result.data[0]
    
    # Get joined data
    vehicle_result = supabase.table("vehicles").select(
        "id, license_plate"
    ).eq("id", log["vehicle_id"]).execute()
    vehicles = {v["id"]: v for v in vehicle_result.data} if vehicle_result.data else {}
    
    drivers = {}
    if log.get("driver_id"):
        driver_result = supabase.table("drivers").select(
            "id, users!inner(first_name, last_name)"
        ).eq("id", log["driver_id"]).execute()
        if driver_result.data:
            d = driver_result.data[0]
            user_data = d.get("users", {})
            name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
            drivers[d["id"]] = {"name": name}
    
    return _build_fuel_log_detail(log, vehicles, drivers)


@router.post("", response_model=FuelLogResponse, status_code=201)
async def create_fuel_log(
    log: FuelLogCreate,
    user: UserInDB = DispatcherOrAbove,
):
    """Create a new fuel log record."""
    supabase = get_supabase()
    
    # Validate vehicle
    vehicle = supabase.table("vehicles").select("id, current_odometer_km").eq("id", log.vehicle_id).execute()
    if not vehicle.data:
        raise HTTPException(status_code=400, detail="Vehicle not found")
    
    # Validate driver if provided
    if log.driver_id:
        driver = supabase.table("drivers").select("id").eq("id", log.driver_id).execute()
        if not driver.data:
            raise HTTPException(status_code=400, detail="Driver not found")
    
    # Validate trip if provided
    if log.trip_id:
        trip = supabase.table("trips").select("id, vehicle_id").eq("id", log.trip_id).execute()
        if not trip.data:
            raise HTTPException(status_code=400, detail="Trip not found")
        if trip.data[0]["vehicle_id"] != log.vehicle_id:
            raise HTTPException(status_code=400, detail="Trip vehicle mismatch")
    
    # Insert fuel log (total_cost is auto-generated)
    data = log.model_dump()
    data["liters"] = float(data["liters"])
    data["cost_per_liter"] = float(data["cost_per_liter"])
    data["odometer_at_fill"] = float(data["odometer_at_fill"])
    data["fuel_date"] = data["fuel_date"].isoformat()
    
    result = supabase.table("fuel_logs").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create fuel log")
    
    return FuelLogResponse(**result.data[0])


@router.put("/{log_id}", response_model=FuelLogResponse)
async def update_fuel_log(
    log_id: int,
    log: FuelLogUpdate,
    user: UserInDB = DispatcherOrAbove,
):
    """Update a fuel log record."""
    supabase = get_supabase()
    
    existing = supabase.table("fuel_logs").select("id").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    
    # Filter out None values
    update_data = {k: v for k, v in log.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert types for Supabase
    if "liters" in update_data:
        update_data["liters"] = float(update_data["liters"])
    if "cost_per_liter" in update_data:
        update_data["cost_per_liter"] = float(update_data["cost_per_liter"])
    if "odometer_at_fill" in update_data:
        update_data["odometer_at_fill"] = float(update_data["odometer_at_fill"])
    if "fuel_date" in update_data:
        update_data["fuel_date"] = update_data["fuel_date"].isoformat()
    
    result = supabase.table("fuel_logs").update(update_data).eq("id", log_id).execute()
    
    return FuelLogResponse(**result.data[0])


@router.delete("/{log_id}", status_code=204)
async def delete_fuel_log(
    log_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """Delete a fuel log record. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    existing = supabase.table("fuel_logs").select("id").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    
    supabase.table("fuel_logs").delete().eq("id", log_id).execute()
    
    return None


@router.get("/summary/by-vehicle")
async def fuel_summary_by_vehicle(
    user: UserInDB = DispatcherOrAbove,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    """Get fuel consumption summary by vehicle."""
    supabase = get_supabase()
    
    query = supabase.table("fuel_logs").select("vehicle_id, liters, total_cost")
    
    if date_from:
        query = query.gte("fuel_date", date_from.isoformat())
    if date_to:
        query = query.lte("fuel_date", date_to.isoformat())
    
    result = query.execute()
    
    # Aggregate by vehicle
    totals = {}
    for f in result.data:
        vid = f["vehicle_id"]
        if vid not in totals:
            totals[vid] = {"liters": 0, "cost": 0}
        totals[vid]["liters"] += float(f["liters"])
        totals[vid]["cost"] += float(f["total_cost"])
    
    # Get vehicle plates
    if totals:
        vehicles_result = supabase.table("vehicles").select(
            "id, license_plate"
        ).in_("id", list(totals.keys())).execute()
        vehicle_map = {v["id"]: v["license_plate"] for v in vehicles_result.data}
    else:
        vehicle_map = {}
    
    return [
        {
            "vehicle_id": vid,
            "license_plate": vehicle_map.get(vid, "Unknown"),
            "total_liters": round(data["liters"], 2),
            "total_cost": round(data["cost"], 2),
        }
        for vid, data in sorted(totals.items(), key=lambda x: x[1]["cost"], reverse=True)
    ]
