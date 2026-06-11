import { useEffect, useRef, useState } from "react";

const DAY_MS = 86400_000;

export default function Public() {
  const [now, setNow] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const load = () => {
    fetch("/radio/api/now").then(r => r.ok ? r.json() : null).then(setNow).catch(() => {});
    const from = Math.floor(Date.now() / 1000);
    const to = from + 7 * 86400;
    fetch(`/radio/api/schedule?from_ts=${from}&to_ts=${to}`)
      .then(r => r.ok ? r.json() : []).then(setSchedule).catch(() => {});
  };

  useEffect(() => { load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.src = "/stream?" + Date.now(); audio.play(); setPlaying(true); }
  };

  // Group slots by day
  const byDay = {};
  for (const slot of schedule) {
    const d = new Date(slot.start_ts * 1000).toDateString();
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(slot);
  }

  return (
    <div className="container" style={{ padding: "32px 20px" }}>
      {/* Player */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <audio ref={audioRef} />
        <button onClick={togglePlay} style={{ width: 52, height: 52, borderRadius: "50%", padding: 0, fontSize: 22, flexShrink: 0 }}>
          {playing ? "⏸" : "▶"}
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0 }}>SlagroomFM</h2>
            {now?.icecast?.live && <span className="badge live">LIVE</span>}
          </div>
          {now?.slot
            ? <p className="muted">{now.slot.title}</p>
            : <p className="muted">Continuous rotation</p>
          }
          {now?.icecast?.listeners > 0 && (
            <p className="muted">{now.icecast.listeners} listener{now.icecast.listeners !== 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <h2>This Week</h2>
      {Object.entries(byDay).map(([day, slots]) => (
        <div key={day} style={{ marginBottom: 24 }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: 13, textTransform: "uppercase", marginBottom: 8 }}>{day}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {slots.map(slot => (
              <SlotRow key={slot.id} slot={slot} currentSlotId={now?.slot?.id} />
            ))}
          </div>
        </div>
      ))}
      {Object.keys(byDay).length === 0 && <p className="muted">No shows scheduled this week.</p>}
    </div>
  );
}

function SlotRow({ slot, currentSlotId }) {
  const start = new Date(slot.start_ts * 1000);
  const end   = new Date(slot.end_ts * 1000);
  const isCurrent = slot.id === currentSlotId;
  const fmt = d => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", borderColor: isCurrent ? slot.color : undefined }}>
      <div style={{ width: 4, height: 40, borderRadius: 2, background: slot.color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{slot.title}</strong>
          {isCurrent && <span className="badge live">NOW</span>}
        </div>
        <div className="muted">{fmt(start)} – {fmt(end)}</div>
      </div>
      {slot.notes && <div className="muted" style={{ fontSize: 12, maxWidth: 200, textAlign: "right" }}>{slot.notes}</div>}
    </div>
  );
}
