import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../hooks/usePlayer";
import { Doodle, LiveBlob, SectionHead, seedFrom } from "../components/paint/PaintBits";

export default function Home() {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [recent, setRecent] = useState([]);
  const [gigs, setGigs] = useState([]);
  const { playRadio } = usePlayer();

  useEffect(() => {
    fetch("/radio/api/now").then(r => r.ok ? r.json() : null).then(setNowPlaying).catch(() => {});
    fetch("/api/library/recent?limit=8").then(r => r.ok ? r.json() : []).then(setRecent).catch(() => {});
    fetch("/api/gigs?limit=4").then(r => r.ok ? r.json() : []).then(setGigs).catch(() => {});
  }, []);

  return (
    <div className="container page">
      {/* ON AIR hero — marching ants selection */}
      <div className="panel ants" style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48, flexWrap: "wrap" }}>
        <button
          className="bucket px"
          onClick={playRadio}
          style={{ width: 64, height: 64, fontSize: 26, padding: 0, flexShrink: 0 }}
        >
          ▶
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            {nowPlaying?.icecast?.live && <LiveBlob />}
            <h2 className="px" style={{ fontSize: 26 }}>SlagroomFM radio — ON AIR</h2>
          </div>
          {nowPlaying?.slot && (
            <div style={{ fontSize: 14 }}>{nowPlaying.slot.title}</div>
          )}
          {nowPlaying?.icecast?.listeners > 0 && (
            <div className="muted" style={{ marginTop: 3 }}>
              {nowPlaying.icecast.listeners} listening
            </div>
          )}
        </div>
        <Link to="/radio" className="px" style={{ fontSize: 14, flexShrink: 0 }}>schedule →</Link>
      </div>

      {/* Recent uploads */}
      <SectionHead color="var(--p-magenta)">recent uploads</SectionHead>
      {recent.length === 0 ? (
        <p className="muted" style={{ marginBottom: 48 }}>No recent uploads yet.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 22,
          marginBottom: 52,
        }}>
          {recent.map((album, i) => (
            <AlbumTile key={album.id} album={album} i={i} />
          ))}
        </div>
      )}

      {/* Gig board preview */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <SectionHead color="var(--p-green)">upcoming gigs</SectionHead>
        <Link to="/gigs" className="px" style={{ fontSize: 13, marginBottom: 16 }}>view all →</Link>
      </div>
      {gigs.length === 0 ? (
        <p className="muted">No gigs posted yet.</p>
      ) : (
        <div>{gigs.map((g, i) => <GigRow key={g.id} gig={g} i={i} />)}</div>
      )}
    </div>
  );
}

function AlbumTile({ album, i }) {
  const [imgFailed, setImgFailed] = useState(false);
  const tilt = ((i % 3) - 1) + "deg";
  return (
    <div style={{ cursor: "pointer", transform: `rotate(${tilt})` }}>
      <div className="panel flat" style={{ padding: 6, marginBottom: 8 }}>
        {!imgFailed ? (
          <img
            src={`/api/library/cover/${album.id}?size=180`}
            alt=""
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Doodle seed={seedFrom(album.id)} />
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {album.name}
      </div>
      <div className="muted">{album.artist}</div>
    </div>
  );
}

function GigRow({ gig, i }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)` }}>
      <span
        className="tag"
        style={{ background: gig.kind === "playing" ? "var(--p-green)" : "var(--p-orange)", flexShrink: 0 }}
      >
        {gig.kind === "playing" ? "PLAYING" : "LOOKING"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14 }}>
          <Link to={`/artists/${gig.artist_slug}`} style={{ fontWeight: 700 }}>{gig.display_name}</Link>
          {" · "}
          <strong>{gig.title}</strong>
        </div>
        <div className="muted" style={{ marginTop: 4, fontSize: 11 }}>
          {[gig.city, gig.date].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}
