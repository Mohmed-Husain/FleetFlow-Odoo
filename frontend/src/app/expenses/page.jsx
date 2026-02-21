"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import NewExpenseForm from "@/components/expenses/NewExpenseForm";

const initialExpenses = [
  { tripId: 321, driver: 'John', distance: '1000 km', fuelExpense: '19k', miscExpense: '3k', status: 'Done' },
  { tripId: 322, driver: 'Alice', distance: '500 km', fuelExpense: '10k', miscExpense: '2k', status: 'Done' },
  { tripId: 323, driver: 'Bob', distance: '1500 km', fuelExpense: '25k', miscExpense: '5k', status: 'Pending' },
  { tripId: 324, driver: 'John', distance: '800 km', fuelExpense: '15k', miscExpense: '1k', status: 'Pending' },
  { tripId: 325, driver: 'Charlie', distance: '1200 km', fuelExpense: '22k', miscExpense: '4k', status: 'Done' },
];

export default function ExpensePage() {
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [expenses, setExpenses] = useState(initialExpenses);

  // Load expenses from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (newExpense) => {
    // Generate a unique trip ID if not provided
    const tripId = newExpense.tripId || Math.max(...expenses.map(e => e.tripId), 0) + 1;
    
    const expenseWithId = {
      ...newExpense,
      tripId
    };
    
    setExpenses(prev => [expenseWithId, ...prev]);
  };

  return (
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
            <ExpenseTable expenses={expenses} onAddExpense={handleAddExpense} />
          </div>
          {showNewExpenseForm && (
            <NewExpenseForm 
              closeModal={() => setShowNewExpenseForm(false)} 
              onAddExpense={handleAddExpense}
            />
          )}
        </main>
      </div>
    </div>
  );
}
