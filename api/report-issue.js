const recentRequests = new Map();

function sendJson(response, status, data) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  return response.end(JSON.stringify(data));
}

function clean(value, max) { return String(value || "").trim().slice(0, max); }
function escapeHtml(value) { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Méthode non autorisée." });
  if (!process.env.RESEND_API_KEY) return sendJson(response, 503, { error: "Le service d’envoi n’est pas encore configuré." });

  const ip = clean(request.headers["x-forwarded-for"]?.split(",")[0] || "unknown", 80);
  const now = Date.now();
  if (now - (recentRequests.get(ip) || 0) < 30000) return sendJson(response, 429, { error: "Veuillez attendre avant d’envoyer un autre signalement." });

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
