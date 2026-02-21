// ── Storage Utilities ──────────────────────────────────────────────────────
// Browser-based data storage for dashboard functionalities

const STORAGE_KEYS = {
  VEHICLES: "fleetflow_vehicles",
  TRIPS: "fleetflow_trips",
  DRIVERS: "fleetflow_drivers",
};

// Initialize default data if not exists
export const initializeStorage = () => {
  if (typeof window === "undefined") return;

  // Default vehicles
  if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
    const defaultVehicles = [
      { id: 1, plate: "MH-12-AB-1234", model: "2021", type: "Mini", capacity: "5 Tonn", odometer: 79000, status: "Idle" },
      { id: 2, plate: "GJ-01-CD-5678", model: "2019", type: "Heavy", capacity: "20 Tonn", odometer: 142000, status: "On Trip" },
      { id: 3, plate: "DL-03-EF-9012", model: "2022", type: "Medium", capacity: "10 Tonn", odometer: 34000, status: "On Trip" },
      { id: 4, plate: "KA-05-GH-3456", model: "2018", type: "Mini", capacity: "5 Tonn", odometer: 210000, status: "Maintenance" },
      { id: 5, plate: "RJ-09-KL-2345", model: "2020", type: "Heavy", capacity: "20 Tonn", odometer: 98000, status: "Idle" },
      { id: 6, plate: "TN-07-MN-6789", model: "2023", type: "Medium", capacity: "10 Tonn", odometer: 12000, status: "On Trip" },
    ];
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(defaultVehicles));
  }

  // Default trips
  if (!localStorage.getItem(STORAGE_KEYS.TRIPS)) {
    const defaultTrips = [
      { id: 1, vehicle: "MH-12-AB-1234", origin: "Mumbai", destination: "Pune", driver: "John Doe", status: "On Trip", type: "Trailer Truck" },
      { id: 2, vehicle: "GJ-01-CD-5678", origin: "Ahmedabad", destination: "Surat", driver: "Ravi Mehta", status: "Idle", type: "Mini" },
      { id: 3, vehicle: "DL-03-EF-9012", origin: "Delhi", destination: "Jaipur", driver: "Amir Khan", status: "On Trip", type: "Heavy" },
      { id: 4, vehicle: "KA-05-GH-3456", origin: "Bangalore", destination: "Hyderabad", driver: "Priya Nair", status: "Maintenance", type: "Medium" },
      { id: 5, vehicle: "MH-14-IJ-7890", origin: "Mumbai", destination: "Nagpur", driver: "Sara Thomas", status: "Idle", type: "Mini" },
      { id: 6, vehicle: "RJ-09-KL-2345", origin: "Jaipur", destination: "Delhi", driver: "Deepak Rao", status: "On Trip", type: "Heavy" },
      { id: 7, vehicle: "TN-07-MN-6789", origin: "Chennai", destination: "Bangalore", driver: "Neha Sharma", status: "Idle", type: "Medium" },
      { id: 8, vehicle: "AP-11-OP-0123", origin: "Hyderabad", destination: "Visakhapatnam", driver: "Vijay Singh", status: "Maintenance", type: "Mini" },
    ];
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(defaultTrips));
  }

  // Default drivers performance data
  if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) {
    const defaultDrivers = [
      { id: 1, name: "John Doe", license: "DL-2019-001", expiryDate: "2025-12-31", completionRate: 92, safetyScore: 89, complaints: 4 },
      { id: 2, name: "Ravi Mehta", license: "DL-2018-045", expiryDate: "2026-06-15", completionRate: 88, safetyScore: 91, complaints: 2 },
      { id: 3, name: "Amir Khan", license: "DL-2020-078", expiryDate: "2027-03-20", completionRate: 95, safetyScore: 94, complaints: 1 },
      { id: 4, name: "Priya Nair", license: "DL-2019-102", expiryDate: "2025-09-10", completionRate: 87, safetyScore: 85, complaints: 6 },
      { id: 5, name: "Sara Thomas", license: "DL-2021-156", expiryDate: "2028-01-05", completionRate: 91, safetyScore: 92, complaints: 2 },
      { id: 6, name: "Deepak Rao", license: "DL-2020-203", expiryDate: "2026-11-22", completionRate: 89, safetyScore: 87, complaints: 3 },
      { id: 7, name: "Neha Sharma", license: "DL-2018-267", expiryDate: "2025-05-14", completionRate: 86, safetyScore: 88, complaints: 5 },
      { id: 8, name: "Vijay Singh", license: "DL-2019-312", expiryDate: "2026-08-08", completionRate: 93, safetyScore: 90, complaints: 2 },
      { id: 9, name: "Amit Patel", license: "DL-2021-358", expiryDate: "2027-07-20", completionRate: 90, safetyScore: 93, complaints: 1 },
      { id: 10, name: "Kavya Reddy", license: "DL-2020-401", expiryDate: "2026-02-28", completionRate: 85, safetyScore: 86, complaints: 7 },
      { id: 11, name: "Rajesh Kumar", license: "DL-2019-445", expiryDate: "2025-10-10", completionRate: 88, safetyScore: 89, complaints: 4 },
      { id: 12, name: "Anita Singh", license: "DL-2018-489", expiryDate: "2025-04-16", completionRate: 84, safetyScore: 83, complaints: 8 },
      { id: 13, name: "Harish Verma", license: "DL-2021-534", expiryDate: "2027-12-12", completionRate: 94, safetyScore: 95, complaints: 0 },
      { id: 14, name: "Divya Nayak", license: "DL-2020-578", expiryDate: "2026-09-25", completionRate: 87, safetyScore: 90, complaints: 3 },
      { id: 15, name: "Suresh Gupta", license: "DL-2019-623", expiryDate: "2025-07-19", completionRate: 89, safetyScore: 91, complaints: 2 },
    ];
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(defaultDrivers));
  }
};

