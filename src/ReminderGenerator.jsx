import React, { useState } from "react";
import jsPDF from "jspdf";
import { CLINIC } from "./clinic";
import BackButton from "./BackButton";

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function formattedDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function weekdayName(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { weekday: "long" });
}
function emptyReminder() {
  return { patient: { name: "", mobile: "" }, opd: "", apptDate: "", apptTime: "", purpose: "", instructions: "" };
}

function buildReminderPdf({ patient, opd, apptDate, apptTime, purpose, instructions }) {
  const pageWidth = 297.5;
  const padding = 22;
  const left = padding;
  const right = pageWidth - padding;
  const contentWidth = right - left;

  const YELLOW_BG = [253, 224, 90];
  const DARK_TEXT = [30, 41, 30];
  const PANEL_BG = [255, 245, 205];

  function drawUnderlinedField(doc, label, value, labelX, valueX, lineEndX, yPos) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(label, labelX, yPos);
    doc.text(value || "-", valueX, yPos);
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.4);
    doc.line(valueX, yPos + 3, lineEndX, yPos + 3);
  }

  // Shrinks font size (down to a floor) until `text` fits within maxWidth.
  // Keeps long weekday names like "Wednesday"/"Thursday" from overflowing
  // the date panel the way shorter ones (Monday, Friday, Sunday) don't.
  function fitFontSize(doc, text, maxWidth, startSize, minSize, font, style) {
    let size = startSize;
    doc.setFont(font, style);
    doc.setFontSize(size);
    while (doc.getTextWidth(text) > maxWidth && size > minSize) {
      size -= 0.5;
      doc.setFontSize(size);
    }
    return size;
  }

  function drawContent(doc) {
    doc.setTextColor(...DARK_TEXT);

    let y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const title = "APPOINTMENT REMINDER";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, pageWidth / 2, y, { align: "center" });
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, y + 3, pageWidth / 2 + titleWidth / 2, y + 3);

    const boxTop = y + 22;
    const innerLeft = left + 14;
    const innerRight = right - 14;

    let cy = boxTop + 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(CLINIC.name.toUpperCase(), innerLeft, cy);

    cy += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(CLINIC.address, innerLeft, cy);

    if (CLINIC.phone) {
      cy += 12;
      doc.text(`Ph: ${CLINIC.phone}`, innerLeft, cy);
    }

    cy += 10;
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.7);
    doc.line(left, cy, right, cy);

    const fullLabelX = innerLeft;
    const fullValueX = innerLeft + 46;
    const fullLineEnd = innerRight;
    const col1LabelX = innerLeft;
    const col1ValueX = innerLeft + 46;
    const col1LineEnd = left + contentWidth * 0.5 - 10;
    const col2LabelX = left + contentWidth * 0.55;
    const col2ValueX = col2LabelX + 55;
    const col2LineEnd = innerRight;

    const rowGap = 18;
    let fy = cy + 20;
    drawUnderlinedField(doc, "Name", patient.name, fullLabelX, fullValueX, fullLineEnd, fy);

    fy += rowGap;
    drawUnderlinedField(doc, "Mob. No.", patient.mobile, col1LabelX, col1ValueX, col1LineEnd, fy);
    drawUnderlinedField(doc, "OPD No.", opd, col2LabelX, col2ValueX, col2LineEnd, fy);

    const fieldsBottom = fy + 16;

    let gy = fieldsBottom + 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const greeting = `Dear ${patient.name || "Patient"}, this is a reminder of your upcoming visit:`;
    const greetingLines = doc.splitTextToSize(greeting, contentWidth);
    doc.text(greetingLines, left, gy);
    gy += greetingLines.length * 12;

    const panelTop = gy + 12;
    const panelPadY = 16;
    const dateLabelSize = 8.5;
    const dateValueSize = 17;
    const timeValueSize = 13;
    const purposeSize = 9.5;

    let panelInnerY = panelTop + panelPadY + dateValueSize * 0.85 + 4;
    const dateLineY = panelInnerY;
    panelInnerY = dateLineY + dateValueSize + 6;
    const timeLineY = panelInnerY;
    let purposeLines = [];
    if (purpose && purpose.trim()) {
      panelInnerY = timeLineY + 16;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(purposeSize);
      purposeLines = doc.splitTextToSize(`For: ${purpose.trim()}`, contentWidth - 28);
      panelInnerY += purposeLines.length * 12;
    } else {
      panelInnerY = timeLineY + 8;
    }
    const panelBottom = panelInnerY + panelPadY - 8;

    doc.setFillColor(...PANEL_BG);
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.7);
    doc.roundedRect(left, panelTop, contentWidth, panelBottom - panelTop, 6, 6, "FD");
    doc.setLineDashPattern([3, 2], 0);
    doc.setLineWidth(1.2);
    doc.line(left + 14, panelTop + 8, left + 14, panelBottom - 8);
    doc.setLineDashPattern([], 0);

    const textX = left + 28;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(dateLabelSize);
    doc.text("DATE", textX, panelTop + panelPadY);

    const dateStr = apptDate ? `${weekdayName(apptDate)}, ${formattedDate(apptDate)}` : "To be confirmed";
    const maxDateWidth = (left + contentWidth - 14) - textX;
    const fittedDateSize = fitFontSize(doc, dateStr, maxDateWidth, dateValueSize, 12, "helvetica", "bold");
    doc.text(dateStr, textX, dateLineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(timeValueSize);
    doc.text(apptTime ? `Time: ${apptTime}` : "Time: to be confirmed", textX, timeLineY);

    if (purposeLines.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(purposeSize);
      doc.text(purposeLines, textX, timeLineY + 16);
    }

    let iy = panelBottom + 24;
    if (instructions && instructions.trim()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("Please note:", left, iy);
      iy += 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const noteLines = doc.splitTextToSize(instructions.trim(), contentWidth);
      doc.text(noteLines, left, iy);
      iy += noteLines.length * 12;
    }

    let cly = iy + 16;
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.6);
    doc.line(left, cly, right, cly);
    cly += 18;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.text("To reschedule, please contact the clinic ahead of time.", left, cly);
    cly += 16;
    doc.setFont("helvetica", "bold");
    doc.text(`— Team ${CLINIC.name}`, left, cly);

    return cly;
  }

  const measureDoc = new jsPDF({ unit: "pt", format: [pageWidth, 3000] });
  const lastY = drawContent(measureDoc);
  const contentHeight = Math.ceil(lastY + padding + 10);

  const doc = new jsPDF({ unit: "pt", format: [pageWidth, contentHeight] });
  const trueWidth = doc.internal.pageSize.getWidth();
  const trueHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...YELLOW_BG);
  doc.rect(0, 0, trueWidth, trueHeight, "F");
  drawContent(doc);

  const totalPages = doc.getNumberOfPages();
  for (let p = totalPages; p > 1; p--) doc.deletePage(p);

  return doc;
}

