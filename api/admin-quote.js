const PDFDocument = require("pdfkit");
const { getAccessToken, calendarId, CALENDAR_API } = require("../lib/google");

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = req.headers["x-admin-password"];
  if (!expected) throw new Error("Configuration manquante : ADMIN_PASSWORD");
  return typeof provided === "string" && provided === expected;
}

function parseDescription(description = "") {
  const get = (label) => {
    const m = description.match(new RegExp(`^${label}\\s*:\\s*(.+)$`, "mi"));
    return m ? m[1].trim() : "";
  };
  const projectMatch = description.match(/Projet\\s*:\\s*\\n([\\s\\S]*?)(?:\\n\\nRéservation effectuée|$)/i);
  return {
    prospect: get("Prospect"),
    email: get("E-mail"),
    type: get("Type"),
    project: projectMatch ? projectMatch[1].trim() : ""
  };
}

function money(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDateFr(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris"
  }).format(value);
}

function cleanText(value, max = 4000) {
  return String(value || "").replace(/[\\u0000-\\u001F\\u007F]/g, " ").slice(0, max);
}

function safeFilename(value) {
  return String(value || "client")
    .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "client";
}

async function getEvent(accessToken, eventId) {
  const r = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const event = await r.json();
  if (!r.ok) throw new Error(`Google Calendar lecture [HTTP ${r.status}]`);
  return event;
}

async function markQuoteSent(accessToken, event, crmNotes, amount, quoteNumber) {
  const existingPrivate = event.extendedProperties?.private || {};
  const patchBody = {
    extendedProperties: {
      private: {
        ...existingPrivate,
        crmStatus: "Devis envoyé",
        crmNotes: String(crmNotes || existingPrivate.crmNotes || "").slice(0, 4000),
        crmEstimatedAmount: String(Number(amount || 0)),
        quoteNumber,
        quoteGeneratedAt: new Date().toISOString()
      }
    }
  };

  const r = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(event.id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patchBody)
    }
  );
  if (!r.ok) throw new Error(`Google Calendar mise à jour [HTTP ${r.status}]`);
}

function drawDivider(doc, y) {
  doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor("#D9E2EC").stroke();
}

