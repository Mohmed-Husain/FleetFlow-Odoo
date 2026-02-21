"use client";
import { useState, useMemo } from "react";

// ── Status config ─────────────────────────────────────────────────────────────
const statusCfg = {
  "New":         { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", dot: "#3b82f6"  },
  "In Progress": { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", dot: "#f59e0b"  },
  "Completed":   { bg: "rgba(0,229,160,0.1)",   color: "#00e5a0", dot: "#00e5a0"  },
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
export default function MaintenanceTable({ maintenance = [], onEditService, onDeleteService }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("logId");
  const [groupBy, setGroupBy] = useState("none");
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const handleSearch = (e) => setSearch(e.target.value);

  // Filter
  const filtered = useMemo(() => {
    return maintenance.filter((r) => {
      const matchesSearch = 
        r.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        r.issue.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filterStatus === "All" || r.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [maintenance, search, filterStatus]);

  // Sort
  const sorted = useMemo(() => {
    const sorted = [...filtered];
    
    switch(sortBy) {
      case "logIdAsc":
        sorted.sort((a, b) => a.logId - b.logId);
        break;
      case "logIdDesc":
        sorted.sort((a, b) => b.logId - a.logId);
        break;
      case "vehicle":
        sorted.sort((a, b) => a.vehicle.localeCompare(b.vehicle));
        break;
      case "cost":
        sorted.sort((a, b) => {
          const aVal = parseInt(a.cost.replace(/[^0-9]/g, ''));
          const bVal = parseInt(b.cost.replace(/[^0-9]/g, ''));
          return bVal - aVal;
        });
        break;
      case "status":
        sorted.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "date":
        sorted.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [filtered, sortBy]);

  // Group
  const grouped = useMemo(() => {
    if (groupBy === "none") {
      return { ungrouped: sorted };
    }

    const grouped = {};
    
    sorted.forEach(item => {
      let key;
      
      if (groupBy === "vehicle") {
        key = item.vehicle;
      } else if (groupBy === "status") {
        key = item.status;
      } else if (groupBy === "date") {
        key = item.date;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  }, [sorted, groupBy]);

  const buttonStyle = { 
    background: "none", 
    border: "none", 
    color: "#9ca3af", 
    fontSize: 12, 
    fontFamily: "'Outfit', sans-serif", 
    fontWeight: 500, 
    padding: "0 12px", 
    cursor: "pointer",
    position: 'relative'
  };

  return (
    <div style={styles.wrapper}>

      {/* Header row */}
      <div style={styles.header}>
        <span style={styles.title}>Maintenance Logs</span>

        {/* Search */}
        <div style={styles.searchWrap}>
          <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search vehicle or issue…"
            style={styles.searchInput}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowGroupMenu(!showGroupMenu)} style={buttonStyle}>Group by</button>
            {showGroupMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: "#111114",
                border: "1px solid #27272e",
                borderRadius: 8,
                marginTop: '0.25rem',
                zIndex: 10,
                minWidth: '150px'
              }}>
                {['none', 'vehicle', 'status', 'date'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setGroupBy(option);
                      setShowGroupMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: groupBy === option ? '#27272e' : 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: "'Outfit', sans-serif",
                      borderRadius: option === 'none' ? '8px 8px 0 0' : (option === 'date' ? '0 0 8px 8px' : '0'),
                    }}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ width: 1, height: 18, background: "#27272e" }} />
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} style={buttonStyle}>Filter</button>
            {showFilterMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: "#111114",
                border: "1px solid #27272e",
                borderRadius: 8,
                marginTop: '0.25rem',
                zIndex: 10,
                minWidth: '150px'
              }}>
                {['All', 'New', 'In Progress', 'Completed'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setFilterStatus(option);
                      setShowFilterMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: filterStatus === option ? '#27272e' : 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: "'Outfit', sans-serif",
                      borderRadius: option === 'All' ? '8px 8px 0 0' : (option === 'Completed' ? '0 0 8px 8px' : '0'),
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ width: 1, height: 18, background: "#27272e" }} />
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSortMenu(!showSortMenu)} style={buttonStyle}>Sort by</button>
            {showSortMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: "#111114",
                border: "1px solid #27272e",
                borderRadius: 8,
                marginTop: '0.25rem',
                zIndex: 10,
                minWidth: '180px'
              }}>
                {[
                  { value: 'logIdAsc', label: 'Log ID (Asc)' },
                  { value: 'logIdDesc', label: 'Log ID (Desc)' },
                  { value: 'vehicle', label: 'Vehicle Name' },
                  { value: 'cost', label: 'Cost (High)' },
                  { value: 'date', label: 'Date (Recent)' },
                  { value: 'status', label: 'Status' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: sortBy === option.value ? '#27272e' : 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: "'Outfit', sans-serif",
                      borderRadius: option.value === 'logIdAsc' ? '8px 8px 0 0' : (option.value === 'status' ? '0 0 8px 8px' : '0'),
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        {sorted.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#4b5563", fontSize: 13 }}>
            No records match your search.
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([groupKey, items]) => (
              <div key={groupKey}>
                {groupBy !== 'none' && (
                  <div style={{ 
                    background: "#111114", 
                    padding: '0.75rem 1rem', 
                    marginTop: '0.5rem', 
                    marginBottom: '0.5rem',
                    borderRadius: 4,
                    fontWeight: 'bold',
                    color: '#9ca3af',
                    borderLeft: '3px solid #00e5a0',
                    fontSize: 12
                  }}>
                    {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}: {groupKey}
                  </div>
                )}
                <table style={styles.table}>
                  {groupBy === 'none' && (
                    <thead>
                      <tr>
                        {["Log ID", "Vehicle", "Issue / Service", "Date", "Cost", "Status", "Actions"].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {items.map((item) => (
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
                            <button 
                              onClick={() => confirm('Edit functionality coming soon')} 
                              style={styles.actBtn("#9ca3af", "#00e5a0")}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => onDeleteService(item.logId)} 
                              style={styles.actBtn("#9ca3af", "#f87171")}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
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