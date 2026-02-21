// ── Storage Utilities ──────────────────────────────────────────────────────
// Browser-based data storage for dashboard functionalities

const STORAGE_KEYS = {
  VEHICLES: "fleetflow_vehicles",
  TRIPS: "fleetflow_trips",
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
