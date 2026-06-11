import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TrackList } from "./Browse";
import { usePlayer } from "../hooks/usePlayer";

export default function Artist() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { enqueue } = usePlayer();

  useEffect(() => {
    fetch(`/api/profiles/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(err => setError(err === 404 ? "Artist not found." : "Error loading profile."));
  }, [slug]);

  if (error) return <div className="container page"><p className="muted">{error}</p></div>;
  if (!data) return <div className="container page"><p className="muted">Loading…</p></div>;

  const { profile, uploads, gigs } = data;
  const links = JSON.parse(profile.links_json || "[]");

  const tracksWithNd = uploads
    .filter(u => u.navidrome_song_id)
    .map(u => ({ id: u.navidrome_song_id, title: u.title, artist: profile.display_name, navidrome_song_id: u.navidrome_song_id }));

  return (
    <div className="container page">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
        {profile.avatar_path ? (
          <img src={profile.avatar_path} alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            {profile.display_name[0]}
          </div>
        )}
        <div>
          <h1>{profile.display_name}</h1>
          {profile.bio && <p style={{ marginTop: 8, color: "var(--text-muted)", maxWidth: 600 }}>{profile.bio}</p>}
          {links.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {links.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{l.label}</a>)}
            </div>
          )}
        </div>
      </div>

      {tracksWithNd.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2>Tracks</h2>
            <button className="ghost" onClick={() => enqueue(tracksWithNd)}>Play all</button>
          </div>
          <TrackList tracks={tracksWithNd} enqueue={enqueue} />
        </>
      )}

      {gigs.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2>Gigs</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {gigs.map(g => (
              <div key={g.id} className="card">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="badge" style={{ background: g.kind === "playing" ? "#16a34a" : "#b45309" }}>
                    {g.kind === "playing" ? "Playing" : "Looking"}
                  </span>
                  <strong>{g.title}</strong>
                </div>
                {g.body && <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 14 }}>{g.body}</p>}
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  {[g.venue, g.city, g.date].filter(Boolean).join(" · ")}
                  {g.link && <> · <a href={g.link} target="_blank" rel="noreferrer">Link</a></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
