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
      <header className="header">
        <NavLink to="/" className="brand">
          {CLINIC.name}
        </NavLink>
        <div className="brand-sub">{label}</div>
      </header>
      <main className={isHome ? "main main-home" : "main"}>
        <Outlet />
      </main>
    </div>
  );
}