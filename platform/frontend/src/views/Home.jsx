import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../hooks/usePlayer";

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
      {/* Radio banner */}
      <div className="card" style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>SlagroomFM Radio</h2>
            {nowPlaying?.icecast?.live && <span className="badge live">LIVE</span>}
          </div>
          {nowPlaying?.slot && (
            <p className="muted">{nowPlaying.slot.title}</p>
          )}
          {nowPlaying?.icecast?.listeners > 0 && (
            <p className="muted">{nowPlaying.icecast.listeners} listening</p>
          )}
        </div>
        <button onClick={playRadio}>▶ Tune in</button>
        <Link to="/radio" className="muted" style={{ fontSize: 13 }}>Schedule ↗</Link>
      </div>

      {/* Recent uploads */}
      <h2>Recent Uploads</h2>
      {recent.length === 0 ? (
        <p className="muted" style={{ marginBottom: 32 }}>No recent uploads yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
          {recent.map(album => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      {/* Gig board preview */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>Upcoming Gigs</h2>
        <Link to="/gigs" style={{ fontSize: 13 }}>View all →</Link>
      </div>
      {gigs.length === 0 ? (
        <p className="muted">No gigs posted yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {gigs.map(g => (
            <GigPreview key={g.id} gig={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumCard({ album }) {
  return (
    <div className="card" style={{ cursor: "pointer" }}>
      <img
        src={`/api/library/cover/${album.id}?size=180`}
        alt=""
        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, marginBottom: 8, background: "#222" }}
        onError={e => { e.target.style.display = "none"; }}
      />
      <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.name}</div>
      <div className="muted">{album.artist}</div>
    </div>
  );
}

function GigPreview({ gig }) {
  return (
    <div className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <span className="badge" style={{ background: gig.kind === "playing" ? "#16a34a" : "#b45309", flexShrink: 0 }}>
        {gig.kind === "playing" ? "Playing" : "Looking"}
      </span>
      <div>
        <Link to={`/artists/${gig.artist_slug}`} style={{ fontWeight: 600 }}>{gig.display_name}</Link>
        <span className="muted" style={{ marginLeft: 8 }}>{gig.title}</span>
        {gig.city && <span className="muted"> · {gig.city}</span>}
        {gig.date && <span className="muted"> · {gig.date}</span>}
      </div>
    </div>
  );
}
