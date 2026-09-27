import React from 'react';

export function MetricCard({ title, value, subtext, icon: Icon, color = '#4f46e5', bgLight = '#eef2ff' }) {
  return (
    <div className="metric-card">
      <div className="metric-info">
        <h5>{title}</h5>
        <div className="value">{value}</div>
        {subtext && <div className="subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className="icon-wrapper" style={{ backgroundColor: bgLight, color: color }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}

export default MetricCard;
