import React from 'react';

// Responsive SVG Bar Chart
export function BarChart({ data, xKey = 'label', yKey = 'value', height = 220, color = '#4f46e5' }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No data to display</div>;
  }

  const maxValue = Math.max(...data.map(d => d[yKey] || 0), 1);
  const chartHeight = height - 40;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * 80 + 40} ${height}`} style={{ minWidth: '100%' }}>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - chartHeight * ratio + 10;
          return (
            <g key={i}>
              <line x1="30" y1={y} x2={data.length * 80 + 30} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
              <text x="5" y={y + 4} fontSize="10" fill="#94a3b8">{Math.round(maxValue * ratio)}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const val = item[yKey] || 0;
          const barHeight = (val / maxValue) * chartHeight;
          const x = index * 80 + 45;
          const y = chartHeight - barHeight + 10;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width="36"
                height={barHeight}
                rx="6"
                fill={item.color || color}
                style={{ transition: 'all 0.3s ease' }}
              />
              <text
                x={x + 18}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#334155"
              >
                {val}
              </text>
              <text
                x={x + 18}
                y={chartHeight + 28}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#64748b"
              >
                {item[xKey]?.length > 10 ? item[xKey].slice(0, 9) + '…' : item[xKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Donut Progress / Distribution Chart
export function DonutChart({ percentage = 0, size = 160, strokeWidth = 16, color = '#4f46e5', label = 'Completion' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{clampedPct}%</span>
          <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

// Sparkline / Simple Line Chart
export function LineChart({ data, height = 180, color = '#10b981' }) {
  if (!data || data.length === 0) return null;

  const width = 360;
  const maxValue = Math.max(...data.map(d => d.value), 100);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 40) + 20;
    const y = height - (d.value / maxValue) * (height - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - 40) + 20;
        const y = height - (d.value / maxValue) * (height - 40) - 20;
        return (
          <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
        );
      })}
    </svg>
  );
}
