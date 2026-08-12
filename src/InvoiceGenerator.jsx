import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import { CLINIC } from "./clinic";
import BackButton from "./BackButton";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return (h ? ONES[h] + " hundred" + (rest ? " " : "") : "") + (rest ? twoDigits(rest) : "");
}
function numberToIndianWords(num) {
  num = Math.round(num);
  if (num === 0) return "zero";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  let parts = [];
  if (crore) parts.push(threeDigits(crore) + " crore");
  if (lakh) parts.push(threeDigits(lakh) + " lakh");
  if (thousand) parts.push(threeDigits(thousand) + " thousand");
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function emptyRow() { return { id: crypto.randomUUID(), desc: "", when: "", price: "" }; }
function formattedDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function buildInvoicePdf({ patient, opd, date, rows, total }) {
  const pageWidth = 297.5;
  const padding = 22;
  const left = padding;
  const right = pageWidth - padding;
  const contentWidth = right - left;

  const YELLOW_BG = [253, 224, 90];
  const DARK_TEXT = [30, 41, 30];

  const filteredRows = rows.filter(r => r.desc.trim());

  const col2X = left + contentWidth * 0.52;
  const col3X = left + contentWidth * 0.78;

  function drawUnderlinedField(doc, label, value, labelX, valueX, lineEndX, yPos) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(label, labelX, yPos);
    doc.text(value || "-", valueX, yPos);
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.4);
    doc.line(valueX, yPos + 3, lineEndX, yPos + 3);
  }

  function drawContent(doc) {
    doc.setTextColor(...DARK_TEXT);

    let y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const title = "BILL / CASH MEMO";
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
    drawUnderlinedField(doc, "Address", patient.address, fullLabelX, fullValueX, fullLineEnd, fy);

    fy += rowGap;
    drawUnderlinedField(doc, "Mob. No.", patient.mobile, col1LabelX, col1ValueX, col1LineEnd, fy);
    drawUnderlinedField(doc, "OPD No.", opd, col2LabelX, col2ValueX, col2LineEnd, fy);

    fy += rowGap;
    drawUnderlinedField(doc, "Date", formattedDate(date), col1LabelX, col1ValueX, col1LineEnd, fy);

    const boxBottom = fy + 16;

    const tableTop = boxBottom + 22;
    const headerRowH = 22;
    const dataRowH = 18;
    const totalRowH = 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const headerTextY = tableTop + 15;
    doc.text("Treatment", left + 6, headerTextY);
    doc.text("Appt. date", col2X + 6, headerTextY);
    doc.text("Price", right - 6, headerTextY, { align: "right" });

    const headerBottom = tableTop + headerRowH;
    let rowY = headerBottom;
    doc.setFont("helvetica", "normal");

    filteredRows.forEach(r => {
      const textY = rowY + 13;
      doc.text(r.desc, left + 6, textY, { maxWidth: col2X - left - 12 });
      doc.text(formattedDate(r.when) || "-", col2X + 6, textY);
      doc.text(r.price ? Number(r.price).toLocaleString("en-IN") : "-", right - 6, textY, { align: "right" });
      rowY += dataRowH;
    });

    const dataBottom = rowY;
    const totalY = dataBottom + 15;
    doc.setFont("helvetica", "italic");
    doc.text("Total", col3X - 6, totalY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rs ${total.toLocaleString("en-IN")}`, right - 6, totalY, { align: "right" });

    const tableBottom = dataBottom + totalRowH;

    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.5);
    doc.line(left, tableTop, right, tableTop);
    doc.line(left, headerBottom, right, headerBottom);
    let hy = headerBottom;
    filteredRows.forEach(() => {
      hy += dataRowH;
      doc.line(left, hy, right, hy);
    });
    doc.line(left, tableBottom, right, tableBottom);
    doc.line(left, tableTop, left, tableBottom);
    doc.line(col2X, tableTop, col2X, tableBottom);
    doc.line(col3X, tableTop, col3X, tableBottom);
    doc.line(right, tableTop, right, tableBottom);

    let wy = tableBottom + 26;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    const wordsText = `Rupees ${total > 0 ? capitalize(numberToIndianWords(total)) + " only" : "…………………………"}`;
    const wordLines = doc.splitTextToSize(wordsText, contentWidth);
    doc.text(wordLines, left, wy);
    wy += wordLines.length * 12;
    doc.setDrawColor(...DARK_TEXT);
    doc.setLineWidth(0.6);
    doc.line(left, wy, right, wy);

    return wy;
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
  for (let p = totalPages; p > 1; p--) {
    doc.deletePage(p);
  }

  return doc;
}

export default function InvoiceGenerator() {
  const [patient, setPatient] = useState({ name: "", address: "", mobile: "" });
  const [opd, setOpd] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([emptyRow()]);
  const [status, setStatus] = useState("");

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0),
    [rows]
  );
  const isValid = patient.name.trim() && patient.mobile.trim() && rows.some(r => r.desc.trim() && r.price);

  function updateRow(id, field, value) {
    setRows(rows.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function addRow() { setRows([...rows, emptyRow()]); }
  function removeRow(id) { if (rows.length > 1) setRows(rows.filter(r => r.id !== id)); }

  function fileName() {
    return `Invoice-${patient.name.replace(/\s+/g, "_") || "patient"}-${date}.pdf`;
  }

  function handleDownload() {
    const doc = buildInvoicePdf({ patient, opd, date, rows, total });
    doc.save(fileName());
  }

  async function handleSendWhatsApp() {
    const doc = buildInvoicePdf({ patient, opd, date, rows, total });
    const blob = doc.output("blob");
    const file = new File([blob], fileName(), { type: "application/pdf" });

    let phone = patient.mobile.replace(/[^\d]/g, "");
    if (phone.length === 10) phone = "91" + phone;
    const text = `Invoice from ${CLINIC.name} — total Rs ${total.toLocaleString("en-IN")}. Thank you for visiting us.`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Invoice", text });
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
            <input value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="field">
            <label>Mobile number</label>
            <input value={patient.mobile} onChange={e => setPatient({ ...patient, mobile: e.target.value })} placeholder="10-digit number" />
          </div>
          <div className="field span-2">
            <label>Address</label>
            <input value={patient.address} onChange={e => setPatient({ ...patient, address: e.target.value })} placeholder="Village / town, district" />
          </div>
          <div className="field">
            <label>OPD no.</label>
            <input value={opd} onChange={e => setOpd(e.target.value)} placeholder="e.g. 108" />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <h2>Treatment lines</h2>
        {rows.map((r, i) => (
          <div className="row-grid" key={r.id}>
            <div className="field">
              {i === 0 && <label>Description</label>}
              <input value={r.desc} onChange={e => updateRow(r.id, "desc", e.target.value)} placeholder="e.g. Root canal — upper molar" />
            </div>
            <div className="field">
              {i === 0 && <label>Appt. date</label>}
              <input type="date" value={r.when} onChange={e => updateRow(r.id, "when", e.target.value)} />
            </div>
            <div className="field">
              {i === 0 && <label>Price (₹)</label>}
              <input type="number" value={r.price} onChange={e => updateRow(r.id, "price", e.target.value)} placeholder="0" />
            </div>
            <button className="icon-btn" disabled={rows.length === 1} onClick={() => removeRow(r.id)}>×</button>
          </div>
        ))}
        <button className="link-btn" onClick={addRow}>+ Add treatment line</button>

        <div className="actions">
          <button className="btn-secondary" disabled={!isValid} onClick={handleDownload}>Download PDF</button>
          <button className="btn-primary" disabled={!isValid} onClick={handleSendWhatsApp}>Send via WhatsApp</button>
        </div>
        {status === "shared" && <p className="note">Invoice PDF shared. Pick WhatsApp in the share sheet, if it wasn't already selected.</p>}
        {status === "fallback" && <p className="note">This browser can't share files directly. The PDF downloaded — attach it in the WhatsApp chat that just opened.</p>}
      </section>

      <section className="preview">
        <h2>Invoice preview</h2>
        <div className="bill">
          <div className="bill-title">Bill / Cash Memo</div>
          <div className="bill-clinic">
            <div className="bill-clinic-name">{CLINIC.name.toUpperCase()}</div>
            <div className="bill-clinic-addr">{CLINIC.address}</div>
          </div>
          <div className="bill-meta">
            <div><span>Name</span><em>{patient.name || "—"}</em></div>
            <div><span>Address</span><em>{patient.address || "—"}</em></div>
            <div><span>Mob. No.</span><em>{patient.mobile || "—"}</em></div>
            <div><span>OPD No.</span><em>{opd || "—"}</em></div>
            <div><span>Date</span><em>{formattedDate(date)}</em></div>
          </div>
          <table className="bill-table">
            <thead><tr><th>Treatment</th><th>Appt. date</th><th>Price</th></tr></thead>
            <tbody>
              {rows.filter(r => r.desc.trim()).map(r => (
                <tr key={r.id}>
                  <td>{r.desc}</td>
                  <td>{formattedDate(r.when)}</td>
                  <td className="right">{r.price ? Number(r.price).toLocaleString("en-IN") : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={2} className="right italic">Total</td><td className="right bold">₹ {total.toLocaleString("en-IN")}</td></tr>
            </tfoot>
          </table>
          <div className="bill-words">
            Rupees {total > 0 ? capitalize(numberToIndianWords(total)) + " only" : "…………………………"}
          </div>
        </div>
      </section>
    </>
  );
}