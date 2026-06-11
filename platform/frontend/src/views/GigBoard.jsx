import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function GigBoard() {
  const [gigs, setGigs] = useState([]);
  const [kind, setKind] = useState("");
  const [city, setCity] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const load = () => {
    const qs = new URLSearchParams();
    if (kind) qs.set("kind", kind);
    if (city) qs.set("city", city);
    fetch(`/api/gigs?${qs}`)
      .then(r => r.ok ? r.json() : [])
      .then(setGigs);
  };

  useEffect(load, [kind, city]);

  const handleDelete = async (id) => {
    await fetch(`/api/gigs/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <div className="container page">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Gig Board</h1>
        {user && (
          <button onClick={() => setShowForm(f => !f)}>
            {showForm ? "Cancel" : "+ Post"}
          </button>
        )}
      </div>

      {showForm && <PostGigForm onPosted={() => { setShowForm(false); load(); }} />}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select value={kind} onChange={e => setKind(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All</option>
          <option value="playing">Playing</option>
          <option value="looking">Looking</option>
        </select>
        <input
          value={city} onChange={e => setCity(e.target.value)}
          placeholder="Filter by city…" style={{ maxWidth: 200 }}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {gigs.length === 0 && <p className="muted">No gigs posted yet.</p>}
        {gigs.map(g => (
          <div key={g.id} className="card">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span className="badge" style={{ background: g.kind === "playing" ? "#16a34a" : "#b45309", flexShrink: 0 }}>
                {g.kind === "playing" ? "Playing" : "Looking"}
              </span>
              <div style={{ flex: 1 }}>
                <div>
                  <Link to={`/artists/${g.artist_slug}`} style={{ fontWeight: 600 }}>{g.display_name}</Link>
                  {" · "}
                  <strong>{g.title}</strong>
                </div>
                {g.body && <p style={{ marginTop: 6, fontSize: 14, color: "var(--text-muted)" }}>{g.body}</p>}
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  {[g.venue, g.city, g.date].filter(Boolean).join(" · ")}
                  {g.link && <> · <a href={g.link} target="_blank" rel="noreferrer">More info</a></>}
                </div>
              </div>
              {user && (user.id === g.user_id || user.role === "admin") && (
                <button className="ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleDelete(g.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostGigForm({ onPosted }) {
  const [form, setForm] = useState({ kind: "playing", title: "", body: "", venue: "", city: "", date: "", link: "" });
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/gigs", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) { setErr((await r.json()).detail); return; }
    onPosted();
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 24, display: "grid", gap: 10 }}>
      <h3>Post a gig</h3>
      <div className="grid-2">
        <select value={form.kind} onChange={set("kind")}>
          <option value="playing">Playing</option>
          <option value="looking">Looking for gigs</option>
        </select>
        <input value={form.title} onChange={set("title")} placeholder="Title *" required />
      </div>
      <textarea value={form.body} onChange={set("body")} placeholder="Description" rows={3} />
      <div className="grid-2">
        <input value={form.venue} onChange={set("venue")} placeholder="Venue" />
        <input value={form.city} onChange={set("city")} placeholder="City" />
      </div>
      <div className="grid-2">
        <input type="date" value={form.date} onChange={set("date")} />
        <input value={form.link} onChange={set("link")} placeholder="URL" />
      </div>
      {err && <p style={{ color: "#ef4444" }}>{err}</p>}
      <button type="submit">Post</button>
    </form>
  );
}
