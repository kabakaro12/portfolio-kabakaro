const recentRequests = new Map();
const { configured, pipeline } = require("../lib/redis");
const TESTIMONIAL_KEY = "kabakaro:portfolio:testimonials";

function sendJson(res, status, data) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(data);
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

async function getPublishedTestimonials(res) {
  if (!configured()) {
    return sendJson(res, 200, { testimonials: [] });
  }

  try {
    const [items] = await pipeline([["LRANGE", TESTIMONIAL_KEY, 0, 49]]);

    const testimonials = (items || [])
      .map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      })
      .filter(item => item?.status === "published")
      .map(({ id, name, company, rating, message, createdAt }) => ({
        id,
        name,
        company,
        rating,
        message,
        createdAt
      }));

    return sendJson(res, 200, { testimonials });
  } catch (error) {
    console.error("Public testimonials error", error?.message || error);
    return sendJson(res, 200, { testimonials: [] });
  }
}

async function createTestimonial(req, res) {
  if (!process.env.RESEND_API_KEY) {
    return sendJson(res, 503, { error: "Le service d’envoi n’est pas encore configuré." });
  }

  const ip = clean(req.headers["x-forwarded-for"]?.split(",")[0] || "unknown", 80);
  const now = Date.now();

  if (now - (recentRequests.get(ip) || 0) < 60000) {
    return sendJson(res, 429, { error: "Veuillez attendre avant un nouvel envoi." });
  }

  const name = clean(req.body?.name, 80);
  const email = clean(req.body?.email, 120);
  const company = clean(req.body?.company, 100);
  const rating = clean(req.body?.rating, 1);
  const message = clean(req.body?.message, 800);
  const consent = clean(req.body?.consent, 10);
  const website = clean(req.body?.website, 100);

  if (website) return sendJson(res, 200, { received: true });

  if (
    !name ||
    !email ||
    !["3", "4", "5"].includes(rating) ||
    message.length < 20 ||
    consent !== "yes"
  ) {
    return sendJson(res, 400, {
      error: "Merci de remplir correctement tous les champs obligatoires."
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, { error: "L’adresse e-mail n’est pas valide." });
  }

  const ownerEmail = process.env.NOTIFICATION_EMAIL || "kabakaro16@gmail.com";
  const from = process.env.NOTIFICATION_FROM || "Kabakaro Portfolio <onboarding@resend.dev>";

  const html = `
    <h2>Nouveau témoignage à vérifier</h2>
    <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
    <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
    <p><strong>Entreprise / activité :</strong> ${escapeHtml(company || "Non renseignée")}</p>
    <p><strong>Note :</strong> ${rating}/5</p>
    <h3>Témoignage</h3>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    <hr>
    <p>L’auteur a accepté d’être contacté pour confirmer une éventuelle publication. Vérifiez son identité et son accord avant d’afficher cet avis.</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [ownerEmail],
        reply_to: email,
        subject: `[Portfolio] Témoignage de ${name} — ${rating}/5`,
        html
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Testimonial email error",
        response.status,
        result?.message || "unknown"
      );
      return sendJson(res, 502, {
        error: "Le témoignage n’a pas pu être envoyé."
      });
    }

    const testimonial = {
      id: `AVIS-${now.toString(36).toUpperCase()}`,
      name,
      email,
      company,
      rating: Number(rating),
      message,
      status: "pending",
      createdAt: new Date(now).toISOString()
    };

    let stored = false;

    if (configured()) {
      try {
        await pipeline([
          ["LPUSH", TESTIMONIAL_KEY, JSON.stringify(testimonial)],
          ["LTRIM", TESTIMONIAL_KEY, 0, 199]
        ]);
        stored = true;
      } catch (storageError) {
        console.error(
          "Testimonial storage error",
          storageError?.message || storageError
        );
      }
    }

    recentRequests.set(ip, now);
    return sendJson(res, 200, {
      received: true,
      stored,
      reference: testimonial.id
    });
  } catch (error) {
    console.error("Testimonial failure", error?.message || error);
    return sendJson(res, 500, {
      error: "Le témoignage n’a pas pu être envoyé."
    });
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return getPublishedTestimonials(res);
  }

  if (req.method === "POST") {
    return createTestimonial(req, res);
  }

  return sendJson(res, 405, { error: "Méthode non autorisée." });
};
