import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Home from "./Home.jsx";
import InvoiceGenerator from "./InvoiceGenerator.jsx";
import ReminderGenerator from "./ReminderGenerator.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="invoice" element={<InvoiceGenerator />} />
          <Route path="reminder" element={<ReminderGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);