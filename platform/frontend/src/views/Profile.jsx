import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { SectionHead } from "../components/paint/PaintBits";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ display_name: "", bio: "", links_json: "[]" });
  const [uploads, setUploads] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || "",
        bio: user.bio || "",
        links_json: user.links_json || "[]",
      });
      fetch("/api/uploads", { credentials: "include" })
        .then(r => r.ok ? r.json() : []).then(setUploads).catch(() => {});
    }
  }, [user]);

  if (user === undefined) return <div className="container page"><p className="muted">Loading…</p></div>;
  if (!user) return (
    <div className="container page">
      <p className="muted"><Link to="/login">Log in</Link> to view your profile.</p>
    </div>
  );

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError(""); setSaved(false);
    const r = await fetch("/api/auth/me", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) { setError((await r.json()).detail); return; }
    setUser(u => ({ ...u, ...form }));
    setSaved(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="container page" style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <SectionHead color="var(--p-orange)">profile</SectionHead>
        <button onClick={handleLogout} style={{ marginBottom: 16 }}>log out</button>
      </div>
      <p className="muted" style={{ marginBottom: 20 }}>
        logged in as {user.display_name} ({user.role})
      </p>

      <form onSubmit={save} className="panel" style={{ display: "grid", gap: 14, marginBottom: 36 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Display name</label>
          <input value={form.display_name} onChange={set("display_name")} required />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>Bio</label>
          <textarea value={form.bio} onChange={set("bio")} rows={4} placeholder="Tell people about your music…" />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
            Links (JSON array of {`{"label":"…","url":"…"}`})
          </label>
          <textarea
            value={form.links_json}
            onChange={set("links_json")}
            rows={3}
            placeholder='[{"label":"Bandcamp","url":"https://…"}]'
          />
        </div>
        {error && <p style={{ color: "var(--p-red)" }}>{error}</p>}
        {saved && <p style={{ color: "var(--p-green)" }}>Saved!</p>}
        <button className="bucket" type="submit">save changes</button>
      </form>

      <SectionHead color="var(--p-blue)">your uploads</SectionHead>
      {uploads.length === 0 ? (
        <p className="muted">No uploads yet. <Link to="/upload">Upload a track →</Link></p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {uploads.map(u => (
            <div key={u.id} className="row" style={{ justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{u.title}</span>
              <span
                className="tag"
                style={{ background: u.status === "scanned" ? "var(--p-green)" : "var(--p-orange)" }}
              >
                {u.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
