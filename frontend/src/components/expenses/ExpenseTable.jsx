const expenseData = [
    { tripId: 321, driver: 'John', distance: '1000 km', fuelExpense: '19k', miscExpense: '3k', status: 'Done' },
    // Add more data as needed
];

const statusStyle = {
    'Done': { background: "rgba(16, 185, 129, 0.1)", color: "#10B981" },
    'Pending': { background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" },
};

const StatusBadge = ({ status }) => {
    const s = statusStyle[status] ?? { background: "rgba(107, 114, 128, 0.1)", color: "#6B7280" };
    return (
        <span style={{ ...s, padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
            {status}
        </span>
    );
};

export default function ExpenseTable() {
    return (
        <div style={{ background: "#18181c", border: "1px solid #1f1f26", borderRadius: 14, color: 'white', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <input type="text" placeholder="Search bar....." style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: 8, color: "#f0f0f5", padding: "8px 12px" }} />
                <div>
                    <button style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: 8, color: "#f0f0f5", padding: "8px 12px", marginLeft: '0.5rem' }}>Group by</button>
                    <button style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: 8, color: "#f0f0f5", padding: "8px 12px", marginLeft: '0.5rem' }}>Filter</button>
                    <button style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: 8, color: "#f0f0f5", padding: "8px 12px", marginLeft: '0.5rem' }}>Sort by...</button>
                </div>
            </div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: "1px solid #1f1f26" }}>
                        {['Trip ID', 'Driver', 'Distance', 'Fuel Expense', 'Misc. Expen', 'Status'].map(h => <th key={h} style={{ padding: '0.5rem' }}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {expenseData.map(item => (
                        <tr key={item.tripId} style={{ borderBottom: "1px solid #1f1f26" }}>
                            <td style={{ padding: '0.5rem' }}>{item.tripId}</td>
                            <td style={{ padding: '0.5rem' }}>{item.driver}</td>
                            <td style={{ padding: '0.5rem' }}>{item.distance}</td>
                            <td style={{ padding: '0.5rem' }}>{item.fuelExpense}</td>
                            <td style={{ padding: '0.5rem' }}>{item.miscExpense}</td>
                            <td style={{ padding: '0.5rem' }}><StatusBadge status={item.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
