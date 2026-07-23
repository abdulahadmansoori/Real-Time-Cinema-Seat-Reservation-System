"use client";

type Point = {
  label: string;
  bookings: number;
  failures: number;
};

export function BookingTrendChart({ series }: { series: Point[] }) {
  const width = 640;
  const height = 240;
  const pad = { top: 24, right: 16, bottom: 32, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(
    1,
    ...series.flatMap((p) => [p.bookings, p.failures]),
  );

  const x = (i: number) =>
    pad.left + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const line = (key: "bookings" | "failures") =>
    series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(" ");

  const area = (key: "bookings" | "failures") => {
    if (!series.length) return "";
    const top = series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(" ");
    const lastX = x(series.length - 1);
    const firstX = x(0);
    const base = pad.top + innerH;
    return `${top} L ${lastX.toFixed(1)} ${base} L ${firstX.toFixed(1)} ${base} Z`;
  };

  const gridYs = [0, 0.5, 1].map((t) => pad.top + innerH * (1 - t));

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Booking trend chart">
        {gridYs.map((gy) => (
          <line
            key={gy}
            x1={pad.left}
            y1={gy}
            x2={width - pad.right}
            y2={gy}
            stroke="var(--border)"
            strokeDasharray="4 4"
          />
        ))}
        <path d={area("bookings")} fill="var(--accent)" opacity="0.12" />
        <path
          d={line("bookings")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={line("failures")}
          fill="none"
          stroke="var(--warning)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {series.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.bookings)} r="4" fill="var(--accent)" />
            <circle cx={x(i)} cy={y(p.failures)} r="4" fill="var(--warning)" />
            <text
              x={x(i)}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <style jsx>{`
        .chart {
          width: 100%;
        }
        .chart :global(svg) {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </div>
  );
}
