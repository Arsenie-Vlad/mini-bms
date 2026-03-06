/**
 * MetricCard – a single telemetry value card.
 *
 * Props:
 *   label        – string  – e.g. "Temperature"
 *   value        – any     – displayed prominently
 *   unit         – string  – e.g. "°C"  (optional)
 *   icon         – JSX     – SVG icon element
 *   accentColor  – string  – tailwind color token: "red" | "yellow" | "purple" | "green" | "blue" | "gray"
 *   trend        – string  – optional small sub-text below value
 */

const colorMap = {
  red:    { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20",    icon: "text-red-400"    },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", icon: "text-yellow-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", icon: "text-purple-400" },
  green:  { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20",  icon: "text-green-400"  },
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20",   icon: "text-blue-400"   },
  gray:   { bg: "bg-gray-700/50",   text: "text-gray-300",   border: "border-gray-700",      icon: "text-gray-400"   },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: "text-orange-400" },
  cyan:   { bg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/20",   icon: "text-cyan-400"   },
};

export default function TelemetryCard({ label, value, unit, icon, accentColor = "blue", trend }) {
  const c = colorMap[accentColor] ?? colorMap.blue;

  return (
    <div className={`bg-gray-900 rounded-xl p-5 border ${c.border} flex flex-col gap-3 hover:border-opacity-60 transition-colors`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
          <span className={`w-5 h-5 ${c.icon}`}>{icon}</span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span className={`text-3xl font-bold leading-none ${c.text}`}>{value ?? "—"}</span>
        {unit && <span className="text-gray-500 text-sm mb-0.5">{unit}</span>}
      </div>

      {/* Trend / sub-label */}
      {trend !== undefined && (
        <p className="text-gray-600 text-xs">{trend}</p>
      )}
    </div>
  );
}
