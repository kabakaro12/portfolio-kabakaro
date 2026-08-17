const { getAccessToken, calendarId, timezone, CALENDAR_API } = require("../lib/google");

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = req.headers["x-admin-password"];
  if (!expected) throw new Error("Configuration manquante : ADMIN_PASSWORD");
  return typeof provided === "string" && provided === expected;
}

const ALLOWED_STATUSES = new Set(["Nouveau", "Contacté", "Devis envoyé", "Gagné", "Perdu"]);

module.exports = async function handler(req, res) {
  if (!["PATCH", "POST"].includes(req.method)) return res.status(405).json({ error: "Méthode non autorisée." });

  try {
    if (!authorized(req)) return res.status(401).json({ error: "Mot de passe administrateur incorrect." });

    const { eventId, action, crmStatus, crmNotes, crmFollowUpDate, crmEstimatedAmount } = req.body || {};
    if (!eventId) return res.status(400).json({ error: "eventId manquant." });

    const accessToken = await getAccessToken();
    const eventUrl = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`;
    const getResponse = await fetch(eventUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const existing = await getResponse.json();
    if (!getResponse.ok) throw new Error(`Google Calendar lecture [HTTP ${getResponse.status}]`);

    const existingPrivate = existing.extendedProperties?.private || {};

    if (action === "confirm") {
      if (existingPrivate.bookingStatus === "confirmed") return res.status(200).json({ ok: true, bookingStatus: "confirmed" });
      const emailMatch = String(existing.description || "").match(/^E-mail\s*:\s*(.+)$/mi);
      const clientEmail = emailMatch?.[1]?.trim();
      if (!clientEmail) return res.status(400).json({ error: "E-mail client introuvable dans le rendez-vous." });

      const patchBody = {
        attendees: [{ email: clientEmail }],
        conferenceData: {
          createRequest: {
            requestId: `portfolio-confirm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: "email", minutes: 24 * 60 }, { method: "popup", minutes: 30 }]
        },
        extendedProperties: {
          private: { ...existingPrivate, bookingStatus: "confirmed" }
        }
      };

      const r = await fetch(`${eventUrl}?sendUpdates=all&conferenceDataVersion=1`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(patchBody)
      });
      const updated = await r.json();
      if (!r.ok) throw new Error(`Confirmation Google Calendar [HTTP ${r.status}]`);
      const meetLink = updated.hangoutLink || updated.conferenceData?.entryPoints?.find(p => p.entryPointType === "video")?.uri || null;
      return res.status(200).json({ ok: true, eventId: updated.id, bookingStatus: "confirmed", meetLink, calendarLink: updated.htmlLink || null });
    }

    if (action === "cancel") {
      const r = await fetch(`${eventUrl}?sendUpdates=all`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok && r.status !== 204) throw new Error(`Annulation Google Calendar [HTTP ${r.status}]`);
      return res.status(200).json({ ok: true, eventId, bookingStatus: "cancelled" });
    }

    const status = ALLOWED_STATUSES.has(crmStatus) ? crmStatus : (existingPrivate.crmStatus || "Nouveau");
    const notes = String(crmNotes || "").slice(0, 4000);
    const followUpDate = /^\d{4}-\d{2}-\d{2}$/.test(String(crmFollowUpDate || "")) ? String(crmFollowUpDate) : "";
    const amount = Math.max(0, Math.min(10000000, Number(crmEstimatedAmount || 0)));

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

    const patchResponse = await fetch(eventUrl, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(patchBody)
    });
    const updated = await patchResponse.json();
    if (!patchResponse.ok) throw new Error(`Google Calendar mise à jour [HTTP ${patchResponse.status}]`);

    return res.status(200).json({
      ok: true,
      eventId: updated.id,
      bookingStatus: updated.extendedProperties?.private?.bookingStatus || existingPrivate.bookingStatus || "legacy",
      crmStatus: updated.extendedProperties?.private?.crmStatus || status,
      crmNotes: updated.extendedProperties?.private?.crmNotes || notes,
      crmFollowUpDate: updated.extendedProperties?.private?.crmFollowUpDate || followUpDate,
      crmEstimatedAmount: Number(updated.extendedProperties?.private?.crmEstimatedAmount || amount || 0)
    });
  } catch (error) {
    console.error("[admin-appointment-update]", error.message);
    return res.status(500).json({ error: "Impossible de mettre à jour ce rendez-vous." });
  }
};
