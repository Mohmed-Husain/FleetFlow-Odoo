"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MaintenanceTable from "@/components/maintenance/MaintenanceTable";
import NewServiceForm from "@/components/maintenance/NewServiceForm";

const initialMaintenanceData = [
  { logId: 321, vehicle: "TATA 407",    issue: "Engine Issue",       date: "20/02/2025", cost: "₹10,000", status: "New"         },
  { logId: 322, vehicle: "Ashok Leyland",issue: "Brake Replacement", date: "18/02/2025", cost: "₹6,500",  status: "In Progress" },
  { logId: 323, vehicle: "MH-12-AB-1234",issue: "Oil Change",        date: "15/02/2025", cost: "₹2,200",  status: "Completed"   },
  { logId: 324, vehicle: "GJ-01-CD-5678",issue: "Tyre Puncture",     date: "12/02/2025", cost: "₹800",    status: "Completed"   },
  { logId: 325, vehicle: "DL-03-EF-9012",issue: "AC Repair",         date: "10/02/2025", cost: "₹4,500",  status: "In Progress" },
  { logId: 326, vehicle: "KA-05-GH-3456",issue: "Battery Dead",      date: "08/02/2025", cost: "₹3,200",  status: "New"         },
];

export default function MaintenancePage() {
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [maintenance, setMaintenance] = useState(initialMaintenanceData);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMaintenance = localStorage.getItem('maintenance');
    if (savedMaintenance) {
      try {
        setMaintenance(JSON.parse(savedMaintenance));
      } catch (error) {
        console.error('Error loading maintenance data:', error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('maintenance', JSON.stringify(maintenance));
  }, [maintenance]);

  const handleAddService = (newService) => {
    const logId = Math.max(...maintenance.map(m => m.logId), 0) + 1;
    const serviceWithId = {
      ...newService,
      logId,
      status: newService.status || 'New'
    };
    setMaintenance(prev => [serviceWithId, ...prev]);
  };

  const handleEditService = (logId, updatedService) => {
    setMaintenance(prev => 
      prev.map(item => item.logId === logId ? { ...item, ...updatedService } : item)
    );
  };

  const handleDeleteService = (logId) => {
    if (confirm('Are you sure you want to delete this record?')) {
      setMaintenance(prev => prev.filter(item => item.logId !== logId));
    }
  };

  return (
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
            <MaintenanceTable 
              maintenance={maintenance} 
              onAddService={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
            />
          </div>
          {showNewServiceForm && (
            <NewServiceForm 
              closeModal={() => setShowNewServiceForm(false)} 
              onAddService={handleAddService}
            />
          )}
        </main>
      </div>
    </div>
  );
}
