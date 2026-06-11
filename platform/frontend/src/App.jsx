import { Routes, Route, NavLink } from "react-router-dom";
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
import { LogoMark } from "./components/paint/PaintBits";

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Nav />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/browse"        element={<Browse />} />
          <Route path="/artists/:slug" element={<Artist />} />
          <Route path="/gigs"          element={<GigBoard />} />
          <Route path="/upload"        element={<Upload />} />
          <Route path="/profile"       element={<Profile />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
        </Routes>
        <PlayerBar />
      </PlayerProvider>
    </AuthProvider>
  );
}

const NAV_COLORS = {
  "/":        "var(--p-yellow)",
  "/browse":  "var(--p-cyan)",
  "/gigs":    "var(--p-green)",
  "/upload":  "var(--p-orange)",
  "/profile": "var(--p-orange)",
};

function NavBtn({ to, color, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "inline-block",
        textDecoration: "none",
      })}
    >
      {({ isActive }) => (
        <button
          className={isActive ? "pressed" : ""}
          style={isActive ? { background: color } : {}}
        >
          {children}
        </button>
      )}
    </NavLink>
  );
}

function Nav() {
  return (
    <nav style={{ background: "#fff", borderBottom: "2px solid #000" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px", flexWrap: "wrap" }}>
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: 8 }}>
          <LogoMark />
          <span className="px" style={{ fontSize: 26, color: "#000" }}>SlagroomFM</span>
        </NavLink>
        <NavBtn to="/"       color="var(--p-yellow)" end>home</NavBtn>
        <NavBtn to="/browse" color="var(--p-cyan)">browse</NavBtn>
        <NavBtn to="/gigs"   color="var(--p-green)">gigs</NavBtn>
        <NavBtn to="/upload" color="var(--p-orange)">upload</NavBtn>
        <div style={{ flex: 1 }} />
        <NavBtn to="/profile" color="var(--p-orange)">profile</NavBtn>
        <a href="/radio" style={{ textDecoration: "none" }}>
          <button>radio ↗</button>
        </a>
      </div>
    </nav>
  );
}
