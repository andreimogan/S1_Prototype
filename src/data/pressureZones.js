// Test Pressure Zone - Simple Synthetic Polygon
// Coordinates are in [longitude, latitude] format

export const PRESSURE_ZONES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'zone-high-risk',
      properties: {
        zoneId: 'zone-5',
        name: 'Pump Station Alpha',
        riskLevel: 'high',
        affectedPipes: 45,
        averagePSI: 22,
        status: 'critical',
        description: 'Major Water Main Burst affecting downtown core infrastructure',
        redPipePercent: 7.67,
        complaints: 67,
        // Additional metrics for detailed dialog
        totalConnections: 1263,
        criticalCustomers: 23,
        pressureMonitors: 11,
        pressureGroups: 2,
        burstPOIs: 9,
        totalPipeMiles: 753,
        householdPercent: 75,
        nonHouseholdPercent: 25
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-90.217, 38.642],  // Northwest corner
          [-90.181, 38.642],  // Northeast corner
          [-90.181, 38.612],  // Southeast corner
          [-90.217, 38.612],  // Southwest corner
          [-90.217, 38.642]   // Close polygon
        ]]
      }
    }
  ]
}
