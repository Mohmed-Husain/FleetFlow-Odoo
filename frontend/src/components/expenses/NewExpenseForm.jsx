"use client";
import { useState } from 'react';

export default function NewExpenseForm({ closeModal }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission logic here
    console.log("Form submitted");
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">New Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="trip-id" className="block text-sm font-medium text-gray-700">Trip ID</label>
              <input type="text" name="trip-id" id="trip-id" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="driver" className="block text-sm font-medium text-gray-700">Driver</label>
              <input type="text" name="driver" id="driver" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="fuel-cost" className="block text-sm font-medium text-gray-700">Fuel Cost</label>
              <input type="text" name="fuel-cost" id="fuel-cost" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="misc-expense" className="block text-sm font-medium text-gray-700">Misc Expense</label>
              <input type="text" name="misc-expense" id="misc-expense" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
