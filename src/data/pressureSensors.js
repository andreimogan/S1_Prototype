// Network Meters Data for St. Louis Downtown Area
// Positioned at road intersections for realistic placement
// Coordinates are in [longitude, latitude] format

export const PRESSURE_SENSORS = {
  type: 'FeatureCollection',
  features: [
    // SENSORS INSIDE PRESSURE ZONE ([-90.205, 38.632] to [-90.193, 38.622])
    
    // Critical sensor - detected the burst
    {
      type: 'Feature',
      id: 'sensor-001',
      properties: {
        sensorId: 'PS-001',
        name: 'Sensor PS-001',
        status: 'critical',
        pressure: 18.5,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Market St & N 18th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.199, 38.628]
      }
    },
    
    // Warning sensor - elevated anomaly
    {
      type: 'Feature',
      id: 'sensor-002',
      properties: {
        sensorId: 'PS-002',
        name: 'Sensor PS-002',
        status: 'warning',
        pressure: 38.2,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Locust St & N 17th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.201, 38.630]
      }
    },
    
    // Normal sensor inside zone
    {
      type: 'Feature',
      id: 'sensor-003',
      properties: {
        sensorId: 'PS-003',
        name: 'Sensor PS-003',
        status: 'normal',
        pressure: 58.4,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Washington Ave & N 16th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.203, 38.631]
      }
    },
    
    // Normal sensor inside zone
    {
      type: 'Feature',
      id: 'sensor-004',
      properties: {
        sensorId: 'PS-004',
        name: 'Sensor PS-004',
        status: 'normal',
        pressure: 60.1,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Chestnut St & N 19th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.197, 38.625]
      }
    },
    
    // SENSORS OUTSIDE PRESSURE ZONE
    
    {
      type: 'Feature',
      id: 'sensor-005',
      properties: {
        sensorId: 'PS-005',
        name: 'Sensor PS-005',
        status: 'normal',
        pressure: 62.3,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Market St & N 14th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.208, 38.629]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-006',
      properties: {
        sensorId: 'PS-006',
        name: 'Sensor PS-006',
        status: 'normal',
        pressure: 61.8,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Washington Ave & N 12th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.210, 38.631]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-007',
      properties: {
        sensorId: 'PS-007',
        name: 'Sensor PS-007',
        status: 'normal',
        pressure: 63.5,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Locust St & N 22nd St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.190, 38.630]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-008',
      properties: {
        sensorId: 'PS-008',
        name: 'Sensor PS-008',
        status: 'normal',
        pressure: 64.2,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Market St & N 21st St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.192, 38.628]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-009',
      properties: {
        sensorId: 'PS-009',
        name: 'Sensor PS-009',
        status: 'normal',
        pressure: 59.7,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Olive St & N 15th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.205, 38.636]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-010',
      properties: {
        sensorId: 'PS-010',
        name: 'Sensor PS-010',
        status: 'normal',
        pressure: 61.4,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Pine St & N 20th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.195, 38.635]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-011',
      properties: {
        sensorId: 'PS-011',
        name: 'Sensor PS-011',
        status: 'normal',
        pressure: 58.9,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Walnut St & N 13th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.207, 38.620]
      }
    },
    
    {
      type: 'Feature',
      id: 'sensor-012',
      properties: {
        sensorId: 'PS-012',
        name: 'Sensor PS-012',
        status: 'normal',
        pressure: 62.7,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Clark Ave & N 18th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.199, 38.618]
      }
    }
  ]
}
