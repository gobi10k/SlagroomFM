import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { SectionHead } from "../components/paint/PaintBits";

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
      <SectionHead color="var(--p-blue)">log in</SectionHead>
      <form onSubmit={submit} className="panel" style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <input type="email" value={form.email} onChange={set("email")} placeholder="email" required />
        <input type="password" value={form.password} onChange={set("password")} placeholder="password" required />
        {error && <p style={{ color: "var(--p-red)" }}>{error}</p>}
        <button className="bucket" type="submit">log in</button>
        <p className="muted" style={{ textAlign: "center" }}>
          no account? <Link to="/register">register</Link>
        </p>
      </form>
    </div>
  );
}
