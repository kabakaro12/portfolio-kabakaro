const { configured, pipeline } = require("../lib/redis");
const VIEW_KEY = "kabakaro:portfolio:views";

function sendJson(res, status, data) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(data);
}

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return sendJson(res, 405, { error: "Méthode non autorisée." });
  try {
    if (!configured()) return sendJson(res, 200, { views: 0, today: 0, configured: false });
    const day = new Date().toISOString().slice(0, 10);
    const dayKey = `${VIEW_KEY}:day:${day}`;
    const commands = req.method === "POST"
      ? [["INCR", VIEW_KEY], ["INCR", dayKey], ["EXPIRE", dayKey, 7776000]]
      : [["GET", VIEW_KEY], ["GET", dayKey]];
    const values = await pipeline(commands);
    return sendJson(res, 200, { views: Number(values[0] || 0), today: Number(values[1] || 0), configured: true });
  } catch (error) {
    console.error("Page views error", error?.message || error);
    return sendJson(res, 503, { error: "Compteur temporairement indisponible.", configured: true });
  }
};
