import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TrackList } from "./Browse";
import { usePlayer } from "../hooks/usePlayer";
import { Doodle, Squiggle, SectionHead, seedFrom } from "../components/paint/PaintBits";
import { GigRow } from "./GigBoard";

export default function Artist() {
  const { id } = useParams();
  const [library, setLibrary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const { enqueue } = usePlayer();

  useEffect(() => {
    fetch(`/api/library/artist/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setLibrary(data);
        return fetch(`/api/profiles/by-name/${encodeURIComponent(data.name)}`)
          .then(r => r.ok ? r.json() : null)
          .then(setProfile)
          .catch(() => {});
      })
      .catch(() => setError("Artist not found."));
  }, [id]);

  if (error) return <div className="container page"><p className="muted">{error}</p></div>;
  if (!library) return <div className="container page"><p className="muted">Loading…</p></div>;

  const allTracks = library.albums.flatMap(album =>
    (album.songs || []).map(s => ({ ...s, navidrome_song_id: s.id }))
  );

  const links = profile ? JSON.parse(profile.profile.links_json || "[]") : [];

  return (
    <div className="container page">
      {/* Header: avatar + name + bio/links if profile exists */}
      <div style={{ display: "flex", gap: 26, alignItems: "flex-start", marginBottom: 40, flexWrap: "wrap" }}>
        <div className="panel flat" style={{ padding: 6, width: 130, flexShrink: 0, transform: "rotate(-2deg)" }}>
          {profile?.profile.avatar_path ? (
            <img
              src={profile.profile.avatar_path}
              alt=""
              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
            />
          ) : (
            <Doodle seed={seedFrom(id)} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="px" style={{ fontSize: 40 }}>{library.name}</h1>
          <Squiggle color="var(--p-magenta)" w={220} />
          {profile?.profile.bio && (
            <p className="muted" style={{ marginTop: 12, maxWidth: 580, fontSize: 13, lineHeight: 1.6 }}>
              {profile.profile.bio}
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

      {/* Play all */}
      {allTracks.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <SectionHead color="var(--p-cyan)">discography</SectionHead>
          <button onClick={() => enqueue(allTracks)}>▶ play all</button>
        </div>
      )}

      {/* Albums */}
      {library.albums.map(album => {
        const albumTracks = (album.songs || []).map(s => ({ ...s, navidrome_song_id: s.id }));
        return (
          <div key={album.id} style={{ marginBottom: 44 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
              <Link to={`/albums/${album.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <div className="panel flat" style={{ padding: 4, width: 56 }}>
                  <AlbumThumb albumId={album.coverArt || album.id} />
                </div>
              </Link>
              <div>
                <Link to={`/albums/${album.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{album.name}</div>
                </Link>
                {album.year && <div className="muted" style={{ fontSize: 12 }}>{album.year}</div>}
                {albumTracks.length > 0 && (
                  <button
                    style={{ marginTop: 6, fontSize: 12, padding: "2px 10px" }}
                    onClick={() => enqueue(albumTracks)}
                  >
                    ▶ play album
                  </button>
                )}
              </div>
            </div>
            {albumTracks.length > 0 && (
              <TrackList tracks={albumTracks} enqueue={enqueue} />
            )}
          </div>
        );
      })}

      {/* Gigs from platform profile */}
      {profile?.gigs?.length > 0 && (
        <>
          <SectionHead color="var(--p-orange)">gig posts</SectionHead>
          <div>
            {profile.gigs.map((g, i) => <GigRow key={g.id} gig={g} i={i} />)}
          </div>
        </>
      )}
    </div>
  );
}

function AlbumThumb({ albumId }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Doodle seed={seedFrom(albumId)} />;
  return (
    <img
      src={`/api/library/cover/${albumId}?size=56`}
      alt=""
      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
      onError={() => setFailed(true)}
    />
  );
}
