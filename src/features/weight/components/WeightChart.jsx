import './WeightChart.css';

export default function WeightChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="weight-chart-placeholder">
        <span className="weight-chart-placeholder-text">
          Registra al menos 2 pesos para ver la gráfica
        </span>
      </div>
    );
  }

  const padding = { top: 20, right: 16, bottom: 32, left: 44 };
  const width = 360;
  const height = 180;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const weights = data.map((d) => Number(d.weight));
  const minW = Math.min(...weights) * 0.95;
  const maxW = Math.max(...weights) * 1.05;
  const rangeW = maxW - minW || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((Number(d.weight) - minW) / rangeW) * chartH,
    weight: d.weight,
    date: d.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Gradient area
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis labels (3 labels)
  const yLabels = [minW, (minW + maxW) / 2, maxW].map((val) => ({
    val: val.toFixed(1),
    y: padding.top + chartH - ((val - minW) / rangeW) * chartH,
  }));

  // X-axis labels (first and last)
  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="weight-chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="weight-chart-svg">
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke="var(--separator)"
            strokeWidth="0.5"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#weightGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2" />
        ))}

        {/* Y labels */}
        {yLabels.map((label, i) => (
          <text key={i} x={padding.left - 6} y={label.y + 4} textAnchor="end" className="weight-chart-label">
            {label.val}
          </text>
        ))}

        {/* X labels */}
        <text x={points[0].x} y={height - 8} textAnchor="start" className="weight-chart-label">
          {formatShortDate(data[0].date)}
        </text>
        <text x={points[points.length - 1].x} y={height - 8} textAnchor="end" className="weight-chart-label">
          {formatShortDate(data[data.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}
