"use client";
import { useState, useEffect } from "react";
import { initializeStorage, getDrivers, deleteDriver, searchItems, filterItems, sortItems, groupItems } from "../../lib/storage";

export default function PerformanceTable() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  // Load and update data
  useEffect(() => {
    initializeStorage();
    loadDrivers();
  }, [search, filters, sortBy, groupBy]);

  const loadDrivers = () => {
    let data = getDrivers();

    // Apply search
    if (search) {
      data = searchItems(data, search, ["name", "license"]);
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
      data = filterItems(data, filters);
    }

    // Apply sort
    if (sortBy) {
      data = sortItems(data, sortBy);
    }

    setDrivers(data);
  };

  const handleDelete = (id) => {
    deleteDriver(id);
    loadDrivers();
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

  const applyGroupBy = (groupField) => {
    setGroupBy(groupField);
    setShowGroupMenu(false);
  };

  const allDrivers = getDrivers();
  const groupedData = groupBy ? groupItems(drivers, groupBy) : null;

  return (
    <div style={{ background: "#18181c", border: "1px solid #1f1f26", borderRadius: 14, color: 'white', padding: '1rem' }}>
      {/* Search & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search drivers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "#2a2a30",
            border: "1px solid #3a3a42",
            borderRadius: 8,
            color: "#f0f0f5",
            padding: "8px 12px",
            width: "250px"
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowGroupMenu(!showGroupMenu)}
            style={{
              background: "#2a2a30",
              border: "1px solid #3a3a42",
              borderRadius: 8,
              color: "#f0f0f5",
              padding: "8px 12px",
              cursor: "pointer"
            }}
          >
            Group by
          </button>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              background: "#2a2a30",
              border: "1px solid #3a3a42",
              borderRadius: 8,
              color: "#f0f0f5",
              padding: "8px 12px",
              cursor: "pointer"
            }}
          >
            Filter
          </button>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            style={{
              background: "#2a2a30",
              border: "1px solid #3a3a42",
              borderRadius: 8,
              color: "#f0f0f5",
              padding: "8px 12px",
              cursor: "pointer"
            }}
          >
            Sort by
          </button>
        </div>
      </div>

      {/* Group By Menu */}
      {showGroupMenu && (
        <div style={{
          background: "#1f1f26",
          border: "1px solid #27272e",
          borderRadius: 8,
          padding: "12px",
          marginBottom: "1rem",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => applyGroupBy("safetyScore")}
            style={{ background: "#27272e", border: "none", borderRadius: 6, padding: "6px 12px", color: "#9ca3af", cursor: "pointer" }}
          >
            Safety Score
          </button>
          <button
            onClick={() => applyGroupBy("completionRate")}
            style={{ background: "#27272e", border: "none", borderRadius: 6, padding: "6px 12px", color: "#9ca3af", cursor: "pointer" }}
          >
            Completion Rate
          </button>
          <button
            onClick={() => setGroupBy("")}
            style={{ background: "#f87171", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer" }}
          >
            Clear Group
          </button>
        </div>
      )}

      {/* Filter Menu */}
      {showFilterMenu && (
        <div style={{
          background: "#1f1f26",
          border: "1px solid #27272e",
          borderRadius: 8,
          padding: "12px",
          marginBottom: "1rem",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          <div>
            <label style={{ color: "#6b7280", fontSize: "12px" }}>Safety Score:</label>
            <select
              onChange={(e) => e.target.value && applyFilter("safetyScore", parseInt(e.target.value))}
              defaultValue=""
              style={{
                background: "#27272e",
                border: "1px solid #3a3a42",
                borderRadius: 6,
                color: "#f0f0f5",
                padding: "6px",
                marginTop: "4px"
              }}
            >
              <option value="">All</option>
              <option value="95">95+</option>
              <option value="90">90+</option>
              <option value="85">85+</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({})}
            style={{ background: "#f87171", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer", alignSelf: "flex-end" }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Sort Menu */}
      {showSortMenu && (
        <div style={{
          background: "#1f1f26",
          border: "1px solid #27272e",
          borderRadius: 8,
          padding: "12px",
          marginBottom: "1rem",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => applySortBy("name")}
            style={{ background: "#27272e", border: "none", borderRadius: 6, padding: "6px 12px", color: "#9ca3af", cursor: "pointer" }}
          >
            Name
          </button>
          <button
            onClick={() => applySortBy("completionRate")}
            style={{ background: "#27272e", border: "none", borderRadius: 6, padding: "6px 12px", color: "#9ca3af", cursor: "pointer" }}
          >
            Completion Rate
          </button>
          <button
            onClick={() => applySortBy("safetyScore")}
            style={{ background: "#27272e", border: "none", borderRadius: 6, padding: "6px 12px", color: "#9ca3af", cursor: "pointer" }}
          >
            Safety Score
          </button>
          <button
            onClick={() => applySortBy("complaints")}
            style={{ background: "#27272e", border: "none", borderRadius: 6, padding: "6px 12px", color: "#9ca3af", cursor: "pointer" }}
          >
            Complaints
          </button>
          <button
            onClick={() => setSortBy("")}
            style={{ background: "#f87171", border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", cursor: "pointer" }}
          >
            Clear Sort
          </button>
        </div>
      )}

      {/* Active Filters/Groups Display */}
      {Object.keys(filters).length > 0 && (
        <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "1rem" }}>
          Active filters: {Object.entries(filters).map(([k, v]) => (
            <span key={k} style={{ background: "#00e5a0", color: "#000", padding: "2px 8px", borderRadius: 4, marginLeft: "8px" }}>
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      {groupBy && (
        <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "1rem" }}>
          Grouped by: <span style={{ background: "#a78bfa", color: "#fff", padding: "2px 8px", borderRadius: 4, marginLeft: "8px" }}>{groupBy}</span>
        </div>
      )}

      {/* Grouped Data */}
      {groupedData && Object.entries(groupedData).map(([group, items]) => (
        <div key={group} style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#a78bfa", marginBottom: "1rem", fontSize: "14px" }}>{groupBy} - {group}</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1f1f26" }}>
                  {['Name', 'License#', 'Expiry', 'Completion Rate', 'Safety Score', 'Complaints', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((driver, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #1f1f26", transition: "background 0.1s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#1c1c22"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: '0.75rem' }}>{driver.name}</td>
                    <td style={{ padding: '0.75rem', fontFamily: "'DM Mono'" }}>{driver.license}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(driver.expiryDate).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem', color: "#00e5a0", fontWeight: "600" }}>{driver.completionRate}%</td>
                    <td style={{ padding: '0.75rem', background: driver.safetyScore >= 90 ? "rgba(0,229,160,0.1)" : driver.safetyScore >= 85 ? "rgba(251,146,60,0.1)" : "rgba(248,113,113,0.1)", color: driver.safetyScore >= 90 ? "#00e5a0" : driver.safetyScore >= 85 ? "#fb923c" : "#f87171", borderRadius: "4px" }}>{driver.safetyScore}%</td>
                    <td style={{ padding: '0.75rem', background: driver.complaints === 0 ? "rgba(0,229,160,0.1)" : driver.complaints <= 2 ? "rgba(251,146,60,0.1)" : "rgba(248,113,113,0.1)", color: driver.complaints === 0 ? "#00e5a0" : driver.complaints <= 2 ? "#fb923c" : "#f87171", borderRadius: "4px" }}>{driver.complaints}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Non-grouped Table */}
      {!groupedData && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1f1f26" }}>
                {['Name', 'License#', 'Expiry', 'Completion Rate', 'Safety Score', 'Complaints', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #1f1f26", transition: "background 0.1s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#1c1c22"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: '0.75rem' }}>{driver.name}</td>
                  <td style={{ padding: '0.75rem', fontFamily: "'DM Mono'" }}>{driver.license}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(driver.expiryDate).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem', color: "#00e5a0", fontWeight: "600" }}>{driver.completionRate}%</td>
                  <td style={{ padding: '0.75rem', background: driver.safetyScore >= 90 ? "rgba(0,229,160,0.1)" : driver.safetyScore >= 85 ? "rgba(251,146,60,0.1)" : "rgba(248,113,113,0.1)", color: driver.safetyScore >= 90 ? "#00e5a0" : driver.safetyScore >= 85 ? "#fb923c" : "#f87171", borderRadius: "4px" }}>{driver.safetyScore}%</td>
                  <td style={{ padding: '0.75rem', background: driver.complaints === 0 ? "rgba(0,229,160,0.1)" : driver.complaints <= 2 ? "rgba(251,146,60,0.1)" : "rgba(248,113,113,0.1)", color: driver.complaints === 0 ? "#00e5a0" : driver.complaints <= 2 ? "#fb923c" : "#f87171", borderRadius: "4px" }}>{driver.complaints}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drivers.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
          No drivers found.
        </div>
      )}
    </div>
  );
}
