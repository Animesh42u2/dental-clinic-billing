import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ to = "/", label = "Back to Home" }) {
  const navigate = useNavigate();
  return (
    <div className="page-topbar">
      <button className="back-btn" onClick={() => navigate(to)}>
        <span aria-hidden="true">←</span> {label}
      </button>
    </div>
  );
}