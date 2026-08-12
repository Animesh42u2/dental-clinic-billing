import React from "react";
import { useNavigate } from "react-router-dom";
import { CLINIC } from "./clinic";
import LottieIcon from "./LottieIcon";

// swap these for the URLs you grab from LottieFiles
const HERO_LOTTIE = "https://lottie.host/98a5d21c-1f94-411d-ac78-c46d53919000/fpWJRnrgGZ.json";
const INVOICE_LOTTIE = "https://lottie.host/eec3f7bd-cdeb-4c6e-aa84-d24c420dcb52/5hgRJjRtN5.json";
const REMINDER_LOTTIE = "https://lottie.host/5d6ffeb2-6042-472b-b48a-b1866cdc2cf8/E0o0jfQRXW.json";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home">
      <div className="home-welcome">
        <LottieIcon src={HERO_LOTTIE} className="home-hero" />
        <h1>Welcome back</h1>
        <p>What would you like to do today, {CLINIC.name}?</p>
      </div>
      <div className="home-cards">
        <button className="home-card" onClick={() => navigate("/invoice")}>
          <LottieIcon src={INVOICE_LOTTIE} size={44} className="home-card-icon" />
          <div className="home-card-title">New Invoice</div>
          <div className="home-card-sub">Bill a patient for today's treatment</div>
        </button>
        <button className="home-card" onClick={() => navigate("/reminder")}>
          <LottieIcon src={REMINDER_LOTTIE} size={44} className="home-card-icon" />
          <div className="home-card-title">Send Reminder</div>
          <div className="home-card-sub">Notify a patient about an upcoming visit</div>
        </button>
      </div>
    </div>
  );
}