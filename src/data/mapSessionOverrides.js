/**
 * In-memory map placement overrides only (no localStorage).
 * Resets on full page reload. Deployed builds always start from file-backed defaults
 * until the user edits in the current session.
 */
import { BURST_EVENTS } from './burstEvents'
import { PRESSURE_SENSORS } from './pressureSensors'
import { PRESSURE_SENSOR_MAP_DATA } from './pressureSensorData'
import { PRESSURE_ZONES } from './pressureZones'

const networkMeterPositions = {}
const pressureGaugePositions = {}
const burstPositions = {}

/** @type {number[][][]|null} Polygon geometry.coordinates (rings), or null = use PRESSURE_ZONES file */
let pressureZonePolygonCoords = null

export function setNetworkMeterPosition(sensorId, coordinates) {
  networkMeterPositions[sensorId] = {
    coordinates,
    timestamp: new Date().toISOString(),
  }
}

export function setPressureGaugePosition(sensorId, coordinates) {
  pressureGaugePositions[sensorId] = {
    coordinates,
    timestamp: new Date().toISOString(),
  }
}

export function setBurstPosition(burstId, coordinates) {
  burstPositions[burstId] = coordinates
}

/** @param {number[][][]|null} coords Polygon `geometry.coordinates` or null to clear override */
export function setPressureZonePolygonCoords(coords) {
  pressureZonePolygonCoords = coords
}

export function getMergedSensorData() {
  return {
    ...PRESSURE_SENSORS,
    features: PRESSURE_SENSORS.features.map((feature) => {
      const saved = networkMeterPositions[feature.id]
      if (!saved) return feature
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: saved.coordinates,
        },
      }
    }),
  }
}

export function getMergedPressureSensorMapData() {
  return {
    ...PRESSURE_SENSOR_MAP_DATA,
    features: PRESSURE_SENSOR_MAP_DATA.features.map((feature) => {
      const saved = pressureGaugePositions[feature.id]
      if (!saved) return feature
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: saved.coordinates,
        },
      }
    }),
  }
}

export function getMergedBurstData() {
  return {
    ...BURST_EVENTS,
    features: BURST_EVENTS.features.map((feature) => {
      const coords = burstPositions[feature.id]
      if (!coords) return feature
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: coords,
        },
      }
    }),
  }
}

export function getMergedPressureZoneData() {
  if (!pressureZonePolygonCoords) return PRESSURE_ZONES
  return {
    ...PRESSURE_ZONES,
    features: PRESSURE_ZONES.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: pressureZonePolygonCoords,
      },
    })),
  }
}
