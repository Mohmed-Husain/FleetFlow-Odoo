"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import TripTable from "@/components/dashboard/TripTable";
import { initializeStorage } from "@/lib/storage";

export default function TripsPage() {
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    initializeStorage();
  }, []);

  const handleSearch = (val) => {
    setSearch(val);
  };

  const handleFilter = () => {
    setShowFilterMenu(!showFilterMenu);
  };

  const handleSortBy = () => {
    setShowSortMenu(!showSortMenu);
  };

  const applyFilter = (filterKey, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
    setShowFilterMenu(false);
  };

  const applySortBy = (sortField) => {
    setSortBy(sortField);
    setShowSortMenu(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0d0d10] font-[Outfit]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar 
          onSearch={handleSearch}
          onFilter={handleFilter}
          onSortBy={handleSortBy}
          actions={[
            { label: "+ New Trip", variant: "primary", onClick: () => setShowNewTripForm(true) },
          ]}
        />
        <main className="flex-1 overflow-y-auto p-7 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-[26px] font-extrabold text-[#f0f0f5] tracking-tight">Trip Dispatcher & Management</h1>
              <p className="text-sm text-[#6b7280] mt-1">Manage and track all fleet trips in real-time</p>
            </div>
          </div>

          {/* Filter & Sort Controls */}
          {(showFilterMenu || showSortMenu) && (
            <div className="bg-[#18181c] border border-[#27272e] rounded-lg p-4 flex gap-4">
              {showFilterMenu && (
                <div className="flex gap-2">
                  <button
                    onClick={() => applyFilter("status", "Idle")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => applyFilter("status", "On Trip")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                  >
                    On Trip
                  </button>
                  <button
                    onClick={() => applyFilter("status", "Maintenance")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#f59e0b]/20 text-[#9ca3af] hover:text-[#f59e0b] transition-all"
                  >
                    Maintenance
                  </button>
                  <button
                    onClick={() => setFilters({})}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#f87171]/20 text-[#6b7280] hover:text-[#f87171] transition-all"
                  >
                    Clear
                  </button>
                </div>
              )}
              {showSortMenu && (
                <div className="flex gap-2">
                  <button
                    onClick={() => applySortBy("vehicle")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                  >
                    Vehicle
                  </button>
                  <button
                    onClick={() => applySortBy("origin")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                  >
                    Origin
                  </button>
                  <button
                    onClick={() => applySortBy("destination")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                  >
                    Destination
                  </button>
                  <button
                    onClick={() => setSortBy("")}
                    className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#f87171]/20 text-[#6b7280] hover:text-[#f87171] transition-all"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {Object.keys(filters).length > 0 && (
            <div className="text-sm text-[#9ca3af]">
              <span>Active filters: </span>
              {Object.entries(filters).map(([key, val]) => (
                <span key={key} className="bg-[#00e5a0]/10 text-[#00e5a0] px-2 py-1 rounded-lg ml-2">
                  {key}: {val}
                </span>
              ))}
            </div>
          )}

          <TripTable 
            search={search}
            filters={filters}
            sortBy={sortBy}
          />
        </main>
      </div>
    </div>
  );
}
