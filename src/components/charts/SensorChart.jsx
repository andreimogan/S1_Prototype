import { useId } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'

// Default pressure thresholds (PSI) - matching Figma design
const PRESSURE_THRESHOLDS = {
  normalZone: { y1: 59, y2: 64, fill: 'rgba(34, 197, 94, 0.25)' }, // Light green for dark theme
  warningHigh: 70,
  warningLow: 50,
  criticalHigh: 75,
  criticalLow: 45,
}

const CHART_HEIGHT = 180

export default function SensorChart({
  data,
  dataKey,
  chartTitle,
  unit,
  color = '#3b82f6',
  showAnomaly = false,
  anomalyTime,
  showPressureThresholds = false,
  showAreaFill = false,
  yAxisLabel,
  yAxisDomain,
  height = CHART_HEIGHT,
}) {
  const gradientId = useId().replace(/:/g, '-')
  const useThresholds = showPressureThresholds || chartTitle === 'Network Pressure'
  const useAreaFill = showAreaFill || useThresholds
  const domain = yAxisDomain ?? (useThresholds ? [35, 85] : undefined)
  const yTicks = useThresholds ? [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85] : undefined

  // Format time for X-axis - simple "H:00" or "H:MM" format
  const formatXAxis = (timeString) => {
    const date = new Date(timeString)
    const hour = date.getHours()
    const minute = date.getMinutes()
    return minute > 0 ? `${hour}:${minute.toString().padStart(2, '0')}` : `${hour}:00`
  }

  // Custom dot renderer to show anomaly points
  const renderDot = (props) => {
    const { cx, cy, payload } = props

    if (showAnomaly && payload?.isAnomaly) {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={5}
            fill="red"
            stroke="white"
            strokeWidth={2}
          />
        </g>
      )
    }

    return null
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'var(--sand-surface)',
            border: '1px solid var(--color-gray-700)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--color-gray-100)',
          }}
        >
          <p style={{ margin: 0, marginBottom: '4px', color: 'var(--color-gray-300)' }}>
            {formatXAxis(payload[0].payload.time)}
          </p>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              color: payload[0].payload.isAnomaly ? 'var(--color-red-400)' : color,
            }}
          >
            {payload[0].value?.toFixed(1)} {unit}
            {payload[0].payload.isAnomaly && ' (Anomaly)'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '150px',
        backgroundColor: 'var(--color-gray-800)',
        borderRadius: '6px',
        padding: '12px 8px',
      }}
    >
      {yAxisLabel && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-gray-300)',
            marginBottom: '4px',
          }}
        >
          {yAxisLabel}
          {unit && (
            <span style={{ marginLeft: '6px', color: 'var(--color-gray-400)', fontWeight: 400 }}>
              {unit}
            </span>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <defs>
            <linearGradient id={`chartAreaFill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--color-gray-600)"
            strokeDasharray="3 3"
            vertical={false}
          />
          {/* Threshold zones - render behind the data */}
          {useThresholds && (
            <>
              <ReferenceArea
                y1={PRESSURE_THRESHOLDS.normalZone.y1}
                y2={PRESSURE_THRESHOLDS.normalZone.y2}
                fill={PRESSURE_THRESHOLDS.normalZone.fill}
                stroke="none"
              />
              <ReferenceLine
                y={PRESSURE_THRESHOLDS.criticalHigh}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <ReferenceLine
                y={PRESSURE_THRESHOLDS.criticalLow}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <ReferenceLine
                y={PRESSURE_THRESHOLDS.warningHigh}
                stroke="#f97316"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <ReferenceLine
                y={PRESSURE_THRESHOLDS.warningLow}
                stroke="#f97316"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            </>
          )}
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--color-gray-400)' }}
            stroke="var(--color-gray-600)"
            tickFormatter={formatXAxis}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            domain={domain}
            ticks={yTicks}
            tick={{ fontSize: 10, fill: 'var(--color-gray-400)' }}
            stroke="var(--color-gray-600)"
            width={36}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={useAreaFill ? `url(#chartAreaFill-${gradientId})` : 'transparent'}
            dot={renderDot}
            activeDot={{ r: 4, fill: color, stroke: 'var(--color-gray-100)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
