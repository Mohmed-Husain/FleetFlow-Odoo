"use client";
import { useState } from 'react';

export default function NewExpenseForm({ closeModal, onAddExpense }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tripId: '',
    driver: '',
    distance: '',
    fuelExpense: '',
    miscExpense: '',
    status: 'Pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.tripId || !formData.driver || !formData.distance || !formData.fuelExpense) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call parent function with the new expense data
      onAddExpense({
        tripId: parseInt(formData.tripId),
        driver: formData.driver,
        distance: formData.distance,
        fuelExpense: formData.fuelExpense,
        miscExpense: formData.miscExpense || '0',
        status: formData.status
      });
      
      setIsSubmitting(false);
      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">New Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="tripId" className="block text-sm font-medium text-gray-700">Trip ID *</label>
              <input 
                type="number" 
                name="tripId" 
                id="tripId" 
                required
                value={formData.tripId}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2" 
              />
            </div>
            <div>
              <label htmlFor="driver" className="block text-sm font-medium text-gray-700">Driver *</label>
              <input 
                type="text" 
                name="driver" 
                id="driver" 
                required
                value={formData.driver}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2" 
              />
            </div>
            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700">Distance *</label>
              <input 
                type="text" 
                name="distance" 
                id="distance" 
                placeholder="e.g., 100 km"
                required
                value={formData.distance}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2" 
              />
            </div>
            <div>
              <label htmlFor="fuelExpense" className="block text-sm font-medium text-gray-700">Fuel Expense *</label>
              <input 
                type="text" 
                name="fuelExpense" 
                id="fuelExpense" 
                placeholder="e.g., 50k or 50000"
                required
                value={formData.fuelExpense}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2" 
              />
            </div>
            <div>
              <label htmlFor="miscExpense" className="block text-sm font-medium text-gray-700">Misc Expense</label>
              <input 
                type="text" 
                name="miscExpense" 
                id="miscExpense" 
                placeholder="e.g., 5k (optional)"
                value={formData.miscExpense}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2" 
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select 
                name="status" 
                id="status" 
                value={formData.status}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
              </select>
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
