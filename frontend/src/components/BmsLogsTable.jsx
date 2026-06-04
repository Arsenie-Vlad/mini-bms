import { useEffect, useState } from "react";

const API = "http://localhost:8080";

function parseLogLine(line) {
  // Backend-ul trimite o linie CSV brută, așa că o spargem în câmpuri fixe.
  const [mode, temperature, humidity, ldr, pir, consumption] = String(line)
    .split(",")
    .map((value) => value.trim());

  return {
    mode: mode ?? "—",
    temperature: temperature ?? "—",
    humidity: humidity ?? "—",
    ldr: ldr ?? "—",
    pir: pir ?? "—",
    consumption: consumption ?? "—",
  };
}

function getModeBadgeClass(mode) {
  if (mode === "ECO") return "bg-green-100 text-green-800";
  if (mode === "CONFORT") return "bg-blue-100 text-blue-800";
  if (mode === "NOAPTE") return "bg-gray-700 text-white";
  return "bg-gray-100 text-gray-700";
}

function formatNumber(value, fractionDigits = 2) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value ?? "—";
  return numeric.toFixed(fractionDigits);
}

export default function BmsLogsTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/logs`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      setLogs(Array.isArray(json) ? json.reverse() : []);
    } catch (fetchError) {
      setError(fetchError.message || "Eroare la încărcarea logurilor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const parsedLogs = logs.map(parseLogLine);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-800">
        <div>
          <h2 className="text-white text-sm font-semibold">BMS Logs</h2>
          <p className="text-gray-500 text-xs">Date CSV primite live de la ESP32</p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-4 pt-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <table className="min-w-full divide-y divide-gray-800 text-sm">
          <thead className="bg-gray-950/70 sticky top-0 z-10">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-semibold">Mod Sistem</th>
              <th className="px-4 py-3 font-semibold">Temperatură (°C)</th>
              <th className="px-4 py-3 font-semibold">Umiditate (%)</th>
              <th className="px-4 py-3 font-semibold">Senzor Lumină (Lux)</th>
              <th className="px-4 py-3 font-semibold">Mișcare (PIR)</th>
              <th className="px-4 py-3 font-semibold">Consum (W)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800 bg-gray-900">
            {parsedLogs.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  {loading ? "Se încarcă logurile..." : "Nu există date de afișat."}
                </td>
              </tr>
            ) : (
              parsedLogs.map((row, index) => (
                <tr key={`${row.mode}-${index}`} className="hover:bg-gray-800/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getModeBadgeClass(row.mode)}`}>
                      {row.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{formatNumber(row.temperature)}</td>
                  <td className="px-4 py-3 text-gray-200">{formatNumber(row.humidity)}</td>
                  <td className="px-4 py-3 text-gray-200">{row.ldr}</td>
                  <td className="px-4 py-3">
                    {row.pir === "1" ? (
                      <span className="font-medium text-red-500">Mișcare!</span>
                    ) : (
                      <span className="font-medium text-gray-400">Liber</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-200">{formatNumber(row.consumption)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}