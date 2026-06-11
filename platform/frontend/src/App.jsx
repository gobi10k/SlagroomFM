import { Routes, Route, Link, NavLink } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { PlayerProvider } from "./hooks/usePlayer";
import PlayerBar from "./components/PlayerBar";
import Home from "./views/Home";
import Browse from "./views/Browse";
import Artist from "./views/Artist";
import GigBoard from "./views/GigBoard";
import Upload from "./views/Upload";
import Profile from "./views/Profile";
import Login from "./views/Login";
import Register from "./views/Register";

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Nav />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/browse"      element={<Browse />} />
          <Route path="/artists/:slug" element={<Artist />} />
          <Route path="/gigs"        element={<GigBoard />} />
          <Route path="/upload"      element={<Upload />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
        </Routes>
        <PlayerBar />
      </PlayerProvider>
    </AuthProvider>
  );
}

function Nav() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? "var(--accent)" : "var(--text-muted)",
    fontWeight: isActive ? 600 : 400,
  });
  return (
    <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 24, height: 52 }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>
          SlagroomFM
        </Link>
        <NavLink to="/browse" style={linkStyle}>Browse</NavLink>
        <NavLink to="/gigs"   style={linkStyle}>Gigs</NavLink>
        <NavLink to="/upload" style={linkStyle}>Upload</NavLink>
        <div style={{ flex: 1 }} />
        <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
        <a href="/radio" style={{ color: "var(--text-muted)", fontSize: 14 }}>Radio ↗</a>
      </div>
    </nav>
  );
}
