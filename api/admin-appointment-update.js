const { getAccessToken, calendarId, CALENDAR_API } = require("./_google");

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = req.headers["x-admin-password"];
  if (!expected) throw new Error("Configuration manquante : ADMIN_PASSWORD");
  return typeof provided === "string" && provided === expected;
}

const ALLOWED_STATUSES = new Set([
  "Nouveau",
  "Contacté",
  "Devis envoyé",
  "Gagné",
  "Perdu"
]);

module.exports = async function handler(req, res) {
  if (!["PATCH", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    if (!authorized(req)) {
      return res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    }

    const { eventId, crmStatus, crmNotes, crmFollowUpDate, crmEstimatedAmount } = req.body || {};
    if (!eventId) {
      return res.status(400).json({ error: "eventId manquant." });
    }

    const status = ALLOWED_STATUSES.has(crmStatus) ? crmStatus : "Nouveau";
    const notes = String(crmNotes || "").slice(0, 4000);
    const followUpDate = /^\d{4}-\d{2}-\d{2}$/.test(String(crmFollowUpDate || "")) ? String(crmFollowUpDate) : "";
    const amount = Math.max(0, Math.min(10000000, Number(crmEstimatedAmount || 0)));

    const accessToken = await getAccessToken();

    const getResponse = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const existing = await getResponse.json();
    if (!getResponse.ok) {
      throw new Error(`Google Calendar lecture [HTTP ${getResponse.status}]`);
    }

    const existingPrivate = existing.extendedProperties?.private || {};
    const patchBody = {
      extendedProperties: {
        private: {
          ...existingPrivate,
          crmStatus: status,
          crmNotes: notes,
          crmFollowUpDate: followUpDate,
          crmEstimatedAmount: String(Number.isFinite(amount) ? amount : 0)
        }
      }
    };

    const patchResponse = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patchBody)
      }
    );

    const updated = await patchResponse.json();
    if (!patchResponse.ok) {
      throw new Error(`Google Calendar mise à jour [HTTP ${patchResponse.status}]`);
    }

    return res.status(200).json({
      ok: true,
      eventId: updated.id,
      crmStatus: updated.extendedProperties?.private?.crmStatus || status,
      crmNotes: updated.extendedProperties?.private?.crmNotes || notes,
      crmFollowUpDate: updated.extendedProperties?.private?.crmFollowUpDate || followUpDate,
      crmEstimatedAmount: Number(updated.extendedProperties?.private?.crmEstimatedAmount || amount || 0)
    });
  } catch (error) {
    console.error("[admin-appointment-update]", error.message);
    return res.status(500).json({ error: "Impossible d'enregistrer le suivi commercial." });
  }
};
