import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import SensorChart from '../charts/SensorChart'
import { SENSOR_CHART_DATA } from '../../data/sensorChartData'

// Helper function to generate fallback pressure data based on current readings
function generateFallbackPressureData(currentPressure, status) {
  const hours = 24
  const baseValue = currentPressure
  const variance = status === 'critical' ? 12 : status === 'warning' ? 8 : 5
  
  return Array.from({ length: hours }, (_, i) => {
    let value = baseValue + (Math.random() - 0.5) * variance
    
    // Add anomaly for critical sensors around hour 9
    if (status === 'critical' && i === 9) {
      value = baseValue * 0.6 // Sharp drop
      return {
        time: `2026-05-06T09:30:00Z`,
        value,
        timestamp: new Date(`2026-05-06T09:30:00Z`).getTime(),
        isAnomaly: true
      }
    }
    
    return {
      time: `2026-05-06T${i.toString().padStart(2, '0')}:00:00Z`,
      value,
      timestamp: new Date(`2026-05-06T${i.toString().padStart(2, '0')}:00:00Z`).getTime()
    }
  })
}

export default function PressureSensorTooltip({ feature, position, onClose }) {
  const [activeTab, setActiveTab] = useState('measurements')
  
  if (!feature) return null

  const p = feature.properties || {}
  const sensorId = p.sensorId || feature.id || '—'
  const status = p.status || 'normal'
  const pressure = p.pressure ?? 0
  const lastReading = p.lastReading || ''
  const statusColor = status === 'critical' ? '#EE8080' : status === 'warning' ? '#F5B87A' : '#7BA3F5'

  const lastUpdatedFormatted = lastReading
    ? new Date(lastReading).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—'

  // Get chart data (use sensor data if available, otherwise generate fallback)
  const chartData = SENSOR_CHART_DATA[sensorId]?.pressure || generateFallbackPressureData(pressure, status)

  return (
    <div
      className="pressure-sensor-tooltip-container"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 100,
      }}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      <div className="pressure-sensor-tooltip-inner">
        {/* Header */}
        <div className="pressure-sensor-tooltip-header">
          <div className="pressure-sensor-tooltip-header-row">
            <span className="pressure-sensor-tooltip-title">Pressure Sensor</span>
          </div>
          <div className="pressure-sensor-tooltip-id-row">
            <span className="pressure-sensor-tooltip-id">{sensorId}</span>
            <div className="pressure-sensor-tooltip-meta">
              <span className="pressure-sensor-tooltip-label">Last Updated</span>
              <span className="pressure-sensor-tooltip-value">{lastUpdatedFormatted}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pressure-sensor-tooltip-tabs">
          <button
            className={`pressure-sensor-tooltip-tab ${activeTab === 'measurements' ? 'active' : ''}`}
            onClick={() => setActiveTab('measurements')}
          >
            Measurements
          </button>
          <button
            className={`pressure-sensor-tooltip-tab ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            Monitor Info
          </button>
          <button
            className={`pressure-sensor-tooltip-tab ${activeTab === 'pois' ? 'active' : ''}`}
            onClick={() => setActiveTab('pois')}
          >
            Related POIs
          </button>
        </div>

        {/* Content */}
        <div className="pressure-sensor-tooltip-content">
          {activeTab === 'measurements' && (
            <div className="pressure-sensor-tooltip-chart">
              <div className="pressure-sensor-tooltip-chart-header">
                <span className="pressure-sensor-tooltip-chart-label">Network Pressure</span>
                <span className="pressure-sensor-tooltip-chart-unit">PSI</span>
              </div>
              <div className="pressure-sensor-chart-wrapper">
                <SensorChart
                  data={chartData}
                  dataKey="value"
                  chartTitle="Pressure"
                  unit="PSI"
                  color="#3b82f6"
                  showAnomaly={status === 'critical'}
                  anomalyTime={lastReading}
                />
              </div>
            </div>
          )}
          {activeTab === 'monitor' && (
            <div className="pressure-sensor-tooltip-info">
              <div className="pressure-sensor-tooltip-info-row">
                <span>Status</span>
                <span style={{ color: statusColor, textTransform: 'capitalize' }}>{status}</span>
              </div>
              <div className="pressure-sensor-tooltip-info-row">
                <span>Current Pressure</span>
                <span>{pressure} PSI</span>
              </div>
              <div className="pressure-sensor-tooltip-info-row">
                <span>Location</span>
                <span>{p.location || '—'}</span>
              </div>
            </div>
          )}
          {activeTab === 'pois' && (
            <div className="pressure-sensor-tooltip-info">
              <p style={{ fontSize: '11px', color: 'var(--color-gray-400)', margin: 0 }}>
                No related points of interest.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
