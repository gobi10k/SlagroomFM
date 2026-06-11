import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../hooks/usePlayer";
import { Doodle, SectionHead, seedFrom } from "../components/paint/PaintBits";

export default function Browse() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [artists, setArtists] = useState([]);
  const { enqueue } = usePlayer();

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
      <SectionHead color="var(--p-blue)">browse</SectionHead>
      <form onSubmit={search} style={{ display: "flex", gap: 8, margin: "8px 0 32px", maxWidth: 560, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="search tracks, artists…"
          style={{ flex: 1, minWidth: 180 }}
        />
        <button className="bucket" type="submit">search</button>
        {results && (
          <button type="button" onClick={() => { setResults(null); setQ(""); }}>clear</button>
        )}
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
          <SectionHead color="var(--p-orange)">artists</SectionHead>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {results.artists.map(a => (
              <Link key={a.id} to={`/artists/${a.id}`} style={{ textDecoration: "none" }}>
                <button>{a.name}</button>
              </Link>
            ))}
          </div>
        </>
      )}
      {results.songs?.length > 0 && (
        <>
          <SectionHead color="var(--p-orange)">tracks</SectionHead>
          <TrackList tracks={results.songs} enqueue={enqueue} />
        </>
      )}
      {!results.artists?.length && !results.songs?.length && (
        <p className="muted">no results found.</p>
      )}
    </div>
  );
}

function ArtistGrid({ artists }) {
  if (!artists.length) return <p className="muted">Loading library…</p>;
  return (
    <>
      <SectionHead color="var(--p-orange)">all artists</SectionHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {artists.map((a, i) => (
          <Link key={a.id} to={`/artists/${a.id}`} style={{ textDecoration: "none" }}>
            <div
              className="row click"
              style={{ marginBottom: 0, transform: `rotate(${(i % 3) - 1}deg)` }}
            >
              <div style={{ width: 40, flexShrink: 0 }}>
                <Doodle seed={seedFrom(a.id)} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                <div className="muted">{a.albumCount} album{a.albumCount !== 1 ? "s" : ""}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function TrackList({ tracks, enqueue }) {
  return (
    <div>
      {tracks.map((t, i) => (
        <div
          key={t.id}
          className="row click"
          onClick={() => enqueue(tracks.slice(i))}
        >
          <div style={{ width: 46, flexShrink: 0 }}>
            <TrackThumb track={t} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.title}
            </div>
            <div className="muted">{t.artist}</div>
          </div>
          {t.duration != null && (
            <span className="px" style={{ flexShrink: 0, fontSize: 13 }}>
              {Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function TrackThumb({ track }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Doodle seed={seedFrom(track.id)} />;
  return (
    <img
      src={`/api/library/cover/${track.coverArt || track.albumId}?size=48`}
      alt=""
      style={{ width: 46, height: 46, objectFit: "cover", display: "block", border: "2px solid #000" }}
      onError={() => setFailed(true)}
    />
  );
}
