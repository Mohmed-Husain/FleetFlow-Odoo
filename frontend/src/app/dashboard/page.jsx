"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar  from "../../components/dashboard/Topbar";
import NewVehicleModal from "../../components/dashboard/NewVehicleModal";
import VehicleTable    from "../../components/dashboard/VehicleTable";
import StatCard from "../../components/dashboard/StatCard";
import { initializeStorage } from "../../lib/storage";

export default function VehicleRegistryPage() {
  const [activeNav, setActiveNav]     = useState("Vehicle Registry");
  const [showModal, setShowModal]     = useState(false);
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("");
  const [filters, setFilters]         = useState({});
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize storage on component mount
  useEffect(() => {
    initializeStorage();
  }, []);

  const handleSearch = (val) => {
    setSearch(val);
  };

  const handleGroupBy = () => {
    // TODO: Implement grouping UI
    alert("Group by functionality - coming soon");
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

  const handleVehicleAdded = () => {
    // Trigger refresh of the VehicleTable
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div className="flex h-screen bg-[#0d0d10] overflow-hidden font-[Outfit]">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            onSearch={handleSearch}
            onGroupBy={handleGroupBy}
            onFilter={handleFilter}
            onSortBy={handleSortBy}
            actions={[
              { label: "+ New Trip", variant: "primary", onClick: () => {} },
              { label: "+ New Vehicle", variant: "primary", onClick: () => setShowModal(true) },
            ]}
          />
          <main className="flex-1 overflow-y-auto p-7 flex flex-col gap-6">
            {/* Page heading */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[26px] font-extrabold text-[#f0f0f5] tracking-tight">Vehicle Registry</h1>
                <p className="text-sm text-[#6b7280] mt-1">Manage and monitor all fleet assets</p>
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
                      onClick={() => applySortBy("plate")}
                      className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                    >
                      Plate
                    </button>
                    <button
                      onClick={() => applySortBy("model")}
                      className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                    >
                      Model
                    </button>
                    <button
                      onClick={() => applySortBy("odometer")}
                      className="px-3 py-1 text-xs rounded-lg bg-[#27272e] hover:bg-[#00e5a0]/20 text-[#9ca3af] hover:text-[#00e5a0] transition-all"
                    >
                      Odometer
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

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Active Fleet" value="220" color="#00e5a0" />
              <StatCard label="Maintenance Alert" value="180" color="#ffc700" />
              <StatCard label="Pending Cargo" value="20" color="#ff5733" />
            </div>

            {/* Table */}
            <VehicleTable 
              search={search} 
              filters={filters} 
              sortBy={sortBy}
              key={refreshTrigger}
            />
          </main>
        </div>

        {/* Modal */}
        {showModal && <NewVehicleModal onClose={() => setShowModal(false)} onVehicleAdded={handleVehicleAdded} />}
      </div>
    </>
  );
}