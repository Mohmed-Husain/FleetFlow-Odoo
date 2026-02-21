"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import NewExpenseForm from "@/components/expenses/NewExpenseForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ExpensePage() {
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExpenseCreated = () => {
    setShowNewExpenseForm(false);
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
              <h1 className="text-2xl font-semibold text-gray-800">Expense & Fuel Logging</h1>
              <button
                onClick={() => setShowNewExpenseForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Add an Expense
              </button>
            </div>
            <div className="bg-white p-4 rounded-md shadow-md">
              <ExpenseTable key={refreshKey} />
            </div>
            {showNewExpenseForm && (
              <NewExpenseForm
                closeModal={() => setShowNewExpenseForm(false)}
                onSuccess={handleExpenseCreated}
              />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
