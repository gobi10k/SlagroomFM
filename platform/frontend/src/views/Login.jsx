import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container page" style={{ maxWidth: 400 }}>
      <h1>Log in</h1>
      <form onSubmit={submit} className="card" style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <input type="email" value={form.email} onChange={set("email")} placeholder="Email" required />
        <input type="password" value={form.password} onChange={set("password")} placeholder="Password" required />
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        <button type="submit">Log in</button>
        <p className="muted" style={{ textAlign: "center" }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
