import { useEffect, useRef, useState } from "react";
import { LiveBlob, PaintChip, SectionHead } from "../components/paint/PaintBits";

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

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.src = "/stream?" + Date.now(); audio.play(); setPlaying(true); }
  };

  // Group by day label
  const byDay = {};
  for (const slot of schedule) {
    const d = new Date(slot.start_ts * 1000).toLocaleDateString("en-GB", {
      weekday: "long", day: "2-digit", month: "2-digit",
    });
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(slot);
  }

  return (
    <div className="container page">
      <audio ref={audioRef} />

      {/* ON AIR hero */}
      <div
        className="panel ants"
        style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48, flexWrap: "wrap" }}
      >
        <button
          className="bucket px"
          onClick={togglePlay}
          style={{ width: 64, height: 64, fontSize: 26, padding: 0, flexShrink: 0 }}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            {(now?.icecast?.live || playing) && <LiveBlob />}
            <h2 className="px" style={{ fontSize: 26 }}>SlagroomFM — ON AIR</h2>
          </div>
          {now?.slot ? (
            <div style={{ fontSize: 14 }}>{now.slot.title}</div>
          ) : (
            <div style={{ fontSize: 14 }}>continuous rotation</div>
          )}
          {now?.icecast?.listeners > 0 && (
            <div className="muted" style={{ marginTop: 3 }}>
              {now.icecast.listeners} listener{now.icecast.listeners !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      <SectionHead color="var(--p-red)">this week</SectionHead>
      {Object.entries(byDay).map(([day, slots]) => (
        <div key={day} style={{ marginBottom: 34 }}>
          {/* yellow tag day header */}
          <span className="tag" style={{ background: "var(--p-yellow)", marginBottom: 12, display: "inline-block" }}>
            {day}
          </span>
          <div style={{ marginTop: 10 }}>
            {slots.map((slot, i) => (
              <SlotRow key={slot.id} slot={slot} i={i} currentSlotId={now?.slot?.id} />
            ))}
          </div>
        </div>
      ))}
      {Object.keys(byDay).length === 0 && (
        <p className="muted">No shows scheduled this week.</p>
      )}
    </div>
  );
}

function SlotRow({ slot, i, currentSlotId }) {
  const isCurrent = slot.id === currentSlotId;
  const start = new Date(slot.start_ts * 1000);
  const end   = new Date(slot.end_ts   * 1000);
  const fmt = d => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="row"
      style={{
        transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`,
        background: isCurrent ? "rgba(255,242,0,.4)" : "#fff",
        alignItems: "center",
      }}
    >
      <PaintChip color={slot.color || "#c3c3c3"} />
      <span className="px" style={{ minWidth: 80, flexShrink: 0, fontSize: 14 }}>
        {fmt(start)}–{fmt(end)}
      </span>
      <div style={{ flex: 1, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {slot.title}
        {isCurrent && (
          <span className="tag" style={{ background: "var(--p-red)", color: "#fff" }}>NOW</span>
        )}
        {slot.kind === "live_placeholder" && <LiveBlob />}
      </div>
      {slot.notes && (
        <span className="muted" style={{ flexShrink: 0, fontSize: 11, textAlign: "right", maxWidth: 140 }}>
          {slot.notes}
        </span>
      )}
    </div>
  );
}
