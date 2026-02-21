"use client";
import { useState, useEffect } from "react";
import { maintenanceApi } from "@/lib/api";

// Map API status to display format
const statusMap = {
  "scheduled": "New",
  "in_progress": "In Progress",
  "completed": "Completed",
  "cancelled": "Cancelled",
};

// ── Status config ─────────────────────────────────────────────────────────────
const statusCfg = {
  "New": { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", dot: "#3b82f6" },
  "In Progress": { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", dot: "#f59e0b" },
  "Completed": { bg: "rgba(0,229,160,0.1)", color: "#00e5a0", dot: "#00e5a0" },
  "Cancelled": { bg: "rgba(239,68,68,0.1)", color: "#ef4444", dot: "#ef4444" },
};

const StatusBadge = ({ status }) => {
  const s = statusCfg[status] ?? { bg: "rgba(107,114,128,0.1)", color: "#6b7280", dot: "#6b7280" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.bg, color: s.color,
      padding: "4px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

// ── MaintenanceTable ──────────────────────────────────────────────────────────
export default function MaintenanceTable() {
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchMaintenance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await maintenanceApi.getAll();
      // Transform API response to match component format
      const logs = (response.data || response || []).map(m => ({
        logId: m.id,
        vehicle: m.vehicle_plate || `Vehicle #${m.vehicle_id}`,
        issue: m.description || m.service_type || "Maintenance",
        date: m.start_date ? new Date(m.start_date).toLocaleDateString('en-GB') : "-",
        cost: m.estimated_cost ? `₹${Number(m.estimated_cost).toLocaleString()}` : "-",
        status: statusMap[m.status] || m.status,
      }));
      setMaintenanceData(logs);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch maintenance logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);
  const handleGroupBy = () => { /* TODO: implement group by */ };
  const handleFilter = () => { /* TODO: implement filter   */ };
  const handleSortBy = () => { /* TODO: implement sort by  */ };
  const handleEdit = (logId) => { /* TODO: open edit modal  */ };

  const handleDelete = async (logId) => {
    if (!confirm("Are you sure you want to delete this maintenance log?")) return;
    try {
      await maintenanceApi.delete(logId);
      setMaintenanceData(data => data.filter(m => m.logId !== logId));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const filtered = maintenanceData.filter(
    (r) =>
      r.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      r.issue.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Loading maintenance logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrapper}>
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <p style={{ color: "#f87171", fontSize: 14, marginBottom: 16 }}>Failed to load maintenance logs: {error}</p>
          <button onClick={fetchMaintenance} style={{ background: "#00e5a0", color: "#000", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>

      {/* Header row */}
      <div style={styles.header}>
        <span style={styles.title}>Maintenance Logs</span>

        {/* Search */}
        <div style={styles.searchWrap}>
          <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search vehicle or issue…"
            style={styles.searchInput}
          />
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <button onClick={handleGroupBy} style={styles.ctrlBtn}>Group by</button>
          <div style={styles.divider} />
          <button onClick={handleFilter} style={styles.ctrlBtn}>Filter</button>
          <div style={styles.divider} />
          <button onClick={handleSortBy} style={styles.ctrlBtn}>Sort by</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Log ID", "Vehicle", "Issue / Service", "Date", "Cost", "Status", "Actions"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.logId}
                style={styles.tr}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1c1c22")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace", color: "#6b7280", fontWeight: 600 }}>
                  #{item.logId}
                </td>
                <td style={{ ...styles.td, color: "#e5e7eb", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  {item.vehicle}
                </td>
                <td style={{ ...styles.td, color: "#d1d5db" }}>{item.issue}</td>
                <td style={{ ...styles.td, color: "#9ca3af", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  {item.date}
                </td>
                <td style={{ ...styles.td, color: "#d1d5db", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  {item.cost}
                </td>
                <td style={styles.td}>
                  <StatusBadge status={item.status} />
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => handleEdit(item.logId)} style={styles.actBtn("#9ca3af", "#00e5a0")}>Edit</button>
                    <button onClick={() => handleDelete(item.logId)} style={styles.actBtn("#9ca3af", "#f87171")}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px 24px", textAlign: "center", color: "#4b5563", fontSize: 13 }}>
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    background: "#18181c",
    border: "1px solid #1f1f26",
    borderRadius: 14,
    overflow: "hidden",
    fontFamily: "'Outfit', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    borderBottom: "1px solid #1f1f26",
    flexWrap: "wrap",
  },
  title: {
    fontWeight: 700,
    fontSize: 15,
    color: "#f0f0f5",
    marginRight: 8,
    whiteSpace: "nowrap",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: 8,
    padding: "0 12px",
    height: 34,
    width: 240,
  },
  searchInput: {
    background: "none",
    border: "none",
    outline: "none",
    color: "#d1d5db",
    fontSize: 13,
    fontFamily: "'Outfit', sans-serif",
    width: "100%",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: 8,
    height: 34,
    overflow: "hidden",
    marginLeft: "auto",
  },
  divider: { width: 1, height: 18, background: "#27272e" },
  ctrlBtn: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    fontSize: 12,
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 500,
    padding: "0 12px",
    height: "100%",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 20px",
    fontSize: 11,
    color: "#4b5563",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: "1px solid #1f1f26",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #1a1a20",
    cursor: "pointer",
    transition: "background 0.1s",
  },
  td: {
    padding: "13px 20px",
    fontSize: 13,
    fontFamily: "'Outfit', sans-serif",
    color: "#9ca3af",
    whiteSpace: "nowrap",
  },
  // returns a style object for action buttons based on default/hover colors
  actBtn: (defaultColor, hoverColor) => ({
    background: "none",
    border: "none",
    color: defaultColor,
    fontSize: 12,
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    // hover handled inline via onMouseEnter/Leave
  }),
};