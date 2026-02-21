"use client";

import { useState, useMemo } from 'react';

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

export default function ExpenseTable({ expenses = [], onAddExpense }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('tripId');
    const [filterStatus, setFilterStatus] = useState('All');
    const [groupBy, setGroupBy] = useState('none');
    const [showGroupMenu, setShowGroupMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        return expenses.filter(item => {
            const matchesSearch = 
                item.tripId.toString().includes(searchQuery.toLowerCase()) ||
                item.driver.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            
            return matchesSearch && matchesStatus;
        });
    }, [expenses, searchQuery, filterStatus]);

    // Sort expenses
    const sortedExpenses = useMemo(() => {
        const sorted = [...filteredExpenses];
        
        switch(sortBy) {
            case 'tripId':
                sorted.sort((a, b) => a.tripId - b.tripId);
                break;
            case 'tripIdDesc':
                sorted.sort((a, b) => b.tripId - a.tripId);
                break;
            case 'driver':
                sorted.sort((a, b) => a.driver.localeCompare(b.driver));
                break;
            case 'fuelExpense':
                sorted.sort((a, b) => {
                    const aVal = parseInt(a.fuelExpense);
                    const bVal = parseInt(b.fuelExpense);
                    return bVal - aVal;
                });
                break;
            case 'status':
                sorted.sort((a, b) => a.status.localeCompare(b.status));
                break;
            default:
                break;
        }
        
        return sorted;
    }, [filteredExpenses, sortBy]);

    // Group expenses
    const groupedExpenses = useMemo(() => {
        if (groupBy === 'none') {
            return { ungrouped: sortedExpenses };
        }

        const grouped = {};
        
        sortedExpenses.forEach(item => {
            let key;
            
            if (groupBy === 'driver') {
                key = item.driver;
            } else if (groupBy === 'status') {
                key = item.status;
            } else {
                key = item.distance;
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        
        return grouped;
    }, [sortedExpenses, groupBy]);

    const buttonStyle = { 
        background: "#2a2a30", 
        border: "1px solid #3a3a42", 
        borderRadius: 8, 
        color: "#f0f0f5", 
        padding: "8px 12px", 
        marginLeft: '0.5rem',
        cursor: 'pointer',
        position: 'relative'
    };

    return (
        <div style={{ background: "#18181c", border: "1px solid #1f1f26", borderRadius: 14, color: 'white', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="Search by Trip ID or Driver..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: 8, color: "#f0f0f5", padding: "8px 12px", flex: 1, minWidth: '200px' }} 
                />
                <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setShowGroupMenu(!showGroupMenu)}
                            style={buttonStyle}
                        >
                            Group by
                        </button>
                        {showGroupMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: "#2a2a30",
                                border: "1px solid #3a3a42",
                                borderRadius: 8,
                                marginTop: '0.5rem',
                                zIndex: 10,
                                minWidth: '150px'
                            }}>
                                {['none', 'driver', 'status', 'distance'].map(option => (
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
                                            background: groupBy === option ? '#3a3a42' : 'transparent',
                                            border: 'none',
                                            color: '#f0f0f5',
                                            cursor: 'pointer',
                                            borderRadius: option === 'none' ? '8px 8px 0 0' : (option === 'distance' ? '0 0 8px 8px' : '0'),
                                        }}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            style={buttonStyle}
                        >
                            Filter
                        </button>
                        {showFilterMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: "#2a2a30",
                                border: "1px solid #3a3a42",
                                borderRadius: 8,
                                marginTop: '0.5rem',
                                zIndex: 10,
                                minWidth: '150px'
                            }}>
                                {['All', 'Done', 'Pending'].map(option => (
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
                                            background: filterStatus === option ? '#3a3a42' : 'transparent',
                                            border: 'none',
                                            color: '#f0f0f5',
                                            cursor: 'pointer',
                                            borderRadius: option === 'All' ? '8px 8px 0 0' : (option === 'Pending' ? '0 0 8px 8px' : '0'),
                                        }}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            style={buttonStyle}
                        >
                            Sort by
                        </button>
                        {showSortMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                background: "#2a2a30",
                                border: "1px solid #3a3a42",
                                borderRadius: 8,
                                marginTop: '0.5rem',
                                zIndex: 10,
                                minWidth: '180px'
                            }}>
                                {[
                                    { value: 'tripId', label: 'Trip ID (Asc)' },
                                    { value: 'tripIdDesc', label: 'Trip ID (Desc)' },
                                    { value: 'driver', label: 'Driver Name' },
                                    { value: 'fuelExpense', label: 'Fuel Expense (High)' },
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
                                            background: sortBy === option.value ? '#3a3a42' : 'transparent',
                                            border: 'none',
                                            color: '#f0f0f5',
                                            cursor: 'pointer',
                                            borderRadius: option.value === 'tripId' ? '8px 8px 0 0' : (option.value === 'status' ? '0 0 8px 8px' : '0'),
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

            {sortedExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No expenses found
                </div>
            ) : (
                <>
                    {Object.entries(groupedExpenses).map(([groupKey, items]) => (
                        <div key={groupKey}>
                            {groupBy !== 'none' && (
                                <div style={{ 
                                    background: "#1f1f26", 
                                    padding: '0.75rem 1rem', 
                                    marginTop: '1rem', 
                                    marginBottom: '0.5rem',
                                    borderRadius: 8,
                                    fontWeight: 'bold',
                                    borderLeft: '3px solid #3b82f6'
                                }}>
                                    {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}: {groupKey}
                                </div>
                            )}
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                {groupBy === 'none' && (
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #1f1f26" }}>
                                            {['Trip ID', 'Driver', 'Distance', 'Fuel Expense', 'Misc. Expen', 'Status'].map(h => <th key={h} style={{ padding: '0.75rem' }}>{h}</th>)}
                                        </tr>
                                    </thead>
                                )}
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.tripId} style={{ borderBottom: "1px solid #1f1f26" }}>
                                            <td style={{ padding: '0.75rem' }}>{item.tripId}</td>
                                            <td style={{ padding: '0.75rem' }}>{item.driver}</td>
                                            <td style={{ padding: '0.75rem' }}>{item.distance}</td>
                                            <td style={{ padding: '0.75rem' }}>{item.fuelExpense}</td>
                                            <td style={{ padding: '0.75rem' }}>{item.miscExpense}</td>
                                            <td style={{ padding: '0.75rem' }}><StatusBadge status={item.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}
