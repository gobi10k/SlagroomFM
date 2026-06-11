import { Routes, Route, NavLink } from "react-router-dom";
import Public from "./views/Public";
import Admin from "./views/Admin";

export default function App() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? "var(--accent)" : "var(--text-muted)",
    fontWeight: isActive ? 600 : 400,
  });
  return (
    <>
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 24, height: 52 }}>
          <a href="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>SlagroomFM</a>
          <NavLink to="/" end style={linkStyle}>Schedule</NavLink>
          <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/"      element={<Public />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}
