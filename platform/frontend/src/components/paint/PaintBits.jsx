// ─────────────────────────────────────────────────────────────
// PaintBits — shared "MS Paint" UI primitives
// Used across views; keep radio/ui copy in sync.
// All SVG uses shapeRendering="crispEdges" for the aliased look.
// ─────────────────────────────────────────────────────────────

export const PALETTE = [
  "#ed1c24", "#3f48cc", "#fff200", "#22b14c",
  "#ff00ff", "#00ffff", "#ff7f27", "#a349a4",
];

// deterministic PRNG — same seed always draws the same doodle
const rng = (seed) => () => {
  seed = (seed * 16807 + 7) % 2147483647;
  return seed / 2147483647;
};

// Stable numeric seed from any string (e.g. Navidrome song/album id)
export function seedFrom(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  }
  return (h % 100000) + 1;
}

function Spray({ cx, cy, color, r, n, rand }) {
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = rand() * r;
    dots.push(
      <rect key={i} x={cx + Math.cos(a) * d} y={cy + Math.sin(a) * d} width="2.2" height="2.2" fill={color} />
    );
  }
  return <g>{dots}</g>;
}

function Scribble({ rand, color }) {
  let x = 8 + rand() * 30, y = 15 + rand() * 70, pts = `${x},${y}`;
  for (let i = 0; i < 9; i++) {
    x += 4 + rand() * 11;
    y += (rand() - 0.5) * 34;
    pts += ` ${x},${y}`;
  }
  return <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />;
}

/**
 * Generated abstract cover art. Use as fallback wherever getCoverArt
 * has nothing: <Doodle seed={seedFrom(song.id)} />
 */
export function Doodle({ seed, size = "100%" }) {
  const rand = rng(seed * 999 + 13);
  const c = () => PALETTE[Math.floor(rand() * PALETTE.length)];
  const blob = (key) => {
    const n = 3 + Math.floor(rand() * 4);
    let pts = "";
    for (let i = 0; i < n + 2; i++) pts += `${10 + rand() * 80},${10 + rand() * 80} `;
    return <polygon key={key} points={pts} fill={c()} stroke="#000" strokeWidth="2.5" />;
  };
  const blobs = [blob("b1")];
  if (rand() > 0.4) blobs.push(blob("b2"));
  return (
    <svg
      viewBox="0 0 100 100"
      shapeRendering="crispEdges"
      style={{ width: size, aspectRatio: "1", display: "block", background: "#fff", border: "2px solid #000" }}
    >
      {blobs}
      <ellipse cx={15 + rand() * 70} cy={15 + rand() * 70} rx={6 + rand() * 16} ry={6 + rand() * 16}
        fill={c()} stroke="#000" strokeWidth="2.5" />
      <Scribble rand={rand} color={c()} />
      <Spray cx={20 + rand() * 60} cy={20 + rand() * 60} r={16} n={26} color={c()} rand={rand} />
    </svg>
  );
}

/** Hand-drawn zigzag underline for section headings. */
export function Squiggle({ color = "#ed1c24", w = 180 }) {
  const pts = Array.from({ length: 16 }, (_, i) => `${(i * w) / 15},${i % 2 ? 2 : 8}`).join(" ");
  return (
    <svg width={w} height="10" viewBox={`0 0 ${w} 10`} shapeRendering="crispEdges" style={{ display: "block", marginTop: 2 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
}

/** Heading + squiggle. */
export function SectionHead({ children, color }) {
  return (
    <div style={{ marginBottom: 16, display: "inline-block" }}>
      <h2 className="px">{children}</h2>
      <Squiggle color={color} w={Math.max(120, String(children).length * 13)} />
    </div>
  );
}

/** Blinking red spray-paint star — the ON AIR / LIVE indicator. */
export function LiveBlob() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" shapeRendering="crispEdges" className="blink" style={{ flexShrink: 0 }}>
      <polygon points="13,1 17,8 25,9 19,15 21,24 13,19 5,24 7,15 1,9 9,8"
        fill="#ed1c24" stroke="#000" strokeWidth="1.5" />
    </svg>
  );
}

/** Crooked paint-chip swatch (radio schedule show colour). */
export function PaintChip({ color }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" shapeRendering="crispEdges" style={{ flexShrink: 0 }}>
      <polygon points="4,7 22,3 23,20 2,23" fill={color} stroke="#000" strokeWidth="2" />
    </svg>
  );
}

/** SlagroomFM logo mark. */
export function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" shapeRendering="crispEdges" className="wiggle">
      <polygon points="6,28 10,8 18,14 24,4 30,26 16,22" fill="#ff00ff" stroke="#000" strokeWidth="2" />
      <circle cx="13" cy="25" r="3" fill="#fff200" stroke="#000" strokeWidth="2" />
    </svg>
  );
}
