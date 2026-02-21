"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import PerformanceTable from "@/components/performance/PerformanceTable";

export default function PerformancePage() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div className="flex h-screen bg-[#0d0d10] overflow-hidden font-[Outfit]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-7 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[26px] font-extrabold text-[#f0f0f5] tracking-tight">Driver Performance & Safety</h1>
                <p className="text-sm text-[#6b7280] mt-1">Monitor driver metrics, completion rates, and safety scores</p>
              </div>
            </div>
            <PerformanceTable />
          </main>
        </div>
      </div>
    </>
  );
}
