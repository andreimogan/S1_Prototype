// Burst Events Data for St. Louis Downtown Area
// These represent detected burst events on the water network

export const BURST_EVENTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'burst-001',
      properties: {
        burstId: 'BE-001',
        name: 'Major Water Main Burst - Downtown District',
        timestamp: '2023-08-27T10:00:00Z',
        severity: 'critical',
        location: 'Downtown District',
        affectedPipes: 156,
        criticalPipes: 45,
        severePipes: 111,
        customersAffected: 1404
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1985, 38.6275] // Near critical sensor PS-001
      }
    }
  ]
}
