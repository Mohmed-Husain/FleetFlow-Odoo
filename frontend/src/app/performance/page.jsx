"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import PerformanceTable from "@/components/performance/PerformanceTable";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PerformancePage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">Driver Performance & Safety Profiles</h1>
            <div className="bg-white p-4 rounded-md shadow-md">
              <PerformanceTable />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
