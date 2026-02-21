"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MaintenanceTable from "@/components/maintenance/MaintenanceTable";
import NewServiceForm from "@/components/maintenance/NewServiceForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function MaintenancePage() {
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleServiceCreated = () => {
    setShowNewServiceForm(false);
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
              <h1 className="text-2xl font-semibold text-gray-800">Maintenance & Service</h1>
              <button
                onClick={() => setShowNewServiceForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Create New Service
              </button>
            </div>
            <div className="bg-white p-4 rounded-md shadow-md">
              <MaintenanceTable key={refreshKey} />
            </div>
            {showNewServiceForm && (
              <NewServiceForm
                closeModal={() => setShowNewServiceForm(false)}
                onSuccess={handleServiceCreated}
              />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