function buildPdf({ event, meta, quoteNumber, amountHT, vatRate, validityDays, description }) {
  const vat = amountHT * (vatRate / 100);
  const total = amountHT + vat;
  const createdAt = new Date();
  const validUntil = new Date(createdAt.getTime() + validityDays * 86400000);

  const issuerName = cleanText(process.env.QUOTE_ISSUER_NAME || "Kabakaro Keita", 120);
  const issuerTitle = cleanText(process.env.QUOTE_ISSUER_TITLE || "Développeur web & mobile", 160);
  const issuerEmail = cleanText(process.env.QUOTE_ISSUER_EMAIL || "kabakaro16@gmail.com", 160);
  const issuerPhone = cleanText(process.env.QUOTE_ISSUER_PHONE || "", 80);
  const issuerAddress = cleanText(process.env.QUOTE_ISSUER_ADDRESS || "", 220);

  const clientName = cleanText(meta.prospect || event.attendees?.[0]?.displayName || "Client", 160);
  const clientEmail = cleanText(meta.email || event.attendees?.[0]?.email || "", 160);
  const service = cleanText(description || meta.type || "Prestation web / mobile", 800);
  const project = cleanText(meta.project || "", 1400);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 45, left: 50, right: 50, bottom: 50 },
    info: {
      Title: `Devis ${quoteNumber}`,
      Author: issuerName,
      Subject: `Devis pour ${clientName}`
    }
  });

  const chunks = [];
  doc.on("data", chunk => chunks.push(chunk));

  doc.fillColor("#0B1F33").font("Helvetica-Bold").fontSize(25).text("DEVIS", 50, 45);
  doc.font("Helvetica").fontSize(10).fillColor("#526779")
     .text(`N° ${quoteNumber}`, 390, 48, { width: 155, align: "right" })
     .text(`Date : ${formatDateFr(createdAt)}`, 390, 64, { width: 155, align: "right" })
     .text(`Valable jusqu'au : ${formatDateFr(validUntil)}`, 350, 80, { width: 195, align: "right" });

  doc.font("Helvetica-Bold").fontSize(15).fillColor("#102A43").text(issuerName, 50, 105);
  doc.font("Helvetica").fontSize(10).fillColor("#526779").text(issuerTitle);
  doc.text(issuerEmail);
  if (issuerPhone) doc.text(issuerPhone);
  if (issuerAddress) doc.text(issuerAddress, { width: 240 });

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#102A43").text("CLIENT", 330, 112);
  doc.font("Helvetica-Bold").fontSize(11).text(clientName, 330, 132, { width: 215 });
  doc.font("Helvetica").fontSize(10).fillColor("#526779").text(clientEmail || "E-mail non renseigné", 330, 149, { width: 215 });

  drawDivider(doc, 190);

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#102A43").text("Objet du devis", 50, 210);
  doc.font("Helvetica").fontSize(10.5).fillColor("#334E68").text(service, 50, 232, { width: 495 });

  let y = doc.y + 18;
  if (project) {
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#102A43").text("Besoin exprimé", 50, y);
    doc.font("Helvetica").fontSize(10).fillColor("#526779").text(project, 50, y + 17, { width: 495 });
    y = doc.y + 18;
  }

  // Pricing table
  doc.roundedRect(50, y, 495, 34, 4).fill("#EAF8F4");
  doc.fillColor("#0B574A").font("Helvetica-Bold").fontSize(10)
    .text("Désignation", 62, y + 11, { width: 280 })
    .text("Qté", 354, y + 11, { width: 50, align: "center" })
    .text("Montant HT", 416, y + 11, { width: 115, align: "right" });

  const rowY = y + 34;
  doc.rect(50, rowY, 495, 56).strokeColor("#D9E2EC").stroke();
  doc.fillColor("#243B53").font("Helvetica").fontSize(10)
    .text(service, 62, rowY + 12, { width: 280, height: 34 })
    .text("1", 354, rowY + 12, { width: 50, align: "center" })
    .font("Helvetica-Bold")
    .text(money(amountHT), 416, rowY + 12, { width: 115, align: "right" });

  y = rowY + 78;
  const labelsX = 340, valuesX = 445;
  doc.font("Helvetica").fontSize(10).fillColor("#526779")
     .text("Total HT", labelsX, y, { width: 95, align: "right" })
     .text(`TVA (${vatRate.toFixed(2).replace(".", ",")} %)`, labelsX, y + 20, { width: 95, align: "right" });
  doc.font("Helvetica-Bold").fillColor("#243B53")
     .text(money(amountHT), valuesX, y, { width: 100, align: "right" })
     .text(money(vat), valuesX, y + 20, { width: 100, align: "right" });

  doc.roundedRect(335, y + 46, 210, 42, 5).fill("#102A43");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12)
     .text("TOTAL TTC", 350, y + 60, { width: 90 })
     .text(money(total), 440, y + 60, { width: 90, align: "right" });

  y += 116;
  drawDivider(doc, y);

  doc.fillColor("#102A43").font("Helvetica-Bold").fontSize(10.5).text("Conditions", 50, y + 18);
  doc.fillColor("#526779").font("Helvetica").fontSize(9.5)
     .text(`Validité du devis : ${validityDays} jours.`, 50, y + 37)
     .text("Le démarrage de la prestation intervient après validation du devis et accord sur les modalités de réalisation.", 50, y + 52, { width: 495 })
     .text("Les mentions fiscales, juridiques et les conditions de paiement doivent être adaptées à votre situation avant envoi au client.", 50, y + 82, { width: 495 });

  doc.fontSize(8.5).fillColor("#829AB1")
     .text("Devis généré depuis l'espace administrateur du portfolio Kabakaro.", 50, 785, { width: 495, align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve({
      buffer: Buffer.concat(chunks),
      totalHT: amountHT,
      vat,
      totalTTC: total,
      filename: `Devis-${quoteNumber}-${safeFilename(clientName)}.pdf`
    }));
    doc.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    if (!authorized(req)) {
      return res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    }

    const {
      eventId,
      amountHT,
      vatRate = 0,
      validityDays = 30,
      description = "",
      crmNotes = ""
    } = req.body || {};

    if (!eventId) return res.status(400).json({ error: "eventId manquant." });

    const amount = Number(amountHT || 0);
    const vat = Number(vatRate || 0);
    const validity = Math.max(1, Math.min(365, Number(validityDays || 30)));

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Le montant du devis doit être supérieur à 0 €." });
    }
    if (!Number.isFinite(vat) || vat < 0 || vat > 100) {
      return res.status(400).json({ error: "Taux de TVA invalide." });
    }

    const accessToken = await getAccessToken();
    const event = await getEvent(accessToken, eventId);
    const meta = parseDescription(event.description || "");

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const quoteNumber = `KBK-${datePart}-${String(eventId).slice(0, 6).toUpperCase()}`;

    const pdf = await buildPdf({
      event,
      meta,
      quoteNumber,
      amountHT: amount,
      vatRate: vat,
      validityDays: validity,
      description
    });

    await markQuoteSent(accessToken, event, crmNotes, amount, quoteNumber);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.filename}"`);
    res.setHeader("X-Quote-Number", quoteNumber);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(pdf.buffer);
  } catch (error) {
    console.error("[admin-quote]", error.message);
    return res.status(500).json({ error: "Impossible de générer le devis PDF." });
  }
};
