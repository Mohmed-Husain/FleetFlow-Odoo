const performanceData = [
    { name: 'John', license: '23223', expiry: '22/36', completionRate: '92%', safetyScore: '89%', complaints: 4 },
    { name: 'John', license: '23223', expiry: '22/36', completionRate: '92%', safetyScore: '89%', complaints: 4 },
    { name: 'John', license: '23223', expiry: '22/36', completionRate: '92%', safetyScore: '89%', complaints: 4 },
    // Add more data as needed
];

export default function PerformanceTable() {
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
                        {['Name', 'License#', 'Expiry', 'Completion Rate', 'Saftey Score', 'Complaints'].map(h => <th key={h} style={{ padding: '0.5rem' }}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {performanceData.map((item, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #1f1f26" }}>
                            <td style={{ padding: '0.5rem' }}>{item.name}</td>
                            <td style={{ padding: '0.5rem' }}>{item.license}</td>
                            <td style={{ padding: '0.5rem' }}>{item.expiry}</td>
                            <td style={{ padding: '0.5rem' }}>{item.completionRate}</td>
                            <td style={{ padding: '0.5rem' }}>{item.safetyScore}</td>
                            <td style={{ padding: '0.5rem' }}>{item.complaints}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
