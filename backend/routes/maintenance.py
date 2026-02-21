"""
routes/maintenance.py — Maintenance logs CRUD API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from db.supabase import get_supabase
from models.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
    MaintenanceDetailResponse,
    MaintenanceListResponse,
)
from models.enums import MaintenanceStatus, ServiceType
from auth import DispatcherOrAbove, ManagerOrAbove, UserInDB

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


def _build_maintenance_detail(log: dict, vehicles: dict) -> MaintenanceDetailResponse:
    """Helper to build MaintenanceDetailResponse with joined data."""
    vehicle = vehicles.get(log["vehicle_id"], {})
    
    return MaintenanceDetailResponse(
        id=log["id"],
        vehicle_id=log["vehicle_id"],
        service_type=log["service_type"],
        description=log["description"],
        start_date=log.get("start_date"),
        completion_date=log.get("completion_date"),
        cost=log["cost"],
        status=log["status"],
        vehicle_plate=vehicle.get("license_plate", "Unknown"),
        vehicle_model=f"{vehicle.get('make', '')} {vehicle.get('model', '')}".strip() or "Unknown",
    )


@router.get("", response_model=MaintenanceListResponse)
async def list_maintenance_logs(
    user: UserInDB = DispatcherOrAbove,
    status: Optional[MaintenanceStatus] = None,
    service_type: Optional[ServiceType] = None,
    vehicle_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all maintenance logs with filtering."""
    supabase = get_supabase()
    
    query = supabase.table("maintenance_logs").select("*", count="exact")
    
    if status:
        query = query.eq("status", status.value)
    if service_type:
        query = query.eq("service_type", service_type.value)
    if vehicle_id:
        query = query.eq("vehicle_id", vehicle_id)
    if search:
        query = query.ilike("description", f"%{search}%")
    
    query = query.range(skip, skip + limit - 1).order("id", desc=True)
    
    result = query.execute()
    
    if not result.data:
        return MaintenanceListResponse(data=[], total=0)
    
    # Get vehicle info
    vehicle_ids = list(set(m["vehicle_id"] for m in result.data))
    vehicles_result = supabase.table("vehicles").select(
        "id, license_plate, make, model"
    ).in_("id", vehicle_ids).execute()
    
    vehicles = {v["id"]: v for v in vehicles_result.data}
    
    logs = [_build_maintenance_detail(m, vehicles) for m in result.data]
    
    return MaintenanceListResponse(
        data=logs,
        total=result.count or len(result.data)
    )


@router.get("/{log_id}", response_model=MaintenanceDetailResponse)
async def get_maintenance_log(
    log_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Get a single maintenance log by ID."""
    supabase = get_supabase()
    
    result = supabase.table("maintenance_logs").select("*").eq("id", log_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    log = result.data[0]
    
    vehicle_result = supabase.table("vehicles").select(
        "id, license_plate, make, model"
    ).eq("id", log["vehicle_id"]).execute()
    
    vehicles = {v["id"]: v for v in vehicle_result.data} if vehicle_result.data else {}
    
    return _build_maintenance_detail(log, vehicles)


@router.post("", response_model=MaintenanceResponse, status_code=201)
async def create_maintenance_log(
    log: MaintenanceCreate,
    user: UserInDB = DispatcherOrAbove,
):
    """Create a new maintenance log."""
    supabase = get_supabase()
    
    # Validate vehicle
    vehicle = supabase.table("vehicles").select("id, status").eq("id", log.vehicle_id).execute()
    
    if not vehicle.data:
        raise HTTPException(status_code=400, detail="Vehicle not found")
    
    if vehicle.data[0]["status"] == "on_trip":
        raise HTTPException(status_code=400, detail="Cannot create maintenance for vehicle on trip")
    
    # Insert maintenance log
    data = log.model_dump()
    if data.get("start_date"):
        data["start_date"] = data["start_date"].isoformat()
    if data.get("cost"):
        data["cost"] = float(data["cost"])
    
    result = supabase.table("maintenance_logs").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create maintenance log")
    
    return MaintenanceResponse(**result.data[0])


@router.put("/{log_id}", response_model=MaintenanceResponse)
async def update_maintenance_log(
    log_id: int,
    log: MaintenanceUpdate,
    user: UserInDB = DispatcherOrAbove,
):
    """Update a maintenance log."""
    supabase = get_supabase()
    
    existing = supabase.table("maintenance_logs").select("id, status").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    # Filter out None values
    update_data = {k: v for k, v in log.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert types for Supabase
    if "start_date" in update_data:
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "completion_date" in update_data:
        update_data["completion_date"] = update_data["completion_date"].isoformat()
    if "cost" in update_data:
        update_data["cost"] = float(update_data["cost"])
    
    result = supabase.table("maintenance_logs").update(update_data).eq("id", log_id).execute()
    
    return MaintenanceResponse(**result.data[0])


@router.put("/{log_id}/start")
async def start_maintenance(
    log_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Mark maintenance as in_progress."""
    supabase = get_supabase()
    
    existing = supabase.table("maintenance_logs").select("id, status").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    if existing.data[0]["status"] != "new":
        raise HTTPException(status_code=400, detail="Only new maintenance logs can be started")
    
    from datetime import date
    result = supabase.table("maintenance_logs").update({
        "status": "in_progress",
        "start_date": date.today().isoformat()
    }).eq("id", log_id).execute()
    
    return {"message": "Maintenance started", "log": MaintenanceResponse(**result.data[0])}


@router.put("/{log_id}/complete")
async def complete_maintenance(
    log_id: int,
    final_cost: Optional[float] = None,
    user: UserInDB = DispatcherOrAbove,
):
    """Mark maintenance as completed."""
    supabase = get_supabase()
    
    existing = supabase.table("maintenance_logs").select("id, status").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    if existing.data[0]["status"] not in ["new", "in_progress"]:
        raise HTTPException(status_code=400, detail="Maintenance is already completed or cancelled")
    
    from datetime import date
    update_data = {
        "status": "completed",
        "completion_date": date.today().isoformat()
    }
    if final_cost is not None:
        update_data["cost"] = final_cost
    
    result = supabase.table("maintenance_logs").update(update_data).eq("id", log_id).execute()
    
    return {"message": "Maintenance completed", "log": MaintenanceResponse(**result.data[0])}


@router.put("/{log_id}/cancel")
async def cancel_maintenance(
    log_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Cancel a maintenance log."""
    supabase = get_supabase()
    
    existing = supabase.table("maintenance_logs").select("id, status").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    if existing.data[0]["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Maintenance is already completed or cancelled")
    
    result = supabase.table("maintenance_logs").update({"status": "cancelled"}).eq("id", log_id).execute()
    
    return {"message": "Maintenance cancelled", "log": MaintenanceResponse(**result.data[0])}


@router.delete("/{log_id}", status_code=204)
async def delete_maintenance_log(
    log_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """Delete a maintenance log. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    existing = supabase.table("maintenance_logs").select("id, status").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    if existing.data[0]["status"] == "in_progress":
        raise HTTPException(status_code=400, detail="Cannot delete in-progress maintenance")
    
    supabase.table("maintenance_logs").delete().eq("id", log_id).execute()
    
    return None
