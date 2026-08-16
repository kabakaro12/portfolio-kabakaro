const VIEW_KEY = "kabakaro:portfolio:views";

function sendJson(res, status, data) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(data);
}

async function redisCommand(command, key) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!baseUrl || !token) return { configured: false, result: 0 };
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${command}/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Redis indisponible");
  return { configured: true, result: Number(data.result || 0) };
}

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return sendJson(res, 405, { error: "Méthode non autorisée." });
  try {
    const result = await redisCommand(req.method === "POST" ? "incr" : "get", VIEW_KEY);
    return sendJson(res, 200, { views: result.result, configured: result.configured });
  } catch (error) {
    console.error("Page views error", error?.message || error);
    return sendJson(res, 503, { error: "Compteur temporairement indisponible.", configured: true });
  }
};
