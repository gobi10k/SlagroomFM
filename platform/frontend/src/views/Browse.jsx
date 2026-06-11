import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../hooks/usePlayer";

export default function Browse() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [artists, setArtists] = useState([]);
  const { play, enqueue } = usePlayer();

  useEffect(() => {
    fetch("/api/library/browse")
      .then(r => r.ok ? r.json() : {})
      .then(data => setArtists(data.index?.flatMap(i => i.artist) ?? []))
      .catch(() => {});
  }, []);

  const search = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    const r = await fetch(`/api/library/search?q=${encodeURIComponent(q)}`);
    if (r.ok) setResults(await r.json());
  };

  return (
    <div className="container page">
      <h1>Browse</h1>
      <form onSubmit={search} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search tracks, artists…"
          style={{ maxWidth: 420 }}
        />
        <button type="submit">Search</button>
        {results && <button className="ghost" type="button" onClick={() => setResults(null)}>Clear</button>}
      </form>

      {results ? (
        <SearchResults results={results} enqueue={enqueue} />
      ) : (
        <ArtistGrid artists={artists} />
      )}
    </div>
  );
}

function SearchResults({ results, enqueue }) {
  return (
    <div>
      {results.artists?.length > 0 && (
        <>
          <h2>Artists</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {results.artists.map(a => (
              <Link key={a.id} to={`/artists/${a.id}`} className="card" style={{ textDecoration: "none" }}>
                {a.name}
              </Link>
            ))}
          </div>
        </>
      )}
      {results.songs?.length > 0 && (
        <>
          <h2>Tracks</h2>
          <TrackList tracks={results.songs} enqueue={enqueue} />
        </>
      )}
      {!results.artists?.length && !results.songs?.length && (
        <p className="muted">No results found.</p>
      )}
    </div>
  );
}

function ArtistGrid({ artists }) {
  if (!artists.length) return <p className="muted">Loading library…</p>;
  return (
    <>
      <h2>All Artists</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {artists.map(a => (
          <Link key={a.id} to={`/artists/${a.id}`} className="card" style={{ textDecoration: "none" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.name}</div>
            <div className="muted">{a.albumCount} album{a.albumCount !== 1 ? "s" : ""}</div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function TrackList({ tracks, enqueue }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {tracks.map((t, i) => (
        <div
          key={t.id}
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          onClick={() => enqueue(tracks.slice(i))}
        >
          <img
            src={`/api/library/cover/${t.coverArt || t.albumId}?size=48`}
            alt=""
            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, flexShrink: 0, background: "#222" }}
            onError={e => { e.target.style.display = "none"; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
            <div className="muted">{t.artist}</div>
          </div>
          <div className="muted" style={{ flexShrink: 0, fontSize: 12 }}>
            {t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
