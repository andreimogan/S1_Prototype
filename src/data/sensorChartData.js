// Sensor Chart Data - Time series data for pressure and flow rate monitoring
// Data covers 24 hours on May 6, 2026 with hourly readings

// Helper function to generate timestamp
function createTimestamp(hour) {
  return new Date(`2026-05-06T${hour.toString().padStart(2, '0')}:00:00Z`).getTime()
}

// Helper to generate normal variance data
function generateNormalData(baseValue, variance, hours = 24) {
  return Array.from({ length: hours }, (_, i) => ({
    time: `2026-05-06T${i.toString().padStart(2, '0')}:00:00Z`,
    value: baseValue + (Math.random() - 0.5) * variance,
    timestamp: createTimestamp(i)
  }))
}

// Critical sensor (PS-001) with anomaly at 09:30
const criticalPressureData = [
  { time: '2026-05-06T00:00:00Z', value: 350, timestamp: createTimestamp(0) },
  { time: '2026-05-06T01:00:00Z', value: 345, timestamp: createTimestamp(1) },
  { time: '2026-05-06T02:00:00Z', value: 352, timestamp: createTimestamp(2) },
  { time: '2026-05-06T03:00:00Z', value: 348, timestamp: createTimestamp(3) },
  { time: '2026-05-06T04:00:00Z', value: 355, timestamp: createTimestamp(4) },
  { time: '2026-05-06T05:00:00Z', value: 350, timestamp: createTimestamp(5) },
  { time: '2026-05-06T06:00:00Z', value: 358, timestamp: createTimestamp(6) },
  { time: '2026-05-06T07:00:00Z', value: 362, timestamp: createTimestamp(7) },
  { time: '2026-05-06T08:00:00Z', value: 355, timestamp: createTimestamp(8) },
  { time: '2026-05-06T09:00:00Z', value: 348, timestamp: createTimestamp(9) },
  // Anomaly at 09:30 - pressure drop
  { time: '2026-05-06T09:30:00Z', value: 180.5, timestamp: createTimestamp(9) + 1800000, isAnomaly: true },
  { time: '2026-05-06T10:00:00Z', value: 310, timestamp: createTimestamp(10) },
  { time: '2026-05-06T11:00:00Z', value: 325, timestamp: createTimestamp(11) },
  { time: '2026-05-06T12:00:00Z', value: 335, timestamp: createTimestamp(12) },
  { time: '2026-05-06T13:00:00Z', value: 340, timestamp: createTimestamp(13) },
  { time: '2026-05-06T14:00:00Z', value: 345, timestamp: createTimestamp(14) },
  { time: '2026-05-06T15:00:00Z', value: 350, timestamp: createTimestamp(15) },
  { time: '2026-05-06T16:00:00Z', value: 348, timestamp: createTimestamp(16) },
  { time: '2026-05-06T17:00:00Z', value: 352, timestamp: createTimestamp(17) },
  { time: '2026-05-06T18:00:00Z', value: 355, timestamp: createTimestamp(18) },
  { time: '2026-05-06T19:00:00Z', value: 358, timestamp: createTimestamp(19) },
  { time: '2026-05-06T20:00:00Z', value: 360, timestamp: createTimestamp(20) },
  { time: '2026-05-06T21:00:00Z', value: 355, timestamp: createTimestamp(21) },
  { time: '2026-05-06T22:00:00Z', value: 350, timestamp: createTimestamp(22) },
  { time: '2026-05-06T23:00:00Z', value: 348, timestamp: createTimestamp(23) },
]

