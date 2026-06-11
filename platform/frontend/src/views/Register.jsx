import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", display_name: "", artist_slug: "", role: "listener" });
  const [error, setError] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/auth/register", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) { setError((await r.json()).detail); return; }
    const data = await r.json();
    setUser(data);
    navigate("/profile");
  };

  return (
    <div className="container page" style={{ maxWidth: 440 }}>
      <h1>Create account</h1>
      <form onSubmit={submit} className="card" style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <input type="email" value={form.email} onChange={set("email")} placeholder="Email *" required />
        <input type="password" value={form.password} onChange={set("password")} placeholder="Password (min 8 chars) *" required />
        <input value={form.display_name} onChange={set("display_name")} placeholder="Display name *" required />
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Account type</label>
          <select value={form.role} onChange={set("role")}>
            <option value="listener">Listener</option>
            <option value="artist">Artist (can upload tracks)</option>
          </select>
        </div>
        {form.role === "artist" && (
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Artist URL slug</label>
            <input
              value={form.artist_slug} onChange={set("artist_slug")}
              placeholder="e.g. my-band-name"
              pattern="[a-z0-9-]{2,40}"
              title="Lowercase letters, numbers, hyphens (2–40 chars)"
            />
          </div>
        )}
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        <button type="submit">Register</button>
        <p className="muted" style={{ textAlign: "center" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
