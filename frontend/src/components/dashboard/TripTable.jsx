"use client";
import { useState, useEffect } from "react";
import { getTrips, deleteTrip, searchItems, filterItems, sortItems } from "../../lib/storage";

// ── Status badge colours ──────────────────────────────────────────────────────
const statusStyle = {
  "On Trip":     { background: "rgba(0,229,160,0.12)",  color: "#00e5a0",  dot: "#00e5a0"  },
  "Idle":        { background: "rgba(107,114,128,0.15)", color: "#9ca3af", dot: "#9ca3af"  },
  "Maintenance": { background: "rgba(245,158,11,0.12)", color: "#f59e0b",  dot: "#f59e0b"  },
};

const StatusBadge = ({ status }) => {
  const s = statusStyle[status] ?? statusStyle["Idle"];
  return (
    <span style={{ ...styles.badge, background: s.background, color: s.color }}>
      <span style={{ ...styles.dot, background: s.dot }} />
      {status}
    </span>
  );
};

// ── TripTable ─────────────────────────────────────────────────────────────────
export default function TripTable({ search = "", filters = {}, sortBy = "" }) {
  const [tripData, setTripData] = useState([]);

  // Load and update data whenever search, filters, or sort changes
  useEffect(() => {
    let data = getTrips();

    // Apply search
    if (search) {
      data = searchItems(data, search, ["vehicle", "origin", "destination", "driver", "type"]);
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
      data = filterItems(data, filters);
    }

    // Apply sort
    if (sortBy) {
      data = sortItems(data, sortBy);
    }

    setTripData(data);
  }, [search, filters, sortBy]);

  const handleRowClick = (trip) => { /* TODO: open trip detail */ };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <input type="text" placeholder="Search bar....." style={styles.searchBar} />
        <div>
          <button style={styles.actionButton}>Group by</button>
          <button style={styles.actionButton}>Filter</button>
          <button style={styles.actionButton}>Sort by...</button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Trip Fleet Type", "Origin", "Destination", "Status"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tripData.map((trip, i) => (
              <tr
                key={trip.id}
                style={styles.tr}
                onClick={() => handleRowClick(trip)}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1c1c22"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ ...styles.td, color: "#e5e7eb" }}>{trip.type}</td>
                <td style={{ ...styles.td, color: "#d1d5db" }}>{trip.origin}</td>
                <td style={{ ...styles.td, color: "#d1d5db" }}>{trip.destination}</td>
                <td style={styles.td}><StatusBadge status={trip.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    background: "#18181c",
    border: "1px solid #1f1f26",
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px 14px",
    borderBottom: "1px solid #1f1f26",
  },
  searchBar: {
    background: "#2a2a30",
    border: "1px solid #3a3a42",
    borderRadius: 8,
    color: "#f0f0f5",
    padding: "8px 12px",
    fontSize: 14,
  },
  actionButton: {
    background: "#2a2a30",
    border: "1px solid #3a3a42",
    borderRadius: 8,
    color: "#f0f0f5",
    padding: "8px 12px",
    fontSize: 14,
    marginLeft: 8,
    cursor: "pointer",
  },
  title: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    color: "#f0f0f5",
  },
  viewAll: {
    background: "none",
    border: "none",
    color: "#00e5a0",
    fontSize: 12,
    fontFamily: "'Outfit', sans-serif",
    cursor: "pointer",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 24px",
    fontSize: 11,
    color: "#4b5563",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: "1px solid #1f1f26",
  },
  tr: {
    cursor: "pointer",
    transition: "background 0.1s",
    borderBottom: "1px solid #1a1a20",
  },
  td: {
    padding: "13px 24px",
    fontSize: 13,
    fontFamily: "'Outfit', sans-serif",
    color: "#9ca3af",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
};