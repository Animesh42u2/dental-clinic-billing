import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CLINIC } from "./clinic";

const VIEW_LABEL = {
  "/": "Overview",
  "/invoice": "Invoice generator",
  "/reminder": "Appointment reminder generator",
};

export default function App() {
  const { pathname } = useLocation();
  const label = VIEW_LABEL[pathname] || "";
  const isHome = pathname === "/";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-brand">
          {CLINIC.name}
        </NavLink>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            Home
          </NavLink>
          <NavLink to="/invoice" className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            Invoice
          </NavLink>
          <NavLink to="/reminder" className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}>
            Follow-up
          </NavLink>
        </nav>
      </aside>

      <div className="page">
        <header className="header">
          <div className="brand">{CLINIC.name}</div>
          <div className="brand-sub">{label}</div>
        </header>
        <main className={isHome ? "main main-home" : "main"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}