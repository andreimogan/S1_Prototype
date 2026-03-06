// Pressure Sensors Data for St. Louis Downtown Area
// Distinct from Network Meters - different map UI (gauge style)
// Coordinates are in [longitude, latitude] format

export const PRESSURE_SENSOR_MAP_DATA = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'pressure-sensor-001',
      properties: {
        sensorId: 'P-G-001',
        name: 'Pressure Sensor P-G-001',
        status: 'critical',
        pressure: 22.5,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Market St & N 17th St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2005, 38.627],
      },
    },
    {
      type: 'Feature',
      id: 'pressure-sensor-002',
      properties: {
        sensorId: 'P-G-002',
        name: 'Pressure Sensor P-G-002',
        status: 'warning',
        pressure: 42.1,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Locust St & N 18th St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.198, 38.629],
      },
    },
    {
      type: 'Feature',
      id: 'pressure-sensor-003',
      properties: {
        sensorId: 'P-G-003',
        name: 'Pressure Sensor P-G-003',
        status: 'normal',
        pressure: 61.2,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Washington Ave & N 15th St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.204, 38.633],
      },
    },
    {
      type: 'Feature',
      id: 'pressure-sensor-004',
      properties: {
        sensorId: 'P-G-004',
        name: 'Pressure Sensor P-G-004',
        status: 'normal',
        pressure: 58.8,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Chestnut St & N 20th St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.194, 38.624],
      },
    },
    {
      type: 'Feature',
      id: 'pressure-sensor-005',
      properties: {
        sensorId: 'P-G-005',
        name: 'Pressure Sensor P-G-005',
        status: 'normal',
        pressure: 64.0,
        lastReading: '2026-02-16T13:45:00Z',
        location: 'Olive St & N 14th St',
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.209, 38.627],
      },
    },
  ],
}
