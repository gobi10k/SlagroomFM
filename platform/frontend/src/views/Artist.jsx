import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TrackList } from "./Browse";
import { usePlayer } from "../hooks/usePlayer";
import { Doodle, Squiggle, SectionHead, seedFrom } from "../components/paint/PaintBits";
import { GigRow } from "./GigBoard";

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
    .map(u => ({
      id: u.navidrome_song_id,
      title: u.title,
      artist: profile.display_name,
      navidrome_song_id: u.navidrome_song_id,
    }));

  return (
    <div className="container page">
      {/* Profile header */}
      <div style={{ display: "flex", gap: 26, alignItems: "flex-start", marginBottom: 40, flexWrap: "wrap" }}>
        <div
          className="panel flat"
          style={{ padding: 6, width: 130, flexShrink: 0, transform: "rotate(-2deg)" }}
        >
          {profile.avatar_path ? (
            <img
              src={profile.avatar_path}
              alt=""
              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
            />
          ) : (
            <Doodle seed={seedFrom(profile.artist_slug || profile.id)} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="px" style={{ fontSize: 40 }}>{profile.display_name}</h1>
          <Squiggle color="var(--p-magenta)" w={220} />
          {profile.bio && (
            <p className="muted" style={{ marginTop: 12, maxWidth: 580, fontSize: 13, lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          )}
          {links.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{l.label}</a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tracks */}
      {tracksWithNd.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <SectionHead color="var(--p-cyan)">tracks</SectionHead>
            <button onClick={() => enqueue(tracksWithNd)} style={{ marginBottom: 16 }}>▶ play all</button>
          </div>
          <div style={{ marginBottom: 44 }}>
            <TrackList tracks={tracksWithNd} enqueue={enqueue} />
          </div>
        </>
      )}

      {/* Gigs */}
      {gigs.length > 0 && (
        <>
          <SectionHead color="var(--p-orange)">gig posts</SectionHead>
          <div>
            {gigs.map((g, i) => <GigRow key={g.id} gig={g} i={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