const criticalFlowData = [
  { time: '2026-05-06T00:00:00Z', value: 350, timestamp: createTimestamp(0) },
  { time: '2026-05-06T01:00:00Z', value: 360, timestamp: createTimestamp(1) },
  { time: '2026-05-06T02:00:00Z', value: 355, timestamp: createTimestamp(2) },
  { time: '2026-05-06T03:00:00Z', value: 345, timestamp: createTimestamp(3) },
  { time: '2026-05-06T04:00:00Z', value: 365, timestamp: createTimestamp(4) },
  { time: '2026-05-06T05:00:00Z', value: 370, timestamp: createTimestamp(5) },
  { time: '2026-05-06T06:00:00Z', value: 385, timestamp: createTimestamp(6) },
  { time: '2026-05-06T07:00:00Z', value: 395, timestamp: createTimestamp(7) },
  { time: '2026-05-06T08:00:00Z', value: 380, timestamp: createTimestamp(8) },
  { time: '2026-05-06T09:00:00Z', value: 375, timestamp: createTimestamp(9) },
  // Anomaly at 09:30 - flow spike
  { time: '2026-05-06T09:30:00Z', value: 950.8, timestamp: createTimestamp(9) + 1800000, isAnomaly: true },
  { time: '2026-05-06T10:00:00Z', value: 520, timestamp: createTimestamp(10) },
  { time: '2026-05-06T11:00:00Z', value: 450, timestamp: createTimestamp(11) },
  { time: '2026-05-06T12:00:00Z', value: 420, timestamp: createTimestamp(12) },
  { time: '2026-05-06T13:00:00Z', value: 400, timestamp: createTimestamp(13) },
  { time: '2026-05-06T14:00:00Z', value: 390, timestamp: createTimestamp(14) },
  { time: '2026-05-06T15:00:00Z', value: 385, timestamp: createTimestamp(15) },
  { time: '2026-05-06T16:00:00Z', value: 380, timestamp: createTimestamp(16) },
  { time: '2026-05-06T17:00:00Z', value: 375, timestamp: createTimestamp(17) },
  { time: '2026-05-06T18:00:00Z', value: 370, timestamp: createTimestamp(18) },
  { time: '2026-05-06T19:00:00Z', value: 365, timestamp: createTimestamp(19) },
  { time: '2026-05-06T20:00:00Z', value: 360, timestamp: createTimestamp(20) },
  { time: '2026-05-06T21:00:00Z', value: 355, timestamp: createTimestamp(21) },
  { time: '2026-05-06T22:00:00Z', value: 350, timestamp: createTimestamp(22) },
  { time: '2026-05-06T23:00:00Z', value: 345, timestamp: createTimestamp(23) },
]

export const SENSOR_CHART_DATA = {
  // Critical sensor with anomaly
  'PS-001': {
    pressure: criticalPressureData,
    flow: criticalFlowData
  },
  
  // Warning sensor - slightly elevated readings
  'PS-002': {
    pressure: generateNormalData(60, 8),
    flow: generateNormalData(420, 60)
  },
  
  // Normal sensors with stable readings
  'PS-003': {
    pressure: generateNormalData(58, 6),
    flow: generateNormalData(380, 50)
  },
  
  'PS-004': {
    pressure: generateNormalData(60, 5),
    flow: generateNormalData(400, 45)
  },
  
  'PS-005': {
    pressure: generateNormalData(62, 6),
    flow: generateNormalData(390, 50)
  },
  
  'PS-006': {
    pressure: generateNormalData(62, 5),
    flow: generateNormalData(395, 48)
  },
  
  'PS-007': {
    pressure: generateNormalData(64, 7),
    flow: generateNormalData(410, 55)
  },
  
  'PS-008': {
    pressure: generateNormalData(64, 6),
    flow: generateNormalData(405, 52)
  },
  
  'PS-009': {
    pressure: generateNormalData(60, 5),
    flow: generateNormalData(385, 48)
  },
  
  'PS-010': {
    pressure: generateNormalData(61, 6),
    flow: generateNormalData(398, 50)
  },
  
  'PS-011': {
    pressure: generateNormalData(59, 5),
    flow: generateNormalData(375, 45)
  },
  
  'PS-012': {
    pressure: generateNormalData(63, 6),
    flow: generateNormalData(408, 52)
  }
}
