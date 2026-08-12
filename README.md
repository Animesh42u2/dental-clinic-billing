# Anupama Dental Clinic — reception invoice app

A React app that mirrors the clinic's paper bill pad: the receptionist fills a form,
sees a live invoice preview, downloads it as a PDF, and can push it to the patient's
WhatsApp.

## Run it

```
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## What's actually happening

- **Form → live preview**: every keystroke updates the yellow invoice card, styled
  after the clinic's physical cash-memo pad.
- **Download PDF**: built client-side with `jsPDF` — no server involved.
- **Send via WhatsApp**: uses the browser's native **Web Share API**
  (`navigator.share`) to hand the generated PDF straight to installed apps,
  including WhatsApp, on phones/browsers that support sharing files
  (Android Chrome, iOS Safari 15+). If the browser doesn't support file
  sharing, it falls back to downloading the PDF and opening a `wa.me` chat
  with the invoice text pre-filled, and the receptionist attaches the PDF
  by hand.

## The honest limit of "frontend only"

There is no way for JavaScript running in a browser tab to silently send a
WhatsApp message with an attachment on the clinic's behalf — WhatsApp has no
public web endpoint for that, by design (spam prevention). Two real options
exist, and only one is fully automatic:

| Approach | Automatic? | Needs a backend? |
|---|---|---|
| `wa.me` link + manual attach (what the fallback above does) | No — receptionist taps once | No |
| Web Share API (what the primary flow above does) | Mostly — one tap in the OS share sheet | No |
| **WhatsApp Business Cloud API** | Yes, fully | **Yes** |

If you want the patient to receive the PDF the instant the receptionist
clicks "save," with zero taps on their end, you need the WhatsApp Business
Cloud API, which requires a server component. Below is how that piece would
be added on top of this same React frontend.

## Adding true automatic delivery (WhatsApp Business Cloud API)

1. **Create a Meta developer app and WhatsApp Business account**
   - Go to developers.facebook.com, create an app, add the "WhatsApp"
     product, and set up a WhatsApp Business Account (WABA) with a verified
     phone number.
2. **Get credentials**: a permanent access token, the phone number ID, and
   the WABA ID.
3. **Add a small backend** (Node/Express is simplest — it can live in the
   same repo under `/server`):
   - An endpoint like `POST /api/send-invoice` that receives the invoice
     data (or the generated PDF) from the React app.
   - The server generates the PDF (reuse the `jsPDF`/layout logic, or
     render the same data with `puppeteer`/`pdf-lib` server-side).
   - The server uploads the PDF to WhatsApp's Media endpoint, then calls
     the Cloud API's `/messages` endpoint referencing that media ID, sent
     to the patient's number.
   - Note: sending a document to a number that hasn't messaged the
     business in the last 24 hours requires a pre-approved **message
     template** (e.g. "Your invoice from {{clinic}} is attached").
     Free-form documents only work inside that 24-hour session window.
4. **Wire the frontend to it**: replace `handleSendWhatsApp` with a `fetch`
   call to `/api/send-invoice`, passing the form data. The UI stays
   identical — only the button's handler changes.
5. **Approve a message template** in Meta Business Manager (takes a few
   hours to a couple of days for review).
6. **Go live**: Meta requires business verification before you can message
   numbers outside a small testing list.

This is a real, ongoing integration (and WhatsApp bills per conversation
after a free tier), so it's worth confirming the clinic wants that before
building the server piece — the Web Share fallback already gets a PDF into
WhatsApp in one tap on most phones, at zero infrastructure cost.

## Project structure

```
dental-reception/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx        # form, preview, PDF, WhatsApp logic
    └── index.css
```
