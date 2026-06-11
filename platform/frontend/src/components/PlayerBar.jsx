import { usePlayer } from "../hooks/usePlayer";

export default function PlayerBar() {
  const { current, playing, progress, duration, pause, resume, seek } = usePlayer();

  if (!current) return null;

  const pct = duration ? (progress / duration) * 100 : 0;
  const fmt = (s) => {
    if (!isFinite(s)) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--player-h)", background: "var(--surface)",
      borderTop: "1px solid var(--border)", display: "flex",
      alignItems: "center", gap: 16, padding: "0 20px", zIndex: 100,
    }}>
      <button
        onClick={playing ? pause : resume}
        style={{ minWidth: 40, height: 40, borderRadius: "50%", padding: 0, fontSize: 18 }}
      >
        {playing ? "⏸" : "▶"}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.title}
            {current.isRadio && <span className="badge live" style={{ marginLeft: 8 }}>LIVE</span>}
          </span>
          {!current.isRadio && (
            <span className="muted" style={{ flexShrink: 0, marginLeft: 12 }}>
              {fmt(progress)} / {fmt(duration)}
            </span>
          )}
        </div>
        {!current.isRadio && (
          <input
            type="range" min={0} max={duration || 1} step={0.5} value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ width: "100%", height: 4, cursor: "pointer", padding: 0 }}
          />
        )}
      </div>
    </div>
  );
}
