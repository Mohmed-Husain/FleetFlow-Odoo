"use client";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import TripTable from "@/components/dashboard/TripTable";
import NewTripForm from "@/components/trips/NewTripForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function TripsPage() {
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTripCreated = () => {
    setShowNewTripForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">Trip Dispatcher & Management</h1>
              <button
                onClick={() => setShowNewTripForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                New Trip Form
              </button>
            </div>
            <div className="bg-white p-4 rounded-md shadow-md">
              <TripTable key={refreshKey} />
            </div>
            {showNewTripForm && (
              <div className="mt-8">
                <NewTripForm
                  closeModal={() => setShowNewTripForm(false)}
                  onSuccess={handleTripCreated}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
