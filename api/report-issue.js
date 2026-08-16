const { configured, pipeline } = require("../lib/redis");
const recentRequests = new Map();
const QUOTE_KEY = "kabakaro:portfolio:quotes";

function sendJson(response, status, data) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  return response.end(JSON.stringify(data));
}

function clean(value, max) { return String(value || "").trim().slice(0, max); }
function escapeHtml(value) { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Méthode non autorisée." });

  const ip = clean(request.headers["x-forwarded-for"]?.split(",")[0] || "unknown", 80);
  const now = Date.now();
  if (now - (recentRequests.get(ip) || 0) < 30000) return sendJson(response, 429, { error: "Veuillez attendre avant d’envoyer un autre signalement." });

  if (request.body?.kind === "quote") {
    const name = clean(request.body?.name, 80);
    const email = clean(request.body?.email, 120);
    const phone = clean(request.body?.phone, 40);
    const projectType = clean(request.body?.projectType, 80);
    const pages = Math.max(1, Math.min(30, Number(request.body?.pages) || 1));
    const features = Array.isArray(request.body?.features) ? request.body.features.map(value => clean(value, 60)).filter(Boolean).slice(0, 12) : [];
    const deadline = clean(request.body?.deadline, 60);
    const details = clean(request.body?.details, 1200);
    const consent = clean(request.body?.consent, 10);
    const website = clean(request.body?.website, 100);
    if (website) return sendJson(response, 200, { quoteId: "DV-RECU" });
    if (!name || !email || !projectType || details.length < 10 || consent !== "yes") return sendJson(response, 400, { error: "Merci de compléter les informations obligatoires et d’accepter leur utilisation." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(response, 400, { error: "L’adresse e-mail n’est pas valide." });
    if (!configured()) return sendJson(response, 503, { error: "Le service de devis est momentanément indisponible." });

    const bases = { vitrine:300, professionnel:600, ecommerce:950, sur_mesure:1200 };
    const extras = { contact:50, whatsapp:30, seo:100, blog:180, booking:250, payment:350, account:400, dashboard:450, multilingual:180, maintenance:120 };
    const base = bases[projectType] || 600;
    const estimatedMin = Math.round((base + Math.max(0, pages - 3) * 55 + features.reduce((sum, item) => sum + (extras[item] || 0), 0)) / 10) * 10;
    const estimatedMax = Math.round((estimatedMin * 1.35) / 10) * 10;
    const quoteId = `DV-${Date.now().toString(36).toUpperCase()}`;
    const quote = { id:quoteId, name, email, phone, projectType, pages, features, deadline, details, estimatedMin, estimatedMax, status:"new", createdAt:new Date().toISOString() };
    await pipeline([["LPUSH", QUOTE_KEY, JSON.stringify(quote)], ["LTRIM", QUOTE_KEY, 0, 199]]);

    if (process.env.RESEND_API_KEY) {
      const ownerEmail = process.env.NOTIFICATION_EMAIL || "kabakaro16@gmail.com";
      const from = process.env.NOTIFICATION_FROM || "Kabakaro Portfolio <onboarding@resend.dev>";
      const html = `<h2>Nouvelle demande de devis — ${quoteId}</h2><p><strong>Client :</strong> ${escapeHtml(name)}</p><p><strong>E-mail :</strong> ${escapeHtml(email)}</p><p><strong>Téléphone :</strong> ${escapeHtml(phone || "Non renseigné")}</p><p><strong>Projet :</strong> ${escapeHtml(projectType)}</p><p><strong>Estimation indicative :</strong> ${estimatedMin} € – ${estimatedMax} €</p><p><strong>Délai :</strong> ${escapeHtml(deadline || "Non précisé")}</p><h3>Besoin</h3><p style="white-space:pre-wrap">${escapeHtml(details)}</p>`;
      try { await fetch("https://api.resend.com/emails", { method:"POST", headers:{ "Authorization":`Bearer ${process.env.RESEND_API_KEY}`, "Content-Type":"application/json" }, body:JSON.stringify({ from, to:[ownerEmail], reply_to:email, subject:`[${quoteId}] Nouvelle demande de devis`, html }) }); } catch (_) {}
    }
    recentRequests.set(ip, now);
    return sendJson(response, 200, { quoteId, estimatedMin, estimatedMax });
  }

  if (!process.env.RESEND_API_KEY) return sendJson(response, 503, { error: "Le service d’envoi n’est pas encore configuré." });

  const name = clean(request.body?.name, 80);
  const email = clean(request.body?.email, 120);
  const device = clean(request.body?.device, 80);
  const page = clean(request.body?.page, 160);
  const description = clean(request.body?.description, 1200);
  const url = clean(request.body?.url, 300);
  const website = clean(request.body?.website, 100);
  const consent = clean(request.body?.consent, 10);
  if (website) return sendJson(response, 200, { ticketId: "KK-RECU" });
  if (!name || !email || !device || !page || description.length < 10 || consent !== "yes") return sendJson(response, 400, { error: "Merci de remplir tous les champs et d’accepter l’utilisation de vos informations." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(response, 400, { error: "L’adresse e-mail n’est pas valide." });

  const ticketId = `KK-${Date.now().toString(36).toUpperCase()}`;
  const ownerEmail = process.env.NOTIFICATION_EMAIL || "kabakaro16@gmail.com";
  const from = process.env.NOTIFICATION_FROM || "Kabakaro Portfolio <onboarding@resend.dev>";
  const html = `<h2>Nouveau problème signalé — ${ticketId}</h2><p><strong>Nom :</strong> ${escapeHtml(name)}</p><p><strong>E-mail :</strong> ${escapeHtml(email)}</p><p><strong>Appareil :</strong> ${escapeHtml(device)}</p><p><strong>Page :</strong> ${escapeHtml(page)}</p><p><strong>Adresse consultée :</strong> ${escapeHtml(url)}</p><h3>Description</h3><p style="white-space:pre-wrap">${escapeHtml(description)}</p><hr><p>Répondez directement à cet e-mail pour contacter le visiteur.</p>`;

  try {
    const mailResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [ownerEmail], reply_to: email, subject: `[${ticketId}] Problème signalé sur le portfolio`, html }) });
    const result = await mailResponse.json();
    if (!mailResponse.ok) { console.error("Issue report email error", mailResponse.status, result?.name || result?.message || "unknown"); return sendJson(response, 502, { error: "Le signalement n’a pas pu être envoyé. Écrivez à kabakaro16@gmail.com." }); }
    recentRequests.set(ip, now);
    return sendJson(response, 200, { ticketId });
  } catch (error) {
    console.error("Issue report failure", error?.message || error);
    return sendJson(response, 500, { error: "Le signalement n’a pas pu être envoyé. Écrivez à kabakaro16@gmail.com." });
  }
};
