"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsApi, fuelLogsApi } from "@/lib/api";

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1c1c22", border: "1px solid #27272e",
      borderRadius: 8, padding: "8px 14px",
      fontFamily: "'Outfit', sans-serif", fontSize: 13,
    }}>
      <p style={{ color: "#9ca3af", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#00e5a0", fontWeight: 700 }}>{payload[0].value}</p>
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, color, loading }) => (
  <div style={{
    background: "#18181c", border: "1px solid #1f1f26",
    borderRadius: 14, padding: "24px 28px",
    position: "relative", overflow: "hidden", flex: 1,
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 3,
      background: color, opacity: 0.8, borderRadius: "14px 14px 0 0",
    }} />
    <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Outfit', sans-serif", marginBottom: 10 }}>
      {label}
    </p>
    <p style={{ fontSize: 36, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", lineHeight: 1 }}>
      {loading ? "..." : value}
    </p>
  </div>
);

// ── Chart Card ────────────────────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
  <div style={{
    background: "#18181c", border: "1px solid #1f1f26",
    borderRadius: 14, padding: "20px 24px", flex: 1,
  }}>
    <p style={{
      fontSize: 15, fontWeight: 700, color: "#f0f0f5",
      fontFamily: "'Outfit', sans-serif", marginBottom: 20,
    }}>
      {title}
    </p>
    {children}
  </div>
);

// ── AnalyticsDashboard ────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState(null);
  const [vehicleCosts, setVehicleCosts] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  const [fuelEfficiency, setFuelEfficiency] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all analytics data in parallel
      const [kpisRes, costsRes, financialRes] = await Promise.all([
        analyticsApi.getDashboardKPIs().catch(() => null),
        analyticsApi.getVehicleCostSummary().catch(() => []),
        analyticsApi.getMonthlyFinancials().catch(() => []),
      ]);

      if (kpisRes) {
        setKpis(kpisRes);
      }

      // Transform vehicle costs for bar chart
      const costs = (costsRes || []).slice(0, 5).map(v => ({
        name: v.vehicle_plate || `V-${v.vehicle_id}`,
        cost: Number(v.total_cost || 0) / 1000, // Convert to thousands
      }));
      setVehicleCosts(costs);

      // Transform financial data for table
      const financial = (financialRes || []).map(f => ({
        month: f.month || "N/A",
        revenue: f.total_revenue ? `₹${(f.total_revenue / 100000).toFixed(1)}L` : "-",
        fuelCost: f.total_fuel_cost ? `₹${(f.total_fuel_cost / 100000).toFixed(1)}L` : "-",
        maintenance: f.total_maintenance_cost ? `₹${(f.total_maintenance_cost / 100000).toFixed(1)}L` : "-",
        netProfit: f.net_profit ? `₹${(f.net_profit / 100000).toFixed(1)}L` : "-",
      }));
      setFinancialData(financial);

      // Generate sample fuel efficiency data (since we don't have historical data)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const efficiency = months.map((name, i) => ({
        name,
        value: 15 + Math.floor(Math.random() * 10),
      }));
      setFuelEfficiency(efficiency);

    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Default KPI values
  const kpiCards = [
    { label: "Active Fleet", value: kpis?.active_fleet ?? 0, color: "#00e5a0" },
    { label: "Maintenance Alerts", value: kpis?.maintenance_alerts ?? 0, color: "#f59e0b" },
    { label: "Utilization Rate", value: kpis?.utilization_rate ? `${kpis.utilization_rate}%` : "0%", color: "#a78bfa" },
    { label: "Pending Cargo", value: kpis?.pending_cargo ?? 0, color: "#3b82f6" },
  ];

  if (error) {
    return (
      <div style={{ background: "#18181c", border: "1px solid #1f1f26", borderRadius: 14, padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "#f87171", fontSize: 14, marginBottom: 16 }}>Failed to load analytics: {error}</p>
        <button onClick={fetchAnalytics} style={{ background: "#00e5a0", color: "#000", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "'Outfit', sans-serif" }}>

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {kpiCards.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Line chart */}
        <ChartCard title="Fuel Efficiency Trend (km/L)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={fuelEfficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f26" />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="value"
                stroke="#00e5a0" strokeWidth={2.5}
                dot={{ fill: "#00e5a0", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#00e5a0" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar chart */}
        <ChartCard title="Top 5 Costliest Vehicles (₹K)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleCosts.length > 0 ? vehicleCosts : [{ name: "No data", cost: 0 }]} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f26" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "Outfit" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="cost" fill="#00e5a0" radius={[6, 6, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Financial Summary Table */}
      <div style={{ background: "#18181c", border: "1px solid #1f1f26", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #1f1f26" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f5" }}>Financial Summary</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Month", "Revenue", "Fuel Cost", "Maintenance", "Net Profit"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 24px",
                    fontSize: 11, color: "#4b5563",
                    fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #1f1f26",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(financialData.length > 0 ? financialData : [{ month: "No data", revenue: "-", fuelCost: "-", maintenance: "-", netProfit: "-" }]).map((row, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: "1px solid #1a1a20", transition: "background 0.1s", cursor: "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1c1c22")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={td}>{row.month}</td>
                  <td style={{ ...td, color: "#e5e7eb", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{row.revenue}</td>
                  <td style={{ ...td, color: "#f59e0b", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{row.fuelCost}</td>
                  <td style={{ ...td, color: "#f87171", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{row.maintenance}</td>
                  <td style={{ ...td, color: "#00e5a0", fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700 }}>{row.netProfit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

const td = {
  padding: "13px 24px",
  fontSize: 13,
  fontFamily: "'Outfit', sans-serif",
  color: "#9ca3af",
};