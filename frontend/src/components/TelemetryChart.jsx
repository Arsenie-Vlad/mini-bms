import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const metricUnits = { temp: "°C", lux: "lx", power: "W" };

function CustomTooltip({ active, payload, label, metric, metricLabels }) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-semibold">
        {value} <span className="text-gray-400 font-normal">{metricUnits[metric]}</span>
      </p>
      <p className="text-gray-500 text-xs">{metricLabels[metric]}</p>
    </div>
  );
}

export default function TelemetryChart({
  metric,
  setMetric,
  metricLabels,
  metricColors,
  chartData,
  pointsShown,
  maxPoints,
  isStatic,
  onToggleStatic,
  onRefresh,
}) {
  const metricKeys = Object.keys(metricLabels);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-white font-semibold text-base">Telemetry History</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {pointsShown} / {maxPoints} points &nbsp;·&nbsp;
            <span className={isStatic ? "text-amber-400" : "text-green-400"}>
              {isStatic ? "Frozen" : "Live"}
            </span>
          </p>
        </div>

        {/* Metric selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {metricKeys.map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  metric === m
                    ? "bg-gray-700 text-white shadow"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                style={metric === m ? { color: metricColors[m] } : {}}
              >
                {m === "temp" ? "Temp" : m === "lux" ? "Lux" : "Power"}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleStatic}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              isStatic
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            }`}
          >
            {isStatic ? "▶ Resume" : "⏸ Freeze"}
          </button>

          {isStatic && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={metricColors[metric]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={metricColors[metric]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="time"
            stroke="#374151"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            stroke="#374151"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <CustomTooltip metric={metric} metricLabels={metricLabels} />
            }
            cursor={{ stroke: "#374151", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey={metric}
            name={metricLabels[metric]}
            stroke={metricColors[metric]}
            strokeWidth={2}
            fill="url(#chartGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
