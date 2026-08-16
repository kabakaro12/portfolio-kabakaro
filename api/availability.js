const { getAccessToken, calendarId, timezone, CALENDAR_API, safeGoogleError } = require("../lib/google");

const SLOT_MINUTES = 30;
const WORK_START = 9;    // 09:00
const WORK_END = 18;     // 18:00
const DAYS_OPEN = [1,2,3,4,5]; // lundi-vendredi

function isoWithOffset(dateStr, hour, minute = 0) {
  // Europe/Paris is handled by Google response timezone, but queries require an explicit offset.
  // V13 defaults to +02:00 for the summer portfolio launch; set BOOKING_UTC_OFFSET on Vercel as needed.
  const offset = process.env.BOOKING_UTC_OFFSET || "+02:00";
  return `${dateStr}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00${offset}`;
}

function minutesFromISO(iso) {
  const d = new Date(iso);
  return d.getTime();
}

function overlaps(start, end, busy) {
  const s = minutesFromISO(start);
  const e = minutesFromISO(end);
  return busy.some(b => s < minutesFromISO(b.end) && e > minutesFromISO(b.start));
}

function slotLabel(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone()
  }).format(d);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée." });

  try {
    const date = req.query.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return res.status(400).json({ error: "Date invalide." });
    }

    // Validate weekday using midday to avoid UTC edge shifts.
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (!DAYS_OPEN.includes(weekday)) {
      return res.status(200).json({ slots: [] });
    }

    const timeMin = isoWithOffset(date, WORK_START);
    const timeMax = isoWithOffset(date, WORK_END);
    const accessToken = await getAccessToken();

    const freeBusyRes = await fetch(`${CALENDAR_API}/freeBusy`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: timezone(),
        items: [{ id: calendarId() }]
      })
    });

    const data = await freeBusyRes.json();
    if (!freeBusyRes.ok) {
      const apiError = data?.error || {};
      throw safeGoogleError(
        "Google Calendar FreeBusy",
        freeBusyRes.status,
        { error: apiError.status || apiError.code || "calendar_error", error_description: apiError.message }
      );
    }

    const busy = data.calendars?.[calendarId()]?.busy || [];
    const slots = [];

    for (let hour = WORK_START; hour < WORK_END; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        const start = isoWithOffset(date, hour, minute);
        const endDate = new Date(new Date(start).getTime() + SLOT_MINUTES * 60000);
        const end = endDate.toISOString();

        if (new Date(start) < new Date()) continue;
        if (!overlaps(start, end, busy)) {
          slots.push({ start, end, label: slotLabel(start) });
        }
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ date, slots });
  } catch (err) {
    console.error(`[availability] ${err?.message || err}`);
    return res.status(500).json({
      error: "Le calendrier n'est pas encore configuré sur le serveur.",
      diagnostic: "Consultez les Runtime Logs Vercel pour le code Google exact."
    });
  }
};