// Get all vehicles from storage
export const getVehicles = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
  return data ? JSON.parse(data) : [];
};

// Get all trips from storage
export const getTrips = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
  return data ? JSON.parse(data) : [];
};

// Save vehicle
export const saveVehicle = (vehicle) => {
  const vehicles = getVehicles();
  const exists = vehicles.findIndex((v) => v.id === vehicle.id);
  if (exists >= 0) {
    vehicles[exists] = vehicle;
  } else {
    vehicle.id = Math.max(...vehicles.map((v) => v.id || 0), 0) + 1;
    vehicles.push(vehicle);
  }
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  return vehicle;
};

// Delete vehicle
export const deleteVehicle = (id) => {
  const vehicles = getVehicles();
  const filtered = vehicles.filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(filtered));
};

// Save trip
export const saveTrip = (trip) => {
  const trips = getTrips();
  const exists = trips.findIndex((t) => t.id === trip.id);
  if (exists >= 0) {
    trips[exists] = trip;
  } else {
    trip.id = Math.max(...trips.map((t) => t.id || 0), 0) + 1;
    trips.push(trip);
  }
  localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  return trip;
};

// Delete trip
export const deleteTrip = (id) => {
  const trips = getTrips();
  const filtered = trips.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(filtered));
};

// Get all drivers from storage
export const getDrivers = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.DRIVERS);
  return data ? JSON.parse(data) : [];
};

// Save driver
export const saveDriver = (driver) => {
  const drivers = getDrivers();
  const exists = drivers.findIndex((d) => d.id === driver.id);
  if (exists >= 0) {
    drivers[exists] = driver;
  } else {
    driver.id = Math.max(...drivers.map((d) => d.id || 0), 0) + 1;
    drivers.push(driver);
  }
  localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
  return driver;
};

// Delete driver
export const deleteDriver = (id) => {
  const drivers = getDrivers();
  const filtered = drivers.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(filtered));
};

// Search utility
export const searchItems = (items, query, searchFields = []) => {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) =>
      String(item[field] || "").toLowerCase().includes(lowerQuery)
    )
  );
};

// Filter utility
export const filterItems = (items, filters) => {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (Array.isArray(value)) return value.includes(item[key]);
      return item[key] === value;
    })
  );
};

// Sort utility
export const sortItems = (items, sortBy, order = "asc") => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return order === "asc" ? aVal - bVal : bVal - aVal;
    }
    return order === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
  return sorted;
};

// Group utility
export const groupItems = (items, groupBy) => {
  return items.reduce((grouped, item) => {
    const key = item[groupBy];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
    return grouped;
  }, {});
};

// ── Analytics Functions ─────────────────────────────────────────────────────

// Get fuel efficiency trend (monthly data)
export const getFuelEfficiencyTrend = () => {
  // Get current date for realistic monthly data
  const now = new Date();
  const currentMonth = now.getMonth();
  const months = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), currentMonth - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    months.push(monthName);
  }
  
  // Simulate realistic fuel efficiency trending with seasonal variations
  return months.map((name, idx) => {
    // Base efficiency: 8-12 km/L for Indian trucks
    const baseValue = 10;
    // Slight upward trend as fleet gets optimized
    const trend = idx * 0.15;
    // Seasonal variation (summer slightly better)
    const seasonal = Math.sin((idx - 3) / 12 * Math.PI * 2) * 1.5;
    // Random daily variations
    const variance = Math.random() * 1.2 - 0.6;
    
    const value = Math.round((baseValue + trend + seasonal + variance) * 10) / 10;
    return { name, value: Math.max(7, Math.min(14, value)) };
  });
};

