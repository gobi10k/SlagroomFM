import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SectionHead } from "../components/paint/PaintBits";

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
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <SectionHead color="var(--p-green)">gig board</SectionHead>
        {user && (
          <button
            className="bucket"
            onClick={() => setShowForm(f => !f)}
            style={{ marginBottom: 16 }}
          >
            {showForm ? "cancel" : "+ post"}
          </button>
        )}
      </div>

      {showForm && (
        <PostGigForm onPosted={() => { setShowForm(false); load(); }} />
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 24, maxWidth: 420, flexWrap: "wrap" }}>
        <select value={kind} onChange={e => setKind(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">all</option>
          <option value="playing">playing</option>
          <option value="looking">looking</option>
        </select>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="filter by city…"
          style={{ maxWidth: 200 }}
        />
      </div>

      <div>
        {gigs.length === 0 && <p className="muted">no gigs posted yet.</p>}
        {gigs.map((g, i) => (
          <GigRow key={g.id} gig={g} i={i} onDelete={
            user && (user.id === g.user_id || user.role === "admin")
              ? () => handleDelete(g.id)
              : null
          } />
        ))}
      </div>
    </div>
  );
}

export function GigRow({ gig, i, onDelete }) {
  return (
    <div
      className="row"
      style={{ alignItems: "flex-start", transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)` }}
    >
      <span
        className="tag"
        style={{ background: gig.kind === "playing" ? "var(--p-green)" : "var(--p-orange)", flexShrink: 0 }}
      >
        {gig.kind === "playing" ? "PLAYING" : "LOOKING"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14 }}>
          <Link to={`/artists/${gig.artist_slug}`} style={{ fontWeight: 700 }}>{gig.display_name}</Link>
          {" · "}
          <strong>{gig.title}</strong>
        </div>
        {gig.body && (
          <p className="muted" style={{ marginTop: 6, maxWidth: 600 }}>{gig.body}</p>
        )}
        <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>
          {[gig.venue, gig.city, gig.date].filter(Boolean).join(" · ")}
          {gig.link && <> · <a href={gig.link} target="_blank" rel="noreferrer">more info</a></>}
        </div>
      </div>
      {onDelete && (
        <button style={{ padding: "4px 10px", fontSize: 12, flexShrink: 0 }} onClick={onDelete}>
          ×
        </button>
      )}
    </div>
  );
}

function PostGigForm({ onPosted }) {
  const [form, setForm] = useState({ kind: "playing", title: "", body: "", venue: "", city: "", date: "", link: "" });
  const [err, setErr] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

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
    <form onSubmit={submit} className="panel" style={{ marginBottom: 28, display: "grid", gap: 10, maxWidth: 640 }}>
      <span className="px" style={{ fontSize: 16 }}>post a gig</span>
      <div className="grid-2">
        <select value={form.kind} onChange={set("kind")}>
          <option value="playing">playing</option>
          <option value="looking">looking for gigs</option>
        </select>
        <input value={form.title} onChange={set("title")} placeholder="title *" required />
      </div>
      <textarea value={form.body} onChange={set("body")} placeholder="description" rows={3} />
      <div className="grid-2">
        <input value={form.venue} onChange={set("venue")} placeholder="venue" />
        <input value={form.city} onChange={set("city")} placeholder="city" />
      </div>
      <div className="grid-2">
        <input type="date" value={form.date} onChange={set("date")} />
        <input value={form.link} onChange={set("link")} placeholder="URL" />
      </div>
      {err && <p style={{ color: "var(--p-red)" }}>{err}</p>}
      <button className="bucket" type="submit">post</button>
    </form>
  );
}
