const { getAccessToken, calendarId, timezone, CALENDAR_API } = require("./_google");

async function checkBusy(accessToken, start, end) {
  const response = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeMin: start,
      timeMax: end,
      timeZone: timezone(),
      items: [{ id: calendarId() }]
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error("Vérification du créneau impossible.");
  return (data.calendars?.[calendarId()]?.busy || []).length > 0;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  try {
    const { meetingType, name, email, project, start, end } = req.body || {};
    if (!meetingType || !name || !email || !start || !end) {
      return res.status(400).json({ error: "Informations de rendez-vous incomplètes." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Adresse e-mail invalide." });
    }

    const accessToken = await getAccessToken();

    // Always re-check immediately before creating to prevent double booking.
    if (await checkBusy(accessToken, start, end)) {
      return res.status(409).json({ error: "Ce créneau vient d'être réservé. Choisissez-en un autre." });
    }

    const event = {
      summary: `Rendez-vous portfolio — ${meetingType}`,
      description:
`Prospect : ${name}
E-mail : ${email}
Type : ${meetingType}

Projet :
${project || "À préciser"}

Réservation effectuée depuis portfolio-kabakaro.vercel.app`,
      start: { dateTime: start, timeZone: timezone() },
      end: { dateTime: end, timeZone: timezone() },
      attendees: [{ email }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 }
        ]
      }
    };

    const createRes = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events?sendUpdates=all`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(event)
      }
    );

    const created = await createRes.json();
    if (!createRes.ok) throw new Error("Google Calendar n'a pas pu créer le rendez-vous.");

    return res.status(201).json({
      ok: true,
      eventId: created.id,
      htmlLink: created.htmlLink || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "La réservation automatique n'est pas encore configurée sur le serveur." });
  }
};
