import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import { useTelemetryWs } from "./hooks/useTelemetryWs";

const API = "http://localhost:8080";
const ROOM = "room1";
const MAX_POINTS = 50;

const metricLabels = { temp: "Temperature (°C)", lux: "Lux (lx)", power: "Power (W)" };
const metricColors = { temp: "#ef4444", lux: "#facc15", power: "#8b5cf6" };

function PlaceholderPage({ name }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-950">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-400 capitalize">{name}</h2>
        <p className="text-gray-600 mt-1 text-sm">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [metric, setMetric] = useState("temp");
  const [isStatic, setIsStatic] = useState(false);

  const { data, err, history, chartData, toggleStatic, refreshHistory } =
    useTelemetryWs({ api: API, room: ROOM, maxPoints: MAX_POINTS });

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {activePage === "dashboard" && (
          <Dashboard
            data={data}
            err={err}
            metric={metric}
            setMetric={setMetric}
            metricLabels={metricLabels}
            metricColors={metricColors}
            chartData={chartData}
            history={history}
            maxPoints={MAX_POINTS}
            isStatic={isStatic}
            onToggleStatic={() => setIsStatic(toggleStatic())}
            onRefresh={refreshHistory}
          />
        )}
        {activePage !== "dashboard" && <PlaceholderPage name={activePage} />}
      </main>
    </div>
  );
}