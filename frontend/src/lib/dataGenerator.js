// Data Generator Utility
// Generates realistic prototype data for presentation purposes

export const generateRealisticMetrics = () => {
  return {
    totalTripsThisMonth: 25 + Math.floor(Math.random() * 15),
    avgRevenuePerTrip: 45000 + Math.floor(Math.random() * 35000),
    totalFuelCost: 180000 + Math.floor(Math.random() * 120000),
    maintenanceCost: 150000 + Math.floor(Math.random() * 100000),
    operationalCost: 50000,
    averageFuelEfficiency: 9.5 + Math.random() * 2.5,
    fleetUtilization: 65 + Math.floor(Math.random() * 25),
    safetyIncidents: Math.floor(Math.random() * 3),
  };
};

export const generateMonthlyFinancials = (monthCount = 6) => {
  const months = [];
  const now = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    const baseMetrics = generateRealisticMetrics();
    const revenue = baseMetrics.totalTripsThisMonth * baseMetrics.avgRevenuePerTrip;
    const totalCosts = baseMetrics.totalFuelCost + baseMetrics.maintenanceCost + baseMetrics.operationalCost;
    const profit = revenue - totalCosts;
    
    months.push({
      month: `${monthName} '${year.toString().slice(-2)}`,
      revenue: formatCurrency(revenue),
      fuelCost: formatCurrency(baseMetrics.totalFuelCost),
      maintenance: formatCurrency(baseMetrics.maintenanceCost),
      netProfit: formatCurrency(Math.max(0, profit)),
      profitMargin: Math.round((profit / revenue) * 100)
    });
  }
  
  return months;
};

export const generateEfficiencyTrend = (monthCount = 12) => {
  const months = [];
  const now = new Date();
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    const baseValue = 10;
    const trend = (monthCount - i) * 0.08; // Slight upward trend
    const seasonal = Math.sin(((monthCount - i - 3) / 12) * Math.PI * 2) * 1.2;
    const variance = (Math.random() - 0.5) * 1.5;
    
    const value = Math.round((baseValue + trend + seasonal + variance) * 10) / 10;
    
    months.push({
      name: monthName,
      value: Math.max(7, Math.min(14, value))
    });
  }
  
  return months;
};

export const generateCostAnalysis = (vehicleCount = 6) => {
  const vehicles = [];
  const vehicleTypes = ['Heavy', 'Medium', 'Mini'];
  const baseNames = ['MH', 'GJ', 'DL', 'KA', 'RJ', 'TN'];
  
  for (let i = 0; i < vehicleCount; i++) {
    const type = vehicleTypes[i % vehicleTypes.length];
    const baseCost = type === 'Heavy' ? 50000 : type === 'Medium' ? 32000 : 20000;
    const variance = Math.random() * 0.3; // +/- 30%
    
    vehicles.push({
      name: `${baseNames[i % baseNames.length]}-${String(i+1).padStart(2, '0')}`,
      cost: Math.round(baseCost * (1 + variance) / 10000),
      type: type,
      utilization: 60 + Math.floor(Math.random() * 35)
    });
  }
  
  return vehicles.sort((a, b) => b.cost - a.cost).slice(0, 5);
};

export const generateKPIs = () => {
  const metrics = generateRealisticMetrics();
  const monthlyRevenue = metrics.totalTripsThisMonth * metrics.avgRevenuePerTrip;
  
  return [
    {
      label: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      color: "#00e5a0",
      trend: "+" + (Math.random() > 0.5 ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * -10)) + "%"
    },
    {
      label: "Fleet ROI",
      value: "+" + (15 + Math.floor(Math.random() * 10)) + "%",
      color: "#a78bfa",
      trend: "vs last month"
    },
    {
      label: "Utilization Rate",
      value: metrics.fleetUtilization + "%",
      color: "#f59e0b",
      trend: metrics.fleetUtilization > 75 ? "Excellent" : "Good"
    },
  ];
};

export const formatCurrency = (amount) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${Math.round(amount / 1000)}K`;
};

export const generateLiveStats = () => {
  return {
    activeTrips: 3 + Math.floor(Math.random() * 5),
    vehiclesOnRoad: 4 + Math.floor(Math.random() * 4),
    avgSpeed: 55 + Math.floor(Math.random() * 15),
    totalDistance: Math.floor(Math.random() * 5000) + 2000,
    fuelConsumed: Math.floor(Math.random() * 800) + 200,
    safetyScore: 85 + Math.floor(Math.random() * 15),
    timestamp: new Date()
  };
};
