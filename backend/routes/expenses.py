"""
routes/expenses.py — Expense CRUD API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import date

from db.supabase import get_supabase
from models.expenses import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseDetailResponse,
    ExpenseListResponse,
)
from models.enums import ExpenseType
from auth import DispatcherOrAbove, ManagerOrAbove, UserInDB

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _build_expense_detail(expense: dict, vehicles: dict, trips: dict, drivers: dict) -> ExpenseDetailResponse:
    """Helper to build ExpenseDetailResponse with joined data."""
    vehicle = vehicles.get(expense["vehicle_id"], {})
    trip = trips.get(expense.get("trip_id"), {})
    driver_id = trip.get("driver_id")
    driver = drivers.get(driver_id, {}) if driver_id else {}
    
    return ExpenseDetailResponse(
        id=expense["id"],
        trip_id=expense.get("trip_id"),
        vehicle_id=expense["vehicle_id"],
        expense_type=expense["expense_type"],
        amount=expense["amount"],
        description=expense.get("description"),
        expense_date=expense["expense_date"],
        vehicle_plate=vehicle.get("license_plate", "Unknown"),
        driver_name=driver.get("name") if driver else None,
        distance_km=trip.get("distance_km") if trip else None,
    )


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    user: UserInDB = DispatcherOrAbove,
    expense_type: Optional[ExpenseType] = None,
    vehicle_id: Optional[int] = None,
    trip_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all expenses with filtering."""
    supabase = get_supabase()
    
    query = supabase.table("expenses").select("*", count="exact")
    
    if expense_type:
        query = query.eq("expense_type", expense_type.value)
    if vehicle_id:
        query = query.eq("vehicle_id", vehicle_id)
    if trip_id:
        query = query.eq("trip_id", trip_id)
    if date_from:
        query = query.gte("expense_date", date_from.isoformat())
    if date_to:
        query = query.lte("expense_date", date_to.isoformat())
    
    query = query.range(skip, skip + limit - 1).order("expense_date", desc=True)
    
    result = query.execute()
    
    if not result.data:
        return ExpenseListResponse(data=[], total=0)
    
    # Get joined data
    vehicle_ids = list(set(e["vehicle_id"] for e in result.data))
    trip_ids = [e["trip_id"] for e in result.data if e.get("trip_id")]
    
    vehicles_result = supabase.table("vehicles").select(
        "id, license_plate"
    ).in_("id", vehicle_ids).execute()
    vehicles = {v["id"]: v for v in vehicles_result.data}
    
    trips = {}
    drivers = {}
    if trip_ids:
        trips_result = supabase.table("trips").select(
            "id, driver_id, distance_km"
        ).in_("id", trip_ids).execute()
        trips = {t["id"]: t for t in trips_result.data}
        
        driver_ids = list(set(t["driver_id"] for t in trips_result.data if t.get("driver_id")))
        if driver_ids:
            drivers_result = supabase.table("drivers").select(
                "id, users!inner(first_name, last_name)"
            ).in_("id", driver_ids).execute()
            for d in drivers_result.data:
                user_data = d.get("users", {})
                name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                drivers[d["id"]] = {"name": name}
    
    expenses = [_build_expense_detail(e, vehicles, trips, drivers) for e in result.data]
    
    return ExpenseListResponse(
        data=expenses,
        total=result.count or len(result.data)
    )


@router.get("/{expense_id}", response_model=ExpenseDetailResponse)
async def get_expense(
    expense_id: int,
    user: UserInDB = DispatcherOrAbove,
):
    """Get a single expense by ID."""
    supabase = get_supabase()
    
    result = supabase.table("expenses").select("*").eq("id", expense_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense = result.data[0]
    
    # Get joined data
    vehicle_result = supabase.table("vehicles").select(
        "id, license_plate"
    ).eq("id", expense["vehicle_id"]).execute()
    vehicles = {v["id"]: v for v in vehicle_result.data} if vehicle_result.data else {}
    
    trips = {}
    drivers = {}
    if expense.get("trip_id"):
        trip_result = supabase.table("trips").select(
            "id, driver_id, distance_km"
        ).eq("id", expense["trip_id"]).execute()
        if trip_result.data:
            trips = {t["id"]: t for t in trip_result.data}
            driver_id = trip_result.data[0].get("driver_id")
            if driver_id:
                driver_result = supabase.table("drivers").select(
                    "id, users!inner(first_name, last_name)"
                ).eq("id", driver_id).execute()
                if driver_result.data:
                    d = driver_result.data[0]
                    user_data = d.get("users", {})
                    name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                    drivers[d["id"]] = {"name": name}
    
    return _build_expense_detail(expense, vehicles, trips, drivers)


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    expense: ExpenseCreate,
    user: UserInDB = DispatcherOrAbove,
):
    """Create a new expense record."""
    supabase = get_supabase()
    
    # Validate vehicle
    vehicle = supabase.table("vehicles").select("id").eq("id", expense.vehicle_id).execute()
    if not vehicle.data:
        raise HTTPException(status_code=400, detail="Vehicle not found")
    
    # Validate trip if provided
    if expense.trip_id:
        trip = supabase.table("trips").select("id, vehicle_id").eq("id", expense.trip_id).execute()
        if not trip.data:
            raise HTTPException(status_code=400, detail="Trip not found")
        # Optionally verify trip is for the same vehicle
        if trip.data[0]["vehicle_id"] != expense.vehicle_id:
            raise HTTPException(status_code=400, detail="Trip vehicle mismatch")
    
    # Insert expense
    data = expense.model_dump()
    data["amount"] = float(data["amount"])
    data["expense_date"] = data["expense_date"].isoformat()
    
    result = supabase.table("expenses").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create expense")
    
    return ExpenseResponse(**result.data[0])


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    user: UserInDB = DispatcherOrAbove,
):
    """Update an expense record."""
    supabase = get_supabase()
    
    existing = supabase.table("expenses").select("id").eq("id", expense_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Filter out None values
    update_data = {k: v for k, v in expense.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert types for Supabase
    if "amount" in update_data:
        update_data["amount"] = float(update_data["amount"])
    if "expense_date" in update_data:
        update_data["expense_date"] = update_data["expense_date"].isoformat()
    
    result = supabase.table("expenses").update(update_data).eq("id", expense_id).execute()
    
    return ExpenseResponse(**result.data[0])


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: int,
    user: UserInDB = ManagerOrAbove,
):
    """Delete an expense record. Requires Manager or Admin role."""
    supabase = get_supabase()
    
    existing = supabase.table("expenses").select("id").eq("id", expense_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    supabase.table("expenses").delete().eq("id", expense_id).execute()
    
    return None


@router.get("/summary/by-type")
async def expenses_summary_by_type(
    user: UserInDB = DispatcherOrAbove,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    """Get expense totals grouped by type."""
    supabase = get_supabase()
    
    query = supabase.table("expenses").select("expense_type, amount")
    
    if date_from:
        query = query.gte("expense_date", date_from.isoformat())
    if date_to:
        query = query.lte("expense_date", date_to.isoformat())
    
    result = query.execute()
    
    # Aggregate by type
    totals = {}
    for e in result.data:
        exp_type = e["expense_type"]
        totals[exp_type] = totals.get(exp_type, 0) + float(e["amount"])
    
    return [{"type": k, "total": v} for k, v in sorted(totals.items())]