export default function ReminderGenerator() {
  const [form, setForm] = useState(emptyReminder());
  const [status, setStatus] = useState("");
  const { patient, opd, apptDate, apptTime, purpose, instructions } = form;

  const isValid = patient.name.trim() && patient.mobile.trim() && apptDate;

  function setPatient(field, value) { setForm({ ...form, patient: { ...patient, [field]: value } }); }
  function setField(field, value) { setForm({ ...form, [field]: value }); }

  function fileName() {
    return `Reminder-${patient.name.replace(/\s+/g, "_") || "patient"}-${apptDate || "date"}.pdf`;
  }

  function handleDownload() {
    const doc = buildReminderPdf(form);
    doc.save(fileName());
  }

  async function handleSendWhatsApp() {
    const doc = buildReminderPdf(form);
    const blob = doc.output("blob");
    const file = new File([blob], fileName(), { type: "application/pdf" });

    let phone = patient.mobile.replace(/[^\d]/g, "");
    if (phone.length === 10) phone = "91" + phone;
    const when = apptDate ? `${weekdayName(apptDate)}, ${formattedDate(apptDate)}` : "your upcoming visit";
    const text = `Reminder from ${CLINIC.name} — your appointment is on ${when}${apptTime ? ` at ${apptTime}` : ""}. See you soon!`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Appointment Reminder", text });
        setStatus("shared");
        return;
      } catch (err) {}
    }
    doc.save(fileName());
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    setStatus("fallback");
  }

  return (
    <>
    <BackButton />
      <section className="card form-card">
        <h2>Patient &amp; visit</h2>
        <div className="grid-2">
          <div className="field">
            <label>Patient name</label>
            <input value={patient.name} onChange={e => setPatient("name", e.target.value)} placeholder="Full name" />
          </div>
          <div className="field">
            <label>Mobile number</label>
            <input value={patient.mobile} onChange={e => setPatient("mobile", e.target.value)} placeholder="10-digit number" />
          </div>
          <div className="field">
            <label>OPD no.</label>
            <input value={opd} onChange={e => setField("opd", e.target.value)} placeholder="e.g. 108" />
          </div>
          <div className="field" />
          <div className="field">
            <label>Appointment date</label>
            <input type="date" value={apptDate} onChange={e => setField("apptDate", e.target.value)} />
          </div>
          <div className="field">
            <label>Appointment time</label>
            <input value={apptTime} onChange={e => setField("apptTime", e.target.value)} placeholder="e.g. 10:30 AM" />
          </div>
          <div className="field span-2">
            <label>Purpose / treatment</label>
            <input value={purpose} onChange={e => setField("purpose", e.target.value)} placeholder="e.g. Root canal follow-up" />
          </div>
          <div className="field span-2">
            <label>Instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={e => setField("instructions", e.target.value)}
              placeholder="e.g. Please come on an empty stomach. Bring your previous X-ray."
              rows={3}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn-secondary" disabled={!isValid} onClick={handleDownload}>Download PDF</button>
          <button className="btn-primary" disabled={!isValid} onClick={handleSendWhatsApp}>Send via WhatsApp</button>
        </div>
        {status === "shared" && <p className="note">Reminder PDF shared. Pick WhatsApp in the share sheet, if it wasn't already selected.</p>}
        {status === "fallback" && <p className="note">This browser can't share files directly. The PDF downloaded — attach it in the WhatsApp chat that just opened.</p>}
      </section>

      <section className="preview">
        <h2>Reminder preview</h2>
        <div className="slip">
          <div className="slip-title">Appointment Reminder</div>
          <div className="slip-clinic">
            <div className="slip-clinic-name">{CLINIC.name.toUpperCase()}</div>
            <div className="slip-clinic-addr">{CLINIC.address}</div>
            {CLINIC.phone && <div className="slip-clinic-phone">Ph: {CLINIC.phone}</div>}
          </div>
          <div className="slip-meta">
            <div><span>Name</span><em>{patient.name || "—"}</em></div>
            <div><span>Mob. No.</span><em>{patient.mobile || "—"}</em></div>
            <div><span>OPD No.</span><em>{opd || "—"}</em></div>
          </div>
          <div className="slip-greeting">
            Dear {patient.name || "Patient"}, this is a reminder of your upcoming visit:
          </div>
          <div className="slip-panel">
            <div className="slip-panel-label">DATE</div>
            <div className="slip-panel-date">
              {apptDate ? `${weekdayName(apptDate)}, ${formattedDate(apptDate)}` : "To be confirmed"}
            </div>
            <div className="slip-panel-time">
              {apptTime ? `Time: ${apptTime}` : "Time: to be confirmed"}
            </div>
            {purpose.trim() && <div className="slip-panel-purpose">For: {purpose}</div>}
          </div>
          {instructions.trim() && (
            <div className="slip-instructions">
              <strong>Please note:</strong> {instructions}
            </div>
          )}
          <div className="slip-closing">
            <div className="slip-reschedule">To reschedule, please contact the clinic ahead of time.</div>
            <div className="slip-signature">— Team {CLINIC.name}</div>
          </div>
        </div>
      </section>
    </>
  );
}