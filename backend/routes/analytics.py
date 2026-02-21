"""
routes/analytics.py — Analytics and Dashboard API endpoints.
Uses PostgreSQL views for pre-computed metrics.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import date

from db.supabase import get_supabase
from models.analytics import (
    DashboardKPIs,
    VehicleCostSummary,
    DriverPerformance,
    MonthlyFinancialSummary,
    AnalyticsSummary,
)
from auth import AnyAuthenticatedUser, DispatcherOrAbove, UserInDB

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    user: UserInDB = AnyAuthenticatedUser,
):
    """
    Get dashboard KPIs: active fleet count, maintenance alerts,
    utilization rate, and pending cargo.
    """
    supabase = get_supabase()
    
    # Try to use the view if it exists, otherwise compute manually
    try:
        result = supabase.table("vw_dashboard_kpis").select("*").execute()
        if result.data:
            return DashboardKPIs(**result.data[0])
    except Exception:
        pass
    
    # Manual computation fallback
    vehicles = supabase.table("vehicles").select("status", count="exact").neq("status", "retired").execute()
    trips = supabase.table("trips").select("status", count="exact").eq("status", "scheduled").execute()
    
    total_vehicles = vehicles.count or 0
    on_trip = len([v for v in vehicles.data if v["status"] == "on_trip"])
    in_shop = len([v for v in vehicles.data if v["status"] == "in_shop"])
    
    utilization_rate = round((on_trip * 100.0) / total_vehicles, 1) if total_vehicles > 0 else 0
    
    return DashboardKPIs(
        active_fleet=on_trip,
        maintenance_alerts=in_shop,
        utilization_rate=utilization_rate,
        pending_cargo=trips.count or 0,
    )


@router.get("/vehicles/cost-summary", response_model=list[VehicleCostSummary])
async def get_vehicle_cost_summary(
    user: UserInDB = DispatcherOrAbove,
    limit: int = 10,
):
    """
    Get vehicle cost breakdown: fuel costs, maintenance costs,
    revenue, and net profit per vehicle.
    """
    supabase = get_supabase()
    
    # Try to use the view if it exists
    try:
        result = supabase.table("vw_vehicle_cost_summary").select("*").limit(limit).execute()
        if result.data:
            return [VehicleCostSummary(**v) for v in result.data]
    except Exception:
        pass
    
    # Manual computation fallback
    # Get all non-retired vehicles
    vehicles = supabase.table("vehicles").select(
        "id, license_plate, make, model"
    ).neq("status", "retired").limit(limit).execute()
    
    if not vehicles.data:
        return []
    
    vehicle_ids = [v["id"] for v in vehicles.data]
    
    # Get fuel costs
    fuel_logs = supabase.table("fuel_logs").select(
        "vehicle_id, total_cost, liters"
    ).in_("vehicle_id", vehicle_ids).execute()
    
    fuel_by_vehicle = {}
    for f in fuel_logs.data:
        vid = f["vehicle_id"]
        if vid not in fuel_by_vehicle:
            fuel_by_vehicle[vid] = {"cost": 0, "liters": 0}
        fuel_by_vehicle[vid]["cost"] += float(f["total_cost"])
        fuel_by_vehicle[vid]["liters"] += float(f["liters"])
    
    # Get maintenance costs
    maintenance = supabase.table("maintenance_logs").select(
        "vehicle_id, cost"
    ).in_("vehicle_id", vehicle_ids).eq("status", "completed").execute()
    
    maint_by_vehicle = {}
    for m in maintenance.data:
        vid = m["vehicle_id"]
        maint_by_vehicle[vid] = maint_by_vehicle.get(vid, 0) + float(m["cost"])
    
    # Get trip revenue and distance
    trips = supabase.table("trips").select(
        "vehicle_id, revenue, distance_km"
    ).in_("vehicle_id", vehicle_ids).eq("status", "delivered").execute()
    
    trips_by_vehicle = {}
    for t in trips.data:
        vid = t["vehicle_id"]
        if vid not in trips_by_vehicle:
            trips_by_vehicle[vid] = {"revenue": 0, "distance": 0}
        trips_by_vehicle[vid]["revenue"] += float(t["revenue"])
        trips_by_vehicle[vid]["distance"] += float(t["distance_km"] or 0)
    
    # Build response
    summaries = []
    for v in vehicles.data:
        vid = v["id"]
        fuel_data = fuel_by_vehicle.get(vid, {"cost": 0, "liters": 0})
        maint_cost = maint_by_vehicle.get(vid, 0)
        trip_data = trips_by_vehicle.get(vid, {"revenue": 0, "distance": 0})
        
        total_cost = fuel_data["cost"] + maint_cost
        km_per_liter = round(trip_data["distance"] / fuel_data["liters"], 2) if fuel_data["liters"] > 0 else 0
        
        summaries.append(VehicleCostSummary(
            vehicle_id=vid,
            license_plate=v["license_plate"],
            vehicle_name=f"{v['make']} {v['model']}",
            total_fuel_cost=round(fuel_data["cost"], 2),
            total_maintenance_cost=round(maint_cost, 2),
            total_cost=round(total_cost, 2),
            total_revenue=round(trip_data["revenue"], 2),
            net_profit=round(trip_data["revenue"] - total_cost, 2),
            km_per_liter=km_per_liter,
        ))
    
    # Sort by total cost descending
    summaries.sort(key=lambda x: x.total_cost, reverse=True)
    
    return summaries


@router.get("/drivers/performance", response_model=list[DriverPerformance])
async def get_driver_performance(
    user: UserInDB = DispatcherOrAbove,
    limit: int = 50,
):
    """
    Get driver performance metrics: completion rate, safety score,
    total trips, and complaints.
    """
    supabase = get_supabase()
    
    # Try to use the view if it exists
    try:
        result = supabase.table("vw_driver_performance").select("*").limit(limit).execute()
        if result.data:
            return [DriverPerformance(**d) for d in result.data]
    except Exception:
        pass
    
    # Manual computation fallback
    # Get drivers with user info
    drivers = supabase.table("drivers").select(
        "id, license_number, license_expiry, safety_score, duty_status, users!inner(first_name, last_name)"
    ).limit(limit).execute()
    
    if not drivers.data:
        return []
    
    driver_ids = [d["id"] for d in drivers.data]
    
    # Get trip stats
    trips = supabase.table("trips").select(
        "driver_id, status"
    ).in_("driver_id", driver_ids).execute()
    
    trip_stats = {}
    for t in trips.data:
        did = t["driver_id"]
        if did not in trip_stats:
            trip_stats[did] = {"total": 0, "delivered": 0, "cancelled": 0}
        trip_stats[did]["total"] += 1
        if t["status"] == "delivered":
            trip_stats[did]["delivered"] += 1
        elif t["status"] == "cancelled":
            trip_stats[did]["cancelled"] += 1
    
    # Get complaints
    complaints = supabase.table("driver_complaints").select(
        "driver_id"
    ).in_("driver_id", driver_ids).execute()
    
    complaint_counts = {}
    for c in complaints.data:
        did = c["driver_id"]
        complaint_counts[did] = complaint_counts.get(did, 0) + 1
    
    # Build response
    today = date.today()
    performance = []
    for d in drivers.data:
        did = d["id"]
        user_data = d.get("users", {})
        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
        
        license_expiry = date.fromisoformat(d["license_expiry"]) if isinstance(d["license_expiry"], str) else d["license_expiry"]
        license_expired = license_expiry < today
        is_available = d["duty_status"] not in ["on_duty", "suspended"]
        
        stats = trip_stats.get(did, {"total": 0, "delivered": 0, "cancelled": 0})
        completion_rate = round((stats["delivered"] * 100.0) / stats["total"], 2) if stats["total"] > 0 else 100.0
        
        performance.append(DriverPerformance(
            driver_id=did,
            driver_name=name,
            license_number=d["license_number"],
            license_expiry=license_expiry,
            license_expired=license_expired,
            safety_score=d["safety_score"],
            duty_status=d["duty_status"],
            is_available=is_available,
            total_trips=stats["total"],
            completed_trips=stats["delivered"],
            cancelled_trips=stats["cancelled"],
            completion_rate=completion_rate,
            total_complaints=complaint_counts.get(did, 0),
        ))
    
    return performance


@router.get("/financial/monthly", response_model=list[MonthlyFinancialSummary])
async def get_monthly_financial_summary(
    user: UserInDB = DispatcherOrAbove,
    months: int = 6,
):
    """
    Get monthly financial summary: revenue, fuel costs,
    maintenance costs, and net profit.
    """
    supabase = get_supabase()
    
    # Try to use the view if it exists
    try:
        result = supabase.table("vw_monthly_financial_summary").select("*").limit(months).execute()
        if result.data:
            return [MonthlyFinancialSummary(**m) for m in result.data]
    except Exception:
        pass
    
    # Manual computation: get delivered trips with actual_arrival
    from datetime import datetime, timedelta
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 31)
    
    trips = supabase.table("trips").select(
        "vehicle_id, revenue, actual_arrival"
    ).eq("status", "delivered").not_.is_("actual_arrival", "null").gte(
        "actual_arrival", start_date.isoformat()
    ).execute()
    
    if not trips.data:
        return []
    
    # Group by month
    monthly_data = {}
    for t in trips.data:
        arrival = datetime.fromisoformat(t["actual_arrival"].replace("Z", "+00:00"))
        month_key = date(arrival.year, arrival.month, 1)
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {"revenue": 0, "vehicle_ids": set()}
        
        monthly_data[month_key]["revenue"] += float(t["revenue"])
        monthly_data[month_key]["vehicle_ids"].add(t["vehicle_id"])
    
    # Get fuel and maintenance costs per month (simplified - using all logs for now)
    fuel_logs = supabase.table("fuel_logs").select(
        "total_cost, fuel_date"
    ).gte("fuel_date", start_date.date().isoformat()).execute()
    
    fuel_by_month = {}
    for f in fuel_logs.data:
        fuel_date = date.fromisoformat(f["fuel_date"])
        month_key = date(fuel_date.year, fuel_date.month, 1)
        fuel_by_month[month_key] = fuel_by_month.get(month_key, 0) + float(f["total_cost"])
    
    maintenance = supabase.table("maintenance_logs").select(
        "cost, completion_date"
    ).eq("status", "completed").not_.is_("completion_date", "null").gte(
        "completion_date", start_date.date().isoformat()
    ).execute()
    
    maint_by_month = {}
    for m in maintenance.data:
        comp_date = date.fromisoformat(m["completion_date"])
        month_key = date(comp_date.year, comp_date.month, 1)
        maint_by_month[month_key] = maint_by_month.get(month_key, 0) + float(m["cost"])
    
    # Build response
    summaries = []
    for month_key in sorted(monthly_data.keys(), reverse=True)[:months]:
        revenue = monthly_data[month_key]["revenue"]
        fuel_cost = fuel_by_month.get(month_key, 0)
        maint_cost = maint_by_month.get(month_key, 0)
        
        summaries.append(MonthlyFinancialSummary(
            month=month_key,
            total_revenue=round(revenue, 2),
            total_fuel_cost=round(fuel_cost, 2),
            total_maintenance_cost=round(maint_cost, 2),
            net_profit=round(revenue - fuel_cost - maint_cost, 2),
        ))
    
    return summaries


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    user: UserInDB = DispatcherOrAbove,
):
    """
    Get combined analytics summary for the analytics dashboard.
    Includes KPIs, top vehicles, driver performance, and monthly financials.
    """
    kpis = await get_dashboard_kpis(user)
    top_vehicles = await get_vehicle_cost_summary(user, limit=5)
    driver_perf = await get_driver_performance(user, limit=10)
    monthly = await get_monthly_financial_summary(user, months=6)
    
    return AnalyticsSummary(
        kpis=kpis,
        top_vehicles=top_vehicles,
        driver_performance=driver_perf,
        monthly_summary=monthly,
    )


@router.get("/fleet/stats")
async def get_fleet_stats(
    user: UserInDB = AnyAuthenticatedUser,
):
    """Get quick fleet statistics."""
    supabase = get_supabase()
    
    vehicles = supabase.table("vehicles").select("status", count="exact").neq("status", "retired").execute()
    drivers = supabase.table("drivers").select("duty_status", count="exact").execute()
    trips = supabase.table("trips").select("status", count="exact").execute()
    
    vehicle_counts = {}
    for v in vehicles.data:
        status = v["status"]
        vehicle_counts[status] = vehicle_counts.get(status, 0) + 1
    
    driver_counts = {}
    for d in drivers.data:
        status = d["duty_status"]
        driver_counts[status] = driver_counts.get(status, 0) + 1
    
    trip_counts = {}
    for t in trips.data:
        status = t["status"]
        trip_counts[status] = trip_counts.get(status, 0) + 1
    
    return {
        "vehicles": {
            "total": vehicles.count or 0,
            "by_status": vehicle_counts,
        },
        "drivers": {
            "total": drivers.count or 0,
            "by_status": driver_counts,
        },
        "trips": {
            "total": trips.count or 0,
            "by_status": trip_counts,
        },
    }
