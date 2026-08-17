const { getAccessToken, calendarId, timezone, CALENDAR_API } = require("../lib/google");

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = req.headers["x-admin-password"];
  if (!expected) throw new Error("ADMIN_PASSWORD manquant");
  return typeof provided === "string" && provided === expected;
}

function esc(value) {
  return String(value || "").replace(/[<>&"]/g, c => ({
    "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"
  }[c]));
}

async function sendRejectionEmail({ email, name, reason, start }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !email) return false;

  const from = process.env.NOTIFICATION_FROM || "Kabakaro Portfolio <onboarding@resend.dev>";
  const dateLabel = start
    ? new Intl.DateTimeFormat("fr-FR", {
        timeZone: timezone(),
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(start))
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
      <h2>Votre demande de rendez-vous</h2>
      <p>Bonjour ${esc(name || "")},</p>
      <p>Merci pour votre demande${dateLabel ? ` concernant le créneau du <strong>${esc(dateLabel)}</strong>` : ""}.</p>
      <p>Après vérification, cette demande ne peut pas être confirmée.</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin:18px 0">
        <strong>Motif :</strong><br>${esc(reason || "La demande ne correspond pas aux services proposés sur ce site.")}
      </div>
      <p>Pour un projet de site web, application, maintenance, e-commerce, référencement ou autre besoin numérique, vous pouvez envoyer une nouvelle demande avec une description précise du projet.</p>
      <p style="color:#6b7280;font-size:13px">Kabakaro Dev</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Votre demande de rendez-vous",
      html
    })
  });

  return response.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    if (!authorized(req)) {
      return res.status(401).json({ error: "Mot de passe administrateur incorrect." });
    }

    const { eventId, action, reason } = req.body || {};
    if (!eventId || !["confirm", "cancel", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action invalide." });
    }

    const token = await getAccessToken();
    const url = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`;

    const gr = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const ev = await gr.json();
    if (!gr.ok) throw new Error("Rendez-vous introuvable.");

    if (action === "cancel") {
      const dr = await fetch(`${url}?sendUpdates=none`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!dr.ok && dr.status !== 204) throw new Error("Annulation impossible.");
      return res.status(200).json({ ok: true, status: "Annulé" });
    }

    const priv = ev.extendedProperties?.private || {};
    const email =
      priv.prospectEmail ||
      ((ev.description || "").match(/^E-mail\s*:\s*(.+)$/mi) || [])[1] ||
      "";
    const name =
      priv.prospectName ||
      ((ev.description || "").match(/^Prospect\s*:\s*(.+)$/mi) || [])[1] ||
      "";

    if (action === "reject") {
      const rejectionReason = String(
        reason || "La demande ne correspond pas aux services proposés sur ce site."
      ).trim().slice(0, 500);

      const patch = {
        transparency: "transparent",
        extendedProperties: {
          private: {
            ...priv,
            qualificationStatus: "rejected",
            crmStatus: "Perdu",
            rejectionReason
          }
        }
      };

      const pr = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patch)
      });

      const updated = await pr.json();
      if (!pr.ok) throw new Error("Refus impossible.");

      const emailSent = await sendRejectionEmail({
        email,
        name,
        reason: rejectionReason,
        start: ev.start?.dateTime || ev.start?.date || null
      });

      return res.status(200).json({
        ok: true,
        status: "Refusé",
        emailSent
      });
    }

    if (!email) {
      return res.status(400).json({ error: "E-mail du client introuvable." });
    }

    const patch = {
      attendees: [{ email }],
      conferenceData: {
        createRequest: {
          requestId: `portfolio-confirm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 },
          { method: "popup", minutes: 30 }
        ]
      },
      extendedProperties: {
        private: {
          ...priv,
          qualificationStatus: "confirmed"
        }
      }
    };

    const pr = await fetch(`${url}?sendUpdates=all&conferenceDataVersion=1`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patch)
    });

    const updated = await pr.json();
    if (!pr.ok) throw new Error("Confirmation impossible.");

    const meetLink =
      updated.hangoutLink ||
      updated.conferenceData?.entryPoints?.find(p => p.entryPointType === "video")?.uri ||
      null;

    return res.status(200).json({
      ok: true,
      status: "Confirmé",
      meetLink,
      calendarLink: updated.htmlLink || null
    });
  } catch (e) {
    console.error("[admin-appointment-action]", e);
    return res.status(500).json({ error: e.message || "Action impossible." });
  }
};
