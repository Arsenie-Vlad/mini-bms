import { useEffect, useMemo, useRef, useState } from "react";

function toMs(ts) {
  if (typeof ts === "number") return ts < 1e12 ? ts * 1000 : ts;
  return new Date(ts).getTime();
}

// WS păstrat pe window ca să nu se multiplice la HMR
function getOrCreateWs(url) {
  const existing = window.__miniBmsWs;
  if (
    existing &&
    (existing.readyState === WebSocket.OPEN ||
      existing.readyState === WebSocket.CONNECTING)
  ) {
    return existing;
  }
  try {
    existing?.close(1000, "recreate");
  } catch {}
  if (window.__miniBmsWs) {
    try {
      window.__miniBmsWs.close();
    } catch {}
    window.__miniBmsWs = null;
  }
  const ws = new WebSocket(url);
  window.__miniBmsWs = ws;
  return ws;
}

// IMPORTANT: închide WS când modulul e înlocuit de HMR
if (import.meta?.hot) {
  import.meta.hot.dispose(() => {
    try {
      window.__miniBmsWs?.close(1000, "HMR dispose");
    } catch {}
    window.__miniBmsWs = null;
  });
}

export function useTelemetryWs({ api, room, maxPoints }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [history, setHistory] = useState([]);

  const isStaticRef = useRef(false);
  const freezeFromMsRef = useRef(null);
  const lastPointMsRef = useRef(null);

  const chartData = useMemo(
    () => history.map(({ _ms, ...rest }) => rest),
    [history]
  );

  async function fetchLastOnce() {
    const res = await fetch(`${api}/api/telemetry/last?roomId=${room}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function refreshHistory() {
    try {
      setErr(null);
      if (!isStaticRef.current) return;

      const fromMs = freezeFromMsRef.current;
      if (!fromMs) return;

      const nowMs = Date.now();
      const fromSec = Math.floor(fromMs / 1000);
      const toSec = Math.floor(nowMs / 1000);

      const res = await fetch(
        `${api}/api/telemetry/range?roomId=${room}&from=${fromSec}&to=${toSec}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const newPoints = json.map((t) => {
        const ms = toMs(t.ts);
        return {
          time: new Date(ms).toLocaleTimeString(),
          temp: t.tempC,
          lux: t.lux,
          power: t.powerW,
          _ms: ms,
        };
      });

      setHistory((prev) => {
        const merged = [...prev, ...newPoints].sort(
          (a, b) => (a._ms ?? 0) - (b._ms ?? 0)
        );

        const dedup = [];
        for (const p of merged) {
          const last = dedup[dedup.length - 1];
          if (!last || last._ms !== p._ms) dedup.push(p);
        }

        return dedup.length > maxPoints ? dedup.slice(-maxPoints) : dedup;
      });

      if (newPoints.length) {
        const lastMs = newPoints[newPoints.length - 1]._ms;
        freezeFromMsRef.current = lastMs ?? nowMs;
        lastPointMsRef.current = lastMs ?? lastPointMsRef.current;
      } else {
        freezeFromMsRef.current = nowMs;
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  function toggleStatic() {
    isStaticRef.current = !isStaticRef.current;

    if (isStaticRef.current) {
      freezeFromMsRef.current = lastPointMsRef.current ?? Date.now();
    } else {
      freezeFromMsRef.current = null;
    }

    return isStaticRef.current;
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const last = await fetchLastOnce();
        if (cancelled) return;

        setData(last);

        const ms = toMs(last.ts);
        lastPointMsRef.current = ms;

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
        if (!cancelled) setErr(e.message);
      }
    })();

    // IMPORTANT anti-exponential: omorâm orice WS vechi rămas de la versiuni HMR anterioare
    try {
      window.__miniBmsWs?.close(1000, "remount replace");
    } catch {}
    window.__miniBmsWs = null;

    const wsUrl = `${api.replace("http", "ws")}/ws-telemetry`;
    const ws = getOrCreateWs(wsUrl);

    const onOpen = () => {
      if (cancelled) return;
      setErr(null);
      console.log("WS CONNECTED");
    };

    const onMessage = (ev) => {
      if (cancelled) return;

      try {
        const t = JSON.parse(ev.data);
        if (t.roomId && t.roomId !== room) return;

        setData(t);

        const ms = toMs(t.ts);
        lastPointMsRef.current = ms;

        if (isStaticRef.current) return;

        const point = {
          time: new Date(ms).toLocaleTimeString(),
          temp: t.tempC,
          lux: t.lux,
          power: t.powerW,
          _ms: ms,
        };

        setHistory((prev) => {
          const last = prev[prev.length - 1];
          const next =
            last && last._ms === point._ms
              ? [...prev.slice(0, -1), point]
              : [...prev, point];

          return next.length > maxPoints ? next.slice(-maxPoints) : next;
        });
      } catch (e) {
        console.log("WS parse error:", e);
      }
    };

    const onError = () => {
      if (cancelled) return;
      setErr("WebSocket error");
    };

    ws.addEventListener("open", onOpen);
    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", onError);

    return () => {
      cancelled = true;

      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("error", onError);

      try {
        ws.close(1000, "component unmount");
      } catch {}

      if (window.__miniBmsWs === ws) window.__miniBmsWs = null;
    };
  }, [api, room, maxPoints]);

  return {
    data,
    err,
    history,
    chartData,

    // refs/state helpers
    isStaticRef,
    toggleStatic,
    refreshHistory,
    lastPointMsRef,

    // setters useful for UI
    setErr,
  };
}