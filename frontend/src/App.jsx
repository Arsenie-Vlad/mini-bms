import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const API = "http://localhost:8080";
const ROOM = "room1";

function toMs(ts) {
  // suport: ISO string, epoch sec, epoch ms
  if (typeof ts === "number") return ts < 1e12 ? ts * 1000 : ts;
  return new Date(ts).getTime();
}

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  // history = puncte pentru chart (ultimele rangeMin minute, doar din WS)
  const [history, setHistory] = useState([]);
  const [rangeMin, setRangeMin] = useState(5);

  // (opțional) seed inițial ca să nu fie ecran gol până vine primul WS
  async function fetchLastOnce() {
    const res = await fetch(`${API}/api/telemetry/last?roomId=${ROOM}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  useEffect(() => {
    let alive = true;

    // Seed inițial (o singură cerere, nu polling)
    (async () => {
      try {
        const last = await fetchLastOnce();
        if (!alive) return;
        setData(last);

        const ms = toMs(last.ts);
        setHistory([
          {
            time: new Date(ms).toLocaleTimeString(),
            temp: last.tempC,
            lux: last.lux,
            power: last.powerW,
            _ms: ms,
          },
        ]);
      } catch (e) {
        if (alive) setErr(e.message);
      }
    })();

    // WebSocket live (Telemetry “curat” din backend: tempC/powerW/actuatorLight...)
    const ws = new WebSocket(`${API.replace("http", "ws")}/ws-telemetry`);

    ws.onopen = () => {
      if (!alive) return;
      console.log("WS CONNECTED");
      setErr(null);
    };

    ws.onmessage = (ev) => {
      if (!alive) return;

      try {
        const t = JSON.parse(ev.data);

        // filtrează doar camera dorită
        if (t.roomId && t.roomId !== ROOM) return;

        // update live card
        setData(t);

        // point pentru chart
        const ms = toMs(t.ts);
        const point = {
          time: new Date(ms).toLocaleTimeString(),
          temp: t.tempC,
          lux: t.lux,
          power: t.powerW,
          _ms: ms,
        };

        setHistory((prev) => {
          const cutoff = Date.now() - rangeMin * 60 * 1000;

          // păstrează doar punctele din interval
          const kept = prev.filter((p) => (p._ms ?? 0) >= cutoff);

          // evită duplicate pe același timestamp
          const last = kept[kept.length - 1];
          if (last && last._ms === point._ms) {
            return [...kept.slice(0, -1), point];
          }

          return [...kept, point];
        });
      } catch (e) {
        console.log("WS parse error:", e);
      }
    };

    ws.onerror = () => {
      if (!alive) return;
      setErr("WebSocket error");
    };

    ws.onclose = () => {
      if (!alive) return;
      console.log("WS CLOSED");
    };

    return () => {
      alive = false;
      try {
        ws.close();
      } catch {}
    };
  }, [rangeMin]);

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>Mini-BMS Dashboard</h1>

      {err && (
        <div style={{ padding: 12, border: "1px solid #ccc", marginBottom: 12 }}>
          <b>Error:</b> {err}
          <div style={{ marginTop: 8 }}>
            Verifică backend-ul pe 8080 și WS /ws-telemetry.
          </div>
        </div>
      )}

      {!data ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* CARD LIVE */}
          <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, maxWidth: 520 }}>
            <div><b>Room:</b> {data.roomId}</div>
            <div><b>Time:</b> {String(data.ts)}</div>
            <hr />

            <div><b>Temperature:</b> {data.tempC} °C</div>
            <div><b>Lux:</b> {data.lux}</div>
            <div><b>Power:</b> {data.powerW} W</div>
            <div><b>Occupied:</b> {data.occupied ? "Yes" : "No"}</div>
            <div><b>Mode:</b> {data.mode}</div>

            <h3>Actuators</h3>
            <div><b>Light:</b> {data.actuatorLight ? "ON" : "OFF"}</div>
            <div><b>HVAC:</b> {data.actuatorHvac ? "ON" : "OFF"}</div>

            {/* RANGE selector (nu face REST, doar schimbă filtrarea locală) */}
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <b>Range:</b>
              <button onClick={() => setRangeMin(5)}>5 min</button>
              <button onClick={() => setRangeMin(15)}>15 min</button>
              <button onClick={() => setRangeMin(60)}>60 min</button>
            </div>
          </div>

          {/* GRAFIC (fără ResponsiveContainer ca să evităm width(-1)) */}
          <div style={{ marginTop: 24 }}>
            <h2>Temperature history</h2>
            <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, overflowX: "auto" }}>
              <LineChart width={900} height={300} data={history.map(({ _ms, ...rest }) => rest)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temp" />
              </LineChart>
            </div>
          </div>
        </>
      )}
    </div>
  );
}