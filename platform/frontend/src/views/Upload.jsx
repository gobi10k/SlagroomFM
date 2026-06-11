import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { SectionHead } from "../components/paint/PaintBits";

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  if (!user) return (
    <div className="container page">
      <p className="muted">You need to <Link to="/login">log in</Link> to upload.</p>
    </div>
  );

  if (user.role === "listener") return (
    <div className="container page">
      <p className="muted">Only artists can upload. Update your profile role to artist.</p>
    </div>
  );

  if (!user.artist_slug) return (
    <div className="container page">
      <p className="muted">Set an <strong>artist slug</strong> on your profile before uploading.</p>
      <Link to="/profile"><button className="bucket" style={{ marginTop: 12 }}>go to profile</button></Link>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setError(""); setDone(null); setProgress(0);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.withCredentials = true;
    xhr.upload.onprogress = ev => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status === 200) {
        setDone(JSON.parse(xhr.responseText));
        setFile(null); setTitle("");
      } else {
        try { setError(JSON.parse(xhr.responseText).detail); }
        catch { setError("Upload failed."); }
      }
    };
    xhr.onerror = () => { setProgress(null); setError("Network error."); };
    xhr.send(fd);
  };

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <SectionHead color="var(--p-orange)">upload a track</SectionHead>
      <p className="muted" style={{ marginBottom: 24 }}>
        Accepted: MP3, FLAC, WAV, Opus · Max 300 MB · 2 GB quota
      </p>

      {done && (
        <div className="panel" style={{ marginBottom: 20, borderColor: "var(--p-green)" }}>
          <strong>"{done.title || title}" uploaded!</strong>
          <p className="muted" style={{ marginTop: 4 }}>
            It will appear on your profile after Navidrome scans it (usually within a minute).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel" style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Track title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My track name" required />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Audio file *</label>
          <input
            type="file"
            accept=".mp3,.flac,.wav,.opus"
            onChange={e => setFile(e.target.files[0])}
            style={{ padding: "6px 0", border: "none", background: "transparent" }}
            required
          />
        </div>
        {progress !== null && (
          <div>
            <div style={{ height: 10, background: "#fff", border: "2px solid #000" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--p-blue)" }} />
            </div>
            <p className="muted" style={{ marginTop: 4 }}>{progress}%</p>
          </div>
        )}
        {error && <p style={{ color: "var(--p-red)" }}>{error}</p>}
        <button className="bucket" type="submit" disabled={progress !== null}>
          {progress !== null ? "uploading…" : "upload"}
        </button>
      </form>
    </div>
  );
}
