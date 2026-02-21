"use client";
import { useState, useEffect } from 'react';
import { tripsApi, vehiclesApi, driversApi } from '@/lib/api';

export default function NewTripForm({ onSuccess, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    originAddress: '',
    destinationAddress: '',
    estimatedFuelCost: '',
  });

  // Fetch vehicles and drivers on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [vehicleRes, driverRes] = await Promise.all([
          vehiclesApi.getOptions().catch(() => []),
          driversApi.getOptions().catch(() => []),
        ]);
        setVehicles(vehicleRes || []);
        setDrivers(driverRes || []);
      } catch (err) {
        console.error("Failed to fetch options:", err);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.vehicleId || !form.driverId) {
      setError("Please select a vehicle and driver");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vehicle_id: form.vehicleId,
        driver_id: form.driverId,
        cargo_weight_kg: form.cargoWeight ? parseFloat(form.cargoWeight) : null,
        origin: form.originAddress || "N/A",
        destination: form.destinationAddress || "N/A",
        scheduled_departure: new Date().toISOString(),
      };

      await tripsApi.create(payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#18181c] border border-[#1f1f26] p-6 rounded-2xl">
      <h2 className="text-xl font-semibold text-[#f0f0f5] mb-4">New Trip Form</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-[13px] mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-[#9ca3af]">Select Vehicle *</label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              className="mt-1 block w-full bg-[#111114] border border-[#2a2a34] rounded-lg px-3 py-2 text-[#e5e7eb] focus:border-[#00e5a0] outline-none"
            >
              <option value="">Select a vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.label || v.license_plate}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cargoWeight" className="block text-sm font-medium text-[#9ca3af]">Cargo Weight (Kg)</label>
            <input
              type="number"
              name="cargoWeight"
              id="cargoWeight"
              value={form.cargoWeight}
              onChange={handleChange}
              className="mt-1 block w-full bg-[#111114] border border-[#2a2a34] rounded-lg px-3 py-2 text-[#e5e7eb] focus:border-[#00e5a0] outline-none"
            />
          </div>
          <div>
            <label htmlFor="driverId" className="block text-sm font-medium text-[#9ca3af]">Select Driver *</label>
            <select
              id="driverId"
              name="driverId"
              value={form.driverId}
              onChange={handleChange}
              className="mt-1 block w-full bg-[#111114] border border-[#2a2a34] rounded-lg px-3 py-2 text-[#e5e7eb] focus:border-[#00e5a0] outline-none"
            >
              <option value="">Select a driver</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.label || d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="originAddress" className="block text-sm font-medium text-[#9ca3af]">Origin Address</label>
            <input
              type="text"
              name="originAddress"
              id="originAddress"
              value={form.originAddress}
              onChange={handleChange}
              className="mt-1 block w-full bg-[#111114] border border-[#2a2a34] rounded-lg px-3 py-2 text-[#e5e7eb] focus:border-[#00e5a0] outline-none"
            />
          </div>
          <div>
            <label htmlFor="destinationAddress" className="block text-sm font-medium text-[#9ca3af]">Destination</label>
            <input
              type="text"
              name="destinationAddress"
              id="destinationAddress"
              value={form.destinationAddress}
              onChange={handleChange}
              className="mt-1 block w-full bg-[#111114] border border-[#2a2a34] rounded-lg px-3 py-2 text-[#e5e7eb] focus:border-[#00e5a0] outline-none"
            />
          </div>
          <div>
            <label htmlFor="estimatedFuelCost" className="block text-sm font-medium text-[#9ca3af]">Estimated Fuel Cost (₹)</label>
            <input
              type="number"
              name="estimatedFuelCost"
              id="estimatedFuelCost"
              value={form.estimatedFuelCost}
              onChange={handleChange}
              className="mt-1 block w-full bg-[#111114] border border-[#2a2a34] rounded-lg px-3 py-2 text-[#e5e7eb] focus:border-[#00e5a0] outline-none"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-[#27272e] rounded-lg text-sm font-medium text-[#9ca3af] hover:border-[#3d3d4a] hover:text-[#d1d5db] transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex justify-center py-2 px-4 rounded-lg text-sm font-bold text-[#0a0a0c] bg-[#00e5a0] hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
