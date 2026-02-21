"use client";
import { trips } from "./dummydata";

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
export default function TripTable() {
  const handleRowClick = (trip) => { /* TODO: open trip detail */ };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Recent Trips</span>
        <button style={styles.viewAll}>View all →</button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Trip #", "Vehicle", "Driver", "Status"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, i) => (
              <tr
                key={trip.id}
                style={styles.tr}
                onClick={() => handleRowClick(trip)}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1c1c22"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ ...styles.td, color: "#9ca3af", fontWeight: 600 }}>
                  #{String(trip.id).padStart(3, "0")}
                </td>
                <td style={{ ...styles.td, color: "#e5e7eb", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  {trip.vehicle}
                </td>
                <td style={{ ...styles.td, color: "#d1d5db" }}>{trip.driver}</td>
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