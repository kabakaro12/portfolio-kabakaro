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


async function sendOwnerNotification({ meetingType, name, email, project, start, end, meetLink, htmlLink }) {
  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.NOTIFICATION_EMAIL || "kabakaro16@gmail.com";
  const fromEmail = process.env.NOTIFICATION_FROM || "Kabakaro Portfolio <onboarding@resend.dev>";

  // The booking must never fail only because the notification e-mail is not configured.
  if (!apiKey) {
    console.warn("[notification] RESEND_API_KEY absent : rendez-vous créé, notification e-mail non envoyée.");
    return { sent: false, reason: "not_configured" };
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const fmtDate = new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone(),
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const fmtTime = new Intl.DateTimeFormat("fr-FR", {
    timeZone: timezone(),
    hour: "2-digit",
    minute: "2-digit"
  });

  const dateLabel = fmtDate.format(startDate);
  const startLabel = fmtTime.format(startDate);
  const endLabel = fmtTime.format(endDate);

  const safeProject = (project || "À préciser").replace(/[<>&]/g, c => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;"
  }[c]));
  const safeName = String(name).replace(/[<>&]/g, c => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;"
  }[c]));
  const safeEmail = String(email).replace(/[<>&]/g, c => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;"
  }[c]));
  const safeType = String(meetingType).replace(/[<>&]/g, c => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;"
  }[c]));

  const subject = `Nouveau rendez-vous — ${dateLabel} à ${startLabel}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
      <h2 style="margin-bottom:8px">Nouveau rendez-vous réservé</h2>
      <p>Un nouveau rendez-vous vient d'être confirmé depuis ton portfolio.</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:18px;margin:18px 0">
        <p><strong>Date :</strong> ${dateLabel}</p>
        <p><strong>Horaire :</strong> ${startLabel} – ${endLabel}</p>
        <p><strong>Type :</strong> ${safeType}</p>
        <p><strong>Client :</strong> ${safeName}</p>
        <p><strong>E-mail :</strong> ${safeEmail}</p>
        <p><strong>Projet :</strong><br>${safeProject.replace(/\n/g, "<br>")}</p>
      </div>
      ${meetLink ? `<p><a href="${meetLink}" style="display:inline-block;background:#0f766e;color:white;text-decoration:none;padding:12px 18px;border-radius:8px">Ouvrir Google Meet</a></p>` : ""}
      ${htmlLink ? `<p><a href="${htmlLink}">Voir le rendez-vous dans Google Calendar</a></p>` : ""}
      <p style="color:#6b7280;font-size:13px">Notification automatique — portfolio-kabakaro.vercel.app</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [ownerEmail],
      subject,
      html
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[notification] Resend error", response.status, data?.message || data?.name || "unknown");
    return { sent: false, reason: "resend_error" };
  }

  return { sent: true, id: data.id || null };
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
      conferenceData: {
        createRequest: {
          requestId: `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 }
        ]
      }
    };

    const createRes = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events?sendUpdates=all&conferenceDataVersion=1`,
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

    const meetLink =
      created.hangoutLink ||
      created.conferenceData?.entryPoints?.find(p => p.entryPointType === "video")?.uri ||
      null;

    const notification = await sendOwnerNotification({
      meetingType,
      name,
      email,
      project,
      start,
      end,
      meetLink,
      htmlLink: created.htmlLink || null
    });

    return res.status(201).json({
      ok: true,
      eventId: created.id,
      htmlLink: created.htmlLink || null,
      meetLink,
      ownerNotificationSent: notification.sent
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "La réservation automatique n'est pas encore configurée sur le serveur." });
  }
};
