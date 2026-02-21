"use client";
import { useState } from "react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar  from "../../components/dashboard/Topbar";
import NewVehicleModal from "../../components/dashboard/NewVehicleModal";
import VehicleTable    from "../../components/dashboard/VehicleTable";
import StatCard from "../../components/dashboard/StatCard";

export default function VehicleRegistryPage() {
  const [activeNav, setActiveNav]     = useState("Vehicle Registry");
  const [showModal, setShowModal]     = useState(false);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div className="flex h-screen bg-[#0d0d10] overflow-hidden font-[Outfit]">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            onSearch={(val) => { /* TODO: filter vehicles by val */ }}
            onGroupBy={() => { /* TODO: group by */ }}
            onFilter={() => { /* TODO: filter */ }}
            onSortBy={() => { /* TODO: sort */ }}
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

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Active Fleet" value="220" color="#00e5a0" />
              <StatCard label="Maintenance Alert" value="180" color="#ffc700" />
              <StatCard label="Pending Cargo" value="20" color="#ff5733" />
            </div>

            {/* Table */}
            <VehicleTable />
          </main>
        </div>

        {/* Modal */}
        {showModal && <NewVehicleModal onClose={() => setShowModal(false)} />}
      </div>
    </>
  );
}