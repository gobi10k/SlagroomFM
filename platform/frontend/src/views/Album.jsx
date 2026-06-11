import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TrackList } from "./Browse";
import { usePlayer } from "../hooks/usePlayer";
import { Doodle, SectionHead, seedFrom } from "../components/paint/PaintBits";

export default function Album() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState(null);
  const { enqueue } = usePlayer();

  useEffect(() => {
    fetch(`/api/library/album/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setAlbum)
      .catch(() => setError("Album not found."));
  }, [id]);

  if (error) return <div className="container page"><p className="muted">{error}</p></div>;
  if (!album) return <div className="container page"><p className="muted">Loading…</p></div>;

  const tracks = (album.songs || []).map(s => ({ ...s, navidrome_song_id: s.id }));

  return (
    <div className="container page">
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 36, flexWrap: "wrap" }}>
        <div className="panel flat" style={{ padding: 6, width: 140, flexShrink: 0, transform: "rotate(-1deg)" }}>
          <AlbumCover albumId={album.coverArt || id} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 className="px" style={{ fontSize: 36 }}>{album.name}</h1>
          {album.artist && (
            <div style={{ fontSize: 16, marginTop: 6 }}>
              <Link to={`/artists/${album.artistId}`}>{album.artist}</Link>
            </div>
          )}
          {album.year && <div className="muted" style={{ marginTop: 4 }}>{album.year}</div>}
          {tracks.length > 0 && (
            <button onClick={() => enqueue(tracks)} style={{ marginTop: 16 }}>▶ play all</button>
          )}
        </div>
      </div>

      <SectionHead color="var(--p-blue)">tracks</SectionHead>
      <TrackList tracks={tracks} enqueue={enqueue} />
    </div>
  );
}

function AlbumCover({ albumId }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Doodle seed={seedFrom(albumId)} />;
  return (
    <img
      src={`/api/library/cover/${albumId}?size=180`}
      alt=""
      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
      onError={() => setFailed(true)}
    />
  );
}
