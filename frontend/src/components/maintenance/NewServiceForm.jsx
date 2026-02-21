"use client";
import { useState } from "react";

// ── Field component ───────────────────────────────────────────────────────────
const Field = ({ label, id, type = "text", placeholder = "", value, onChange, required = false }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label htmlFor={id} style={styles.label}>{label}{required && ' *'}</label>
    <input
      type={type}
      id={id}
      name={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={styles.input}
      onFocus={(e) => {
        e.target.style.borderColor = "#00e5a0";
        e.target.style.boxShadow   = "0 0 0 3px rgba(0,229,160,0.08)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#27272e";
        e.target.style.boxShadow   = "none";
      }}
    />
  </div>
);

// ── NewServiceForm ────────────────────────────────────────────────────────────
export default function NewServiceForm({ closeModal, onAddService }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle: '',
    issue: '',
    date: '',
    cost: '',
    notes: '',
    status: 'New'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicle || !formData.issue || !formData.date || !formData.cost) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise((r) => setTimeout(r, 500));
      
      onAddService({
        vehicle: formData.vehicle,
        issue: formData.issue,
        date: formData.date,
        cost: formData.cost,
        status: formData.status,
        notes: formData.notes
      });
      
      setIsSubmitting(false);
      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // TODO: optionally warn if form has unsaved changes
    closeModal();
  };

  return (
    /* Backdrop */
    <div
      style={styles.backdrop}
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      {/* Modal card */}
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.iconWrap}>
              <svg width="16" height="16" fill="none" stroke="#00e5a0" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <h2 style={styles.title}>New Service Log</h2>
          </div>

          {/* Close */}
          <button
            onClick={handleCancel}
            style={styles.closeBtn}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#d1d5db")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            <Field 
              id="vehicle" 
              label="Vehicle Name" 
              placeholder="e.g. TATA 407 / MH-12-AB-1234"
              value={formData.vehicle}
              onChange={handleChange}
              required
            />
            <Field 
              id="issue" 
              label="Issue / Service" 
              placeholder="e.g. Engine Issue, Oil Change"
              value={formData.issue}
              onChange={handleChange}
              required
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field 
                id="date" 
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <Field 
                id="cost" 
                label="Estimated Cost"
                placeholder="e.g. ₹5,000"
                value={formData.cost}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="status" style={styles.label}>Status</label>
              <select 
                id="status" 
                name="status" 
                value={formData.status}
                onChange={handleChange}
                style={{...styles.input, colorScheme: 'dark'}}
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <Field 
              id="notes" 
              label="Notes (optional)" 
              placeholder="Any additional details…"
              value={formData.notes}
              onChange={handleChange}
            />          </div>
          <div style={styles.footer}>
            <button
              type="button"
              onClick={handleCancel}
              style={styles.cancelBtn}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3d3d4a"; e.currentTarget.style.color = "#d1d5db"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272e"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.6 : 1, pointerEvents: isSubmitting ? 'none' : 'auto' }}
            >
              {isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ animation: "spin 0.8s linear infinite" }} width="13" height="13" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating…
                </span>
              ) : "Create Service"}
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    background: "#18181c",
    border: "1px solid #27272e",
    borderRadius: 16,
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
    overflow: "hidden",
    fontFamily: "'Outfit', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #1f1f26",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "rgba(0,229,160,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f0f0f5",
    fontFamily: "'Outfit', sans-serif",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#111114",
    border: "1px solid #27272e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    cursor: "pointer",
    transition: "color 0.15s",
  },
  body: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#9ca3af",
    fontFamily: "'Outfit', sans-serif",
  },
  input: {
    width: "100%",
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: 8,
    padding: "0 12px",
    height: 40,
    fontSize: 13,
    color: "#e5e7eb",
    fontFamily: "'Outfit', sans-serif",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    colorScheme: "dark",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "16px 24px",
    borderTop: "1px solid #1f1f26",
  },
  cancelBtn: {
    padding: "0 18px",
    height: 38,
    borderRadius: 8,
    background: "transparent",
    border: "1px solid #27272e",
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  submitBtn: {
    padding: "0 20px",
    height: 38,
    borderRadius: 8,
    background: "#00e5a0",
    border: "none",
    color: "#0a0a0c",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
};