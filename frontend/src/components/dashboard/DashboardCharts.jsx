import { useId, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from "recharts";
import { Card } from "../ui";
import { useTheme } from "../../context/ThemeContext";

const CHART_AXIS_PROPS = {
  tick: { fill: "var(--color-text-muted)", fontSize: 12 },
  axisLine: { stroke: "var(--color-chart-axis)" },
  tickLine: { stroke: "var(--color-chart-axis)" }
};

const CHART_GRID_PROPS = {
  stroke: "var(--color-chart-grid)",
  strokeDasharray: "3 3"
};

const BAR_TOOLTIP_CURSOR = { fill: "var(--color-chart-cursor)" };
const AREA_TOOLTIP_CURSOR = {
  stroke: "var(--color-chart-crosshair)",
  strokeWidth: 1,
  strokeDasharray: "4 4"
};

const BAR_ACTIVE_PROPS = {
  stroke: "var(--color-chart-axis)",
  strokeWidth: 1,
  radius: [8, 8, 0, 0]
};

function ChartSurface({ height, children }) {
  return (
    <div className="dashboard-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function resolveThemeColor(input) {
  if (!input || typeof document === "undefined") return input;
  const probe = document.createElement("span");
  probe.style.color = input;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return resolved;
}

function parseRgb(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function adjustRgb(rgb, amount) {
  return rgb.map((channel) => Math.min(255, Math.max(0, Math.round(channel + amount))));
}

function rgbToCss(rgb) {
  return `rgb(${rgb.join(", ")})`;
}

function buildChartGradientStops(baseColor) {
  const resolved = resolveThemeColor(baseColor);
  const rgb = parseRgb(resolved);
  if (!rgb) {
    return { start: baseColor, middle: baseColor, end: baseColor };
  }
  return {
    start: rgbToCss(adjustRgb(rgb, 48)),
    middle: rgbToCss(rgb),
    end: rgbToCss(adjustRgb(rgb, -42))
  };
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Card padding="p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-text-primary m-0">{title}</h3>
        {subtitle ? <p className="text-xs text-text-muted mt-1 mb-0">{subtitle}</p> : null}
      </div>
      {children}
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] rounded-lg border border-card-border bg-surface flex items-center justify-center">
      <p className="text-sm text-text-muted m-0">Not enough data yet</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
      {label ? <p className="text-xs text-text-muted m-0 mb-1">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-xs text-text-secondary m-0">
            <span className="font-medium text-text-primary">{entry.name}:</span>{" "}
            {valueFormatter ? valueFormatter(entry.value, entry.dataKey) : entry.value}
          </p>
        ))}
      </div>
    </div>
  );
}

export function DashboardDonutChart({
  title,
  subtitle,
  data,
  valueFormatter,
  height = 280
}) {
  const { isDarkMode } = useTheme();
  const chartId = useId().replace(/:/g, "");
  const hasData = Array.isArray(data) && data.some((d) => Number(d.value) > 0);
  const gradientStops = useMemo(
    () => (Array.isArray(data) ? data.map((entry) => buildChartGradientStops(entry.color)) : []),
    [data, isDarkMode]
  );

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!hasData ? (
        <EmptyChart />
      ) : (
        <ChartSurface height={height}>
          <PieChart>
            <defs>
              {data.map((entry, index) => {
                const stops = gradientStops[index];
                const gradientId = `donut-gradient-${chartId}-${index}`;
                return (
                  <linearGradient
                    key={entry.name}
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={stops.start} />
                    <stop offset="52%" stopColor={stops.middle} />
                    <stop offset="100%" stopColor={stops.end} />
                  </linearGradient>
                );
              })}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              cornerRadius={12}
              stroke="var(--color-card)"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={`url(#donut-gradient-${chartId}-${index})`} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(v) => (valueFormatter ? valueFormatter(v) : v)}
                />
              }
              cursor={{ fill: "transparent" }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ color: "var(--color-text-secondary)" }}
              formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
            />
          </PieChart>
        </ChartSurface>
      )}
    </ChartCard>
  );
}

export function DashboardAreaTrendChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  valueFormatter,
  height = 280
}) {
  const { isDarkMode } = useTheme();
  const hasData = Array.isArray(data) && data.length > 0;
  const areaGradients = useMemo(
    () => series.map((item) => buildChartGradientStops(item.color)),
    [series, isDarkMode]
  );
  const chartId = useId().replace(/:/g, "");

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!hasData ? (
        <EmptyChart />
      ) : (
        <ChartSurface height={height}>
          <AreaChart data={data} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
            <defs>
              {series.map((item, index) => {
                const stops = areaGradients[index];
                const fillId = `area-fill-${chartId}-${index}`;
                const strokeId = `area-stroke-${chartId}-${index}`;
                return (
                  <g key={item.key}>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stops.start} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={stops.end} stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={stops.start} />
                      <stop offset="100%" stopColor={stops.end} />
                    </linearGradient>
                  </g>
                );
              })}
            </defs>
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis dataKey={xKey} {...CHART_AXIS_PROPS} />
            <YAxis {...CHART_AXIS_PROPS} />
            <Tooltip
              content={<ChartTooltip valueFormatter={valueFormatter} />}
              cursor={AREA_TOOLTIP_CURSOR}
            />
            {series.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={`url(#area-stroke-${chartId}-${index})`}
                fill={`url(#area-fill-${chartId}-${index})`}
                strokeWidth={2}
                activeDot={{
                  r: 4,
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                  fill: resolveThemeColor(item.color)
                }}
              />
            ))}
          </AreaChart>
        </ChartSurface>
      )}
    </ChartCard>
  );
}

export function DashboardBarChart({
  title,
  subtitle,
  data,
  xKey,
  bars,
  valueFormatter,
  height = 280
}) {
  const { isDarkMode } = useTheme();
  const chartId = useId().replace(/:/g, "");
  const hasData = Array.isArray(data) && data.length > 0;
  const gradientStops = useMemo(
    () => (Array.isArray(bars) ? bars.map((bar) => buildChartGradientStops(bar.color)) : []),
    [bars, isDarkMode]
  );

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!hasData ? (
        <EmptyChart />
      ) : (
        <ChartSurface height={height}>
          <BarChart data={data} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
            <defs>
              {bars.map((bar, index) => {
                const stops = gradientStops[index];
                const gradientId = `bar-gradient-${chartId}-${index}`;
                const activeGradientId = `bar-active-gradient-${chartId}-${index}`;
                return (
                  <g key={bar.key}>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={stops.start} />
                      <stop offset="52%" stopColor={stops.middle} />
                      <stop offset="100%" stopColor={stops.end} />
                    </linearGradient>
                    <linearGradient id={activeGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={stops.middle} />
                      <stop offset="100%" stopColor={stops.end} />
                    </linearGradient>
                  </g>
                );
              })}
            </defs>
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis dataKey={xKey} {...CHART_AXIS_PROPS} />
            <YAxis {...CHART_AXIS_PROPS} />
            <Tooltip
              content={<ChartTooltip valueFormatter={valueFormatter} />}
              cursor={BAR_TOOLTIP_CURSOR}
            />
            {bars.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                fill={`url(#bar-gradient-${chartId}-${index})`}
                activeBar={{
                  ...BAR_ACTIVE_PROPS,
                  fill: `url(#bar-active-gradient-${chartId}-${index})`
                }}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartSurface>
      )}
    </ChartCard>
  );
}
