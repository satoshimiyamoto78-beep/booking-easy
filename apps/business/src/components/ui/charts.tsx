export function Sparkline({
  data,
  color = "var(--accent)",
}: {
  data: number[];
  color?: string;
}) {
  const max = Math.max(...data, 1);
  const width = 88;
  const height = 32;
  const barWidth = width / data.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      {data.map((value, i) => {
        const h = Math.max((value / max) * height, 2);
        return (
          <rect
            key={i}
            x={i * barWidth + 1}
            y={height - h}
            width={Math.max(barWidth - 2, 1)}
            height={h}
            rx={1.5}
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}

export function TrendBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 640;
  const height = 200;
  const paddingBottom = 28;
  const chartHeight = height - paddingBottom;
  const barGap = 10;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Appointment volume over time"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={0}
          x2={width}
          y1={chartHeight * (1 - f)}
          y2={chartHeight * (1 - f)}
          stroke="var(--border-subtle)"
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * (chartHeight - 8), d.value > 0 ? 4 : 0);
        const x = i * (barWidth + barGap);
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={chartHeight - h}
              width={barWidth}
              height={h}
              rx={5}
              fill={isLast ? "var(--accent)" : "var(--accent-soft-strong)"}
            />
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-tertiary)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
