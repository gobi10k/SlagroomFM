import { usePlayer } from "../hooks/usePlayer";
import { LiveBlob } from "./paint/PaintBits";

const CHIPS = [
  "#000000", "#7f7f7f", "#ed1c24", "#ff7f27",
  "#fff200", "#22b14c", "#00ffff", "#3f48cc",
  "#a349a4", "#ff00ff",
];

const fmt = s => {
  if (!isFinite(s)) return "--:--";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export default function PlayerBar() {
  const { current, playing, progress, duration, pause, resume, seek } = usePlayer();

  if (!current) return null;

  const pct = current.isRadio ? 100 : (duration ? (progress / duration) * 100 : 0);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--player-h)",
      background: "#c3c3c3",
      borderTop: "2px solid #000",
      boxShadow: "inset 0 2px 0 #fff",
      display: "flex", alignItems: "center", gap: 14, padding: "0 14px",
      zIndex: 100,
    }}>
      {/* Play/pause — yellow bucket square */}
      <button
        className="bucket px"
        onClick={playing ? pause : resume}
        style={{ width: 46, height: 46, fontSize: 18, padding: 0, flexShrink: 0 }}
      >
        {playing ? "⏸" : "▶"}
      </button>

      {/* Track info + progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{
            fontWeight: 700, fontSize: 13,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {current.isRadio && <LiveBlob />}
            {current.title}
          </span>
          {!current.isRadio && (
            <span className="px" style={{ flexShrink: 0, marginLeft: 14, fontSize: 13 }}>
              {fmt(progress)} / {fmt(duration)}
            </span>
          )}
        </div>

        {/* Progress bar — sunken white box with paint fill */}
        <div
          style={{
            height: 10,
            background: "#fff",
            border: "2px solid #000",
            cursor: current.isRadio ? "default" : "pointer",
          }}
          onClick={e => {
            if (current.isRadio) return;
            const rect = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: current.isRadio ? "var(--p-red)" : "var(--p-blue)",
          }} />
        </div>
      </div>

      {/* Colour palette chips */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 14px)",
        gap: 3,
        flexShrink: 0,
      }}>
        {CHIPS.map(c => (
          <div key={c} style={{ width: 14, height: 14, background: c, border: "1.5px solid #000" }} />
        ))}
      </div>
    </div>
  );
}