// Get top costliest vehicles (by estimated maintenance/fuel costs)
export const getTopCostliestVehicles = () => {
  const vehicles = getVehicles();
  
  // Calculate cost based on vehicle type, mileage, age, and usage
  const costs = vehicles.map((v) => {
    // Base fuel cost by type (monthly)
    const baseFuelCost = v.type === "Heavy" ? 45000 : v.type === "Medium" ? 28000 : 18000;
    
    // Maintenance cost based on age and mileage
    const age = 2024 - parseInt(v.model);
    const mileageCategory = v.odometer > 150000 ? 1.5 : v.odometer > 100000 ? 1.2 : 1.0;
    const maintenanceCost = (15000 + age * 3000) * mileageCategory;
    
    // Operational cost (insurance, tolls)
    const operationalCost = v.type === "Heavy" ? 12000 : 8000;
    
    const totalMonthlyCost = Math.round(baseFuelCost + maintenanceCost + operationalCost);
    
    return {
      name: v.plate.split("-").slice(0, 2).join("-").substring(0, 6),
      cost: Math.round(totalMonthlyCost / 10000),
      plate: v.plate,
    };
  });
  
  return costs.sort((a, b) => b.cost - a.cost).slice(0, 5);
};

// Get financial summary (monthly revenue, costs, profit)
export const getFinancialSummary = () => {
  const vehicles = getVehicles();
  const trips = getTrips();
  
  // Use current date to generate realistic monthly data
  const now = new Date();
  const currentMonth = now.getMonth();
  const months = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), currentMonth - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    months.push(monthName);
  }
  
  return months.map((month, idx) => {
    // Realistic trip count: 20-35 trips per month
    const baseTrips = 25 + Math.floor(Math.random() * 10);
    const tripCount = baseTrips + (idx * 2);
    
    // Revenue: ₹40k to ₹80k per trip depending on distance/vehicle type
    const avgRevenuePerTrip = 50000 + Math.floor(Math.random() * 30000);
    const totalRevenue = tripCount * avgRevenuePerTrip;
    
    const heavyVehicles = vehicles.filter(v => v.type === "Heavy").length;
    const mediumVehicles = vehicles.filter(v => v.type === "Medium").length;
    const miniVehicles = vehicles.filter(v => v.type === "Mini").length;
    
    // Realistic fuel costs: ₹8-15 per km, average trip 800km
    const avgTripDistance = 800;
    const fuelCostPerKm = 10;
    const totalFuelCost = tripCount * avgTripDistance * fuelCostPerKm * (1 + Math.random() * 0.2);
    
    // Maintenance cost: ₹30k-50k per vehicle per month
    const maintenanceCostPerVehicle = 35000 + Math.random() * 15000;
    const maintenanceCost = vehicles.length * maintenanceCostPerVehicle;
    
    const operationalCosts = 50000; // Driver salaries, insurance, tolls, etc.
    const totalCost = totalFuelCost + maintenanceCost + operationalCosts;
    const netProfit = totalRevenue - totalCost;
    
    const formatRupees = (num) => {
      if (num >= 1000000) {
        return `₹${(num / 100000).toFixed(1)}L`;
      }
      return `₹${Math.round(num / 1000)}K`;
    };
    
    return {
      month,
      revenue: formatRupees(totalRevenue),
      fuelCost: formatRupees(totalFuelCost),
      maintenance: formatRupees(maintenanceCost),
      netProfit: formatRupees(Math.max(0, netProfit)),
    };
  });
};

// Calculate KPI metrics
export const getAnalyticsKPIs = () => {
  const vehicles = getVehicles();
  const trips = getTrips();
  
  // Total fuel cost (yearly estimate)
  const heavyVehicles = vehicles.filter(v => v.type === "Heavy").length;
  const mediumVehicles = vehicles.filter(v => v.type === "Medium").length;
  const miniVehicles = vehicles.filter(v => v.type === "Mini").length;
  
  // Realistic fuel cost calculation
  const avgTripDistance = 800;
  const fuelCostPerKm = 10;
  const monthlyTrips = 25;
  const monthlyFuelCost = monthlyTrips * avgTripDistance * fuelCostPerKm * (1 + 0.15);
  const totalFuelCost = monthlyFuelCost * 12;
  
  // Fleet ROI calculation
  const activeVehicles = vehicles.filter(v => v.status !== "Maintenance").length;
  const totalVehicles = vehicles.length;
  const utilizationRate = Math.round((activeVehicles / totalVehicles) * 100);
  
  // Realistic ROI: 15-25% for well-performing fleets
  let roi = 8;
  if (utilizationRate > 80) roi = 24.5;
  else if (utilizationRate > 70) roi = 18.3;
  else if (utilizationRate > 60) roi = 14.2;
  else if (utilizationRate > 50) roi = 11.8;
  
  // Calculate on-trip percentage
  const onTripCount = trips.filter(t => t.status === "On Trip").length;
  const utilizationPercent = Math.round((onTripCount / (trips.length || 1)) * 100);
  
  // Monthly revenue estimate
  const avgRevenuePerTrip = 60000;
  const monthlyRevenue = monthlyTrips * avgRevenuePerTrip;
  const yearlyRevenue = monthlyRevenue * 12;
  
  return [
    {
      label: "Monthly Revenue",
      value: `₹${Math.round(monthlyRevenue / 100000 * 10) / 10}L`,
      color: "#00e5a0",
    },
    {
      label: "Fleet ROI",
      value: `+${roi}%`,
      color: "#a78bfa",
    },
    {
      label: "Utilization Rate",
      value: `${utilizationPercent}%`,
      color: "#f59e0b",
    },
  ];
};
