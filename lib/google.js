const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Configuration manquante : ${name}`);
  return value;
}

function safeGoogleError(prefix, status, data) {
  const code = data?.error || "unknown_error";
  const description = data?.error_description || data?.message || "Aucun détail fourni par Google.";
  return new Error(`${prefix} [HTTP ${status}] ${code}: ${description}`);
}

async function getAccessToken() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = requireEnv("GOOGLE_REFRESH_TOKEN");
  const body = new URLSearchParams({ client_id:clientId, client_secret:clientSecret, refresh_token:refreshToken, grant_type:"refresh_token" });
  const res = await fetch(TOKEN_URL, { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body });
  let data = {};
  try { data = await res.json(); } catch { throw new Error(`Google OAuth [HTTP ${res.status}] réponse illisible.`); }
  if (!res.ok || !data.access_token) throw safeGoogleError("Google OAuth", res.status, data);
  return data.access_token;
}

function calendarId() { return process.env.GOOGLE_CALENDAR_ID || "primary"; }
function timezone() { return process.env.BOOKING_TIMEZONE || "Europe/Paris"; }
module.exports = { getAccessToken, calendarId, timezone, CALENDAR_API, safeGoogleError };
