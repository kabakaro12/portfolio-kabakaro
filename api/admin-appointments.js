const { getAccessToken, calendarId, timezone, CALENDAR_API } = require("./_google");

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
  const projectMatch = description.match(/Projet\s*:\s*\n([\s\S]*?)(?:\n\nRéservation effectuée|$)/i);
  return {
    prospect: get("Prospect"),
    email: get("E-mail"),
    type: get("Type"),
    project: projectMatch ? projectMatch[1].trim() : ""
  };
}

function meetLink(event) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(p => p.entryPointType === "video")?.uri ||
    null
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    if (!authorized(req)) {
      return res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    }

    const accessToken = await getAccessToken();
    const now = new Date();
    const timeMin = req.query?.from || new Date(now.getTime() - 30 * 86400000).toISOString();
    const timeMax = req.query?.to || new Date(now.getTime() + 180 * 86400000).toISOString();

    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin,
      timeMax,
      maxResults: "250"
    });

    const response = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google Calendar [HTTP ${response.status}]`);
    }

    const appointments = (data.items || [])
      .filter(event => (event.summary || "").startsWith("Rendez-vous portfolio"))
      .map(event => {
        const meta = parseDescription(event.description || "");
        const attendee = event.attendees?.[0] || {};
        const start = event.start?.dateTime || event.start?.date || null;
        const end = event.end?.dateTime || event.end?.date || null;
        const cancelled = event.status === "cancelled";
        const past = start ? new Date(start) < now : false;

        let status = "À venir";
        if (cancelled) status = "Annulé";
        else if (past) status = "Passé";
        else if (attendee.responseStatus === "accepted") status = "Confirmé";
        else if (attendee.responseStatus === "declined") status = "Refusé";
        else if (attendee.responseStatus === "tentative") status = "Peut-être";
        else status = "En attente";

        return {
          id: event.id,
          summary: event.summary,
          start,
          end,
          status,
          attendeeStatus: attendee.responseStatus || "needsAction",
          name: meta.prospect || attendee.displayName || "",
          email: meta.email || attendee.email || "",
          type: meta.type || event.summary.replace(/^Rendez-vous portfolio\s*—\s*/i, ""),
          project: meta.project || "",
          meetLink: meetLink(event),
          calendarLink: event.htmlLink || null,
          created: event.created || null,
          updated: event.updated || null,
          crmStatus: event.extendedProperties?.private?.crmStatus || "Nouveau",
          crmNotes: event.extendedProperties?.private?.crmNotes || "",
          crmFollowUpDate: event.extendedProperties?.private?.crmFollowUpDate || "",
          crmEstimatedAmount: Number(event.extendedProperties?.private?.crmEstimatedAmount || 0)
        };
      });

    return res.status(200).json({
      ok: true,
      timezone: timezone(),
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error("[admin-appointments]", error.message);
    return res.status(500).json({ error: "Impossible de charger les rendez-vous." });
  }
};
