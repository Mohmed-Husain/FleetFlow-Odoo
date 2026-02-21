"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">Operational Analytics & Financial Reports</h1>
            <AnalyticsDashboard />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
