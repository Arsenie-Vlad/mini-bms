import TelemetryCard from "../TelemetryCard";
import TelemetryChart from "../TelemetryChart";

function formatTs(ts) {
  if (ts == null) return "—";
  const ms =
    typeof ts === "number" ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(ts);
  if (isNaN(ms)) return String(ts);
  return new Date(ms).toLocaleTimeString();
}

function formatRoom(roomId) {
  if (!roomId) return "—";
  return roomId.replace(/([a-zA-Z]+)(\d+)/, (_, a, b) => a.charAt(0).toUpperCase() + a.slice(1) + " " + b);
}

// ── Icons ───────────────────────────────────────────────────────────────────
const TempIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
  </svg>
);
const LuxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const PowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const ModeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="9" y1="18" x2="15" y2="18" />
    <line x1="10" y1="22" x2="14" y2="22" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
  </svg>
);
const HvacIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M9.59 4.59A2 2 0 1011 8H2m10.59 11.41A2 2 0 1013 16H2m15.73-8.27A2 2 0 1019 12H2" />
  </svg>
);

// ── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse bg-gray-800 rounded-xl h-28" />
  );
}

// ── StatusBadge for boolean / mode values ─────────────────────────────────
function StatusBadge({ on, onLabel = "ON", offLabel = "OFF" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
      on ? "bg-green-500/15 text-green-400" : "bg-gray-700/60 text-gray-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-green-400" : "bg-gray-600"}`} />
      {on ? onLabel : offLabel}
    </span>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({
  data, err,
  metric, setMetric,
  metricLabels, metricColors,
  chartData, history, maxPoints,
  isStatic, onToggleStatic, onRefresh,
}) {
  return (
    <div className="min-h-full bg-gray-950 p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time building telemetry</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {data?.roomId && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14" />
              </svg>
              {formatRoom(data.roomId)}
            </span>
          )}
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${
            err
              ? "bg-red-500/10 border-red-500/25 text-red-400"
              : data
              ? "bg-green-500/10 border-green-500/25 text-green-400"
              : "bg-gray-800 border-gray-700 text-gray-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${err ? "bg-red-500" : data ? "bg-green-500 animate-pulse" : "bg-gray-600"}`} />
            {err ? "Error" : data ? "Live" : "Connecting…"}
          </span>
          {data && (
            <span className="text-gray-600 text-xs">
              Updated {formatTs(data.ts)}
            </span>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {err && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-red-400 text-sm">{err}</p>
        </div>
      )}

      {/* ── Live Telemetry ── */}
      <section>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Live Telemetry
        </h2>

        {/* Primary metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {!data ? (
            <>{[0,1,2].map(i => <Skeleton key={i} />)}</>
          ) : (
            <>
              <TelemetryCard
                label="Temperature"
                value={data.tempC != null ? data.tempC.toFixed(1) : "—"}
                unit="°C"
                icon={<TempIcon />}
                accentColor="red"
                trend="Ambient room temperature"
              />
              <TelemetryCard
                label="Light Level"
                value={data.lux != null ? Math.round(data.lux) : "—"}
                unit="lx"
                icon={<LuxIcon />}
                accentColor="yellow"
                trend="Illuminance sensor reading"
              />
              <TelemetryCard
                label="Power Consumption"
                value={data.powerW != null ? data.powerW.toFixed(1) : "—"}
                unit="W"
                icon={<PowerIcon />}
                accentColor="purple"
                trend="Active power draw"
              />
            </>
          )}
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {!data ? (
            <>{[0,1,2,3].map(i => <Skeleton key={i} />)}</>
          ) : (
            <>
              {/* Occupancy */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-medium">Occupancy</span>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="w-5 h-5 text-blue-400"><PersonIcon /></span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold ${data.occupied ? "text-green-400" : "text-gray-500"}`}>
                    {data.occupied ? "Occupied" : "Vacant"}
                  </span>
                </div>
                <StatusBadge on={data.occupied} onLabel="Presence detected" offLabel="No presence" />
              </div>

              {/* Mode */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-medium">Mode</span>
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <span className="w-5 h-5 text-cyan-400"><ModeIcon /></span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-cyan-400 capitalize">
                  {data.mode ?? "—"}
                </span>
                <p className="text-gray-600 text-xs">Current operating mode</p>
              </div>

              {/* Light actuator */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-medium">Lights</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${data.actuatorLight ? "bg-yellow-500/10" : "bg-gray-800"}`}>
                    <span className={`w-5 h-5 ${data.actuatorLight ? "text-yellow-400" : "text-gray-600"}`}>
                      <LightbulbIcon />
                    </span>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${data.actuatorLight ? "text-yellow-400" : "text-gray-600"}`}>
                  {data.actuatorLight ? "ON" : "OFF"}
                </span>
                <StatusBadge on={data.actuatorLight} onLabel="Lights active" offLabel="Lights off" />
              </div>

              {/* HVAC actuator */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-medium">HVAC</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${data.actuatorHvac ? "bg-blue-500/10" : "bg-gray-800"}`}>
                    <span className={`w-5 h-5 ${data.actuatorHvac ? "text-blue-400" : "text-gray-600"}`}>
                      <HvacIcon />
                    </span>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${data.actuatorHvac ? "text-blue-400" : "text-gray-600"}`}>
                  {data.actuatorHvac ? "ON" : "OFF"}
                </span>
                <StatusBadge on={data.actuatorHvac} onLabel="HVAC active" offLabel="HVAC off" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Chart ── */}
      <section>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
          Telemetry History
        </h2>
        <TelemetryChart
          metric={metric}
          setMetric={setMetric}
          metricLabels={metricLabels}
          metricColors={metricColors}
          chartData={chartData}
          pointsShown={history.length}
          maxPoints={maxPoints}
          isStatic={isStatic}
          onToggleStatic={onToggleStatic}
          onRefresh={onRefresh}
        />
      </section>

    </div>
  );
}
