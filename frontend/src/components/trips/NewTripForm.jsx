"use client";
import { useState } from 'react';

export default function NewTripForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission logic here
    console.log("Form submitted");
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">New Trip Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="select-vehicle" className="block text-sm font-medium text-gray-700">Select Vehicle</label>
            <select id="select-vehicle" name="select-vehicle" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              {/* Populate with vehicle data */}
              <option>Select a vehicle</option>
              <option>Trailer Truck - MH01AB1234</option>
              <option>Container Truck - MH02CD5678</option>
            </select>
          </div>
          <div>
            <label htmlFor="cargo-weight" className="block text-sm font-medium text-gray-700">Cargo Weight (Kg)</label>
            <input type="number" name="cargo-weight" id="cargo-weight" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="select-driver" className="block text-sm font-medium text-gray-700">Select Driver</label>
            <select id="select-driver" name="select-driver" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              {/* Populate with driver data */}
              <option>Select a driver</option>
              <option>John Doe</option>
              <option>Jane Smith</option>
            </select>
          </div>
          <div>
            <label htmlFor="origin-address" className="block text-sm font-medium text-gray-700">Origin Address</label>
            <input type="text" name="origin-address" id="origin-address" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
            <input type="text" name="destination" id="destination" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
          </div>
          <div>
            <label htmlFor="fuel-cost" className="block text-sm font-medium text-gray-700">Estimated Fuel Cost</label>
            <input type="number" name="fuel-cost" id="fuel-cost" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
