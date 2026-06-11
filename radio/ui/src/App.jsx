import { Routes, Route, NavLink } from "react-router-dom";
import Public from "./views/Public";
import Admin from "./views/Admin";
import { LogoMark } from "./components/paint/PaintBits";

export default function App() {
  return (
    <>
      <nav style={{ background: "#fff", borderBottom: "2px solid #000" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px", flexWrap: "wrap" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: 8 }}>
            <LogoMark />
            <span className="px" style={{ fontSize: 26, color: "#000" }}>SlagroomFM</span>
          </a>
          <NavBtn to="/" color="var(--p-red)" end>schedule</NavBtn>
          <NavBtn to="/admin" color="var(--p-orange)">admin</NavBtn>
        </div>
      </nav>
      <Routes>
        <Route path="/"      element={<Public />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}

function NavBtn({ to, color, children, end }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
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
