import { useEffect, useState } from "react";

const ADMIN_TOKEN_KEY = "radio_admin_token";

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState(token);
  const [slots, setSlots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [harbor, setHarbor] = useState(null);
  const [skipMsg, setSkipMsg] = useState("");

  const headers = { "X-Admin-Token": token, "Content-Type": "application/json" };

  const loadSlots = () => {
    if (!token) return;
    fetch("/radio/api/slots", { headers }).then(r => r.ok ? r.json() : []).then(setSlots).catch(() => {});
    fetch("/radio/api/harbor-status", { headers }).then(r => r.ok ? r.json() : null).then(setHarbor).catch(() => {});
  };

  useEffect(loadSlots, [token]);

  const saveToken = () => { localStorage.setItem(ADMIN_TOKEN_KEY, tokenInput); setToken(tokenInput); };

  const deleteSlot = async (id) => {
    await fetch(`/radio/api/slots/${id}`, { method: "DELETE", headers });
    loadSlots();
  };

  const skip = async () => {
    const r = await fetch("/radio/api/skip", { method: "POST", headers });
    const d = await r.json();
    setSkipMsg(d.response || "Skipped");
    setTimeout(() => setSkipMsg(""), 3000);
  };

  const cueNow = () => {
    const now = Math.floor(Date.now() / 1000);
    setEditing({ title: "", kind: "file", path: "", start_ts: now, end_ts: now + 3600, color: "#a855f7", notes: "" });
    setShowForm(true);
  };

  return (
    <div className="container" style={{ padding: "32px 20px" }}>
      <h1>Radio Admin</h1>

      {!token && (
        <div className="card" style={{ maxWidth: 360, marginBottom: 24 }}>
          <p className="muted" style={{ marginBottom: 10 }}>Enter admin token to manage the schedule.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Admin token" />
            <button onClick={saveToken}>OK</button>
          </div>
        </div>
      )}

      {token && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <button onClick={cueNow}>+ Cue now</button>
            <button onClick={() => { setEditing(null); setShowForm(true); }}>+ New slot</button>
            <button className="ghost" onClick={skip}>⏭ Skip</button>
            {harbor && (
              <span className="muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Harbor: {harbor.live ? <span className="badge live">LIVE</span> : "standby"}
              </span>
            )}
            {skipMsg && <span className="muted">{skipMsg}</span>}
          </div>

          {showForm && (
            <SlotForm
              initial={editing}
              headers={headers}
              onSaved={() => { setShowForm(false); setEditing(null); loadSlots(); }}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {slots.length === 0 && <p className="muted">No slots scheduled.</p>}
            {slots.map(slot => (
              <div key={slot.id} className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 4, height: 40, borderRadius: 2, background: slot.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div><strong>{slot.title}</strong> <span className="muted">({slot.kind})</span></div>
                  <div className="muted">
                    {fmtTs(slot.start_ts)} → {fmtTs(slot.end_ts)}
                    {slot.path && <> · <code style={{ fontSize: 11 }}>{slot.path}</code></>}
                  </div>
                </div>
                <button className="ghost" style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={() => { setEditing(slot); setShowForm(true); }}>Edit</button>
                <button className="ghost" style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={() => deleteSlot(slot.id)}>Delete</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlotForm({ initial, headers, onSaved, onCancel }) {
  const blank = { title: "", kind: "file", path: "", start_ts: Math.floor(Date.now() / 1000), end_ts: Math.floor(Date.now() / 1000) + 3600, color: "#a855f7", notes: "" };
  const [form, setForm] = useState(initial || blank);
  const [err, setErr] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setTs = k => e => setForm(f => ({ ...f, [k]: Math.floor(new Date(e.target.value).getTime() / 1000) }));
  const toDatetimeLocal = ts => new Date(ts * 1000).toISOString().slice(0, 16);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/radio/api/slots/${form.id}` : "/radio/api/slots";
    const r = await fetch(url, { method, headers, body: JSON.stringify(form) });
    if (!r.ok) { setErr((await r.json()).detail); return; }
    onSaved();
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 24, display: "grid", gap: 12 }}>
      <h3>{form.id ? "Edit slot" : "New slot"}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input value={form.title} onChange={set("title")} placeholder="Title *" required />
        <select value={form.kind} onChange={set("kind")}>
          <option value="file">Single file</option>
          <option value="folder">Folder (auto-sequence)</option>
          <option value="live_placeholder">Live placeholder</option>
        </select>
      </div>
      {form.kind !== "live_placeholder" && (
        <input value={form.path || ""} onChange={set("path")} placeholder="/mnt/ssd/radio/shows/my-show or file.mp3" />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Start</label>
          <input type="datetime-local" value={toDatetimeLocal(form.start_ts)} onChange={setTs("start_ts")} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>End</label>
          <input type="datetime-local" value={toDatetimeLocal(form.end_ts)} onChange={setTs("end_ts")} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
        <input type="color" value={form.color} onChange={set("color")} style={{ height: 40, padding: 2 }} />
        <input value={form.notes || ""} onChange={set("notes")} placeholder="Notes (optional)" />
      </div>
      {err && <p style={{ color: "#ef4444" }}>{err}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit">Save</button>
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function fmtTs(ts) {
  return new Date(ts * 1000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
