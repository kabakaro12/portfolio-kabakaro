function credentials() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ""
  };
}
function configured() { const { url, token } = credentials(); return Boolean(url && token); }
async function pipeline(commands) {
  const { url, token } = credentials();
  if (!url || !token) throw new Error("Redis non configuré");
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, { method:"POST", headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}, body:JSON.stringify(commands) });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data)) throw new Error(data?.error || "Redis indisponible");
  const failed = data.find(item => item?.error);
  if (failed) throw new Error(failed.error);
  return data.map(item => item?.result);
}
module.exports = { configured, pipeline };
