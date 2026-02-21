"use client";
import { useState, useEffect } from "react";
import { getVehicles, deleteVehicle, searchItems, filterItems, sortItems, groupItems } from "../../lib/storage";

const statusCfg = {
  "On Trip":     "bg-[#00e5a0]/10 text-[#00e5a0]",
  "Idle":        "bg-[#374151]/40 text-[#9ca3af]",
  "Maintenance": "bg-[#f59e0b]/10 text-[#f59e0b]",
};

const dotCfg = {
  "On Trip":     "bg-[#00e5a0]",
  "Idle":        "bg-[#6b7280]",
  "Maintenance": "bg-[#f59e0b]",
};

export default function VehicleTable({ search = "", filters = {}, sortBy = "", groupBy = "" }) {
  const [rows, setRows] = useState([]);

  // Load and update data whenever search, filters, or sort changes
  useEffect(() => {
    let data = getVehicles();

    // Apply search
    if (search) {
      data = searchItems(data, search, ["plate", "model", "type", "capacity"]);
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
      data = filterItems(data, filters);
    }

    // Apply sort
    if (sortBy) {
      data = sortItems(data, sortBy);
    }

    setRows(data);
  }, [search, filters, sortBy]);

  const handleDelete = (id) => {
    deleteVehicle(id);
    setRows(r => r.filter(v => v.id !== id));
  };

  const handleEdit = (id) => { /* TODO: open edit modal */ };

  return (
    <div className="bg-[#18181c] border border-[#1f1f26] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1f1f26]">
              {["No", "Plate", "Model", "Type", "Capacity", "Odometer", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((v, i) => (
              <tr
                key={v.id}
                className="border-b border-[#1a1a20] hover:bg-[#1c1c22] transition-colors cursor-pointer"
              >
                <td className="px-5 py-4 text-[13px] text-[#6b7280] font-semibold font-[DM_Mono]">{i + 1}</td>
                <td className="px-5 py-4 text-[13px] text-[#e5e7eb] font-[DM_Mono] font-medium">{v.plate}</td>
                <td className="px-5 py-4 text-[13px] text-[#d1d5db]">{v.model}</td>
                <td className="px-5 py-4 text-[13px] text-[#d1d5db]">{v.type}</td>
                <td className="px-5 py-4 text-[13px] text-[#d1d5db]">{v.capacity}</td>
                <td className="px-5 py-4 text-[13px] text-[#d1d5db] font-[DM_Mono]">
                  {v.odometer.toLocaleString()} km
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${statusCfg[v.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotCfg[v.status]}`} />
                    {v.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(v.id)}
                      className="text-[12px] text-[#6b7280] hover:text-[#00e5a0] transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-[12px] text-[#6b7280] hover:text-[#f87171] transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-16 text-[#4b5563] text-sm">
            No vehicles registered yet.
          </div>
        )}
      </div>
    </div>
  );
}