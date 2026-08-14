const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Configuration manquante : ${name}`);
  return value;
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const parts = raw.split(';').map(v => v.trim());
  const match = parts.find(v => v.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Méthode non autorisée.');

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', 'google_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  try {
    const { code, state, error } = req.query || {};
    if (error) return res.status(400).send(`Google a refusé l'autorisation : ${escapeHtml(error)}`);

    const expectedState = getCookie(req, 'google_oauth_state');
    if (!code || !state || !expectedState || state !== expectedState) {
      return res.status(400).send("Échec de la vérification OAuth. Recommencez depuis /api/google-calendar/auth.");
    }

    const clientId = requireEnv('GOOGLE_CLIENT_ID');
    const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
    const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error(tokens);
      return res.status(400).send("Google n'a pas pu finaliser l'autorisation. Vérifiez l'URI de redirection.");
    }

    if (!tokens.refresh_token) {
      return res.status(400).send(
        "Aucun refresh token n'a été renvoyé. Revenez sur /api/google-calendar/auth et autorisez à nouveau l'application."
      );
    }

    const refreshToken = escapeHtml(tokens.refresh_token);
    return res.status(200).send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Google Calendar connecté</title>
<style>body{font-family:system-ui;background:#071525;color:#fff;padding:32px;max-width:760px;margin:auto}code{display:block;word-break:break-all;background:#0d2238;padding:16px;border-radius:12px;color:#8fffd0}strong{color:#8fffd0}</style></head>
<body><h1>Google Calendar est autorisé ✅</h1>
<p>Copiez la valeur ci-dessous dans Vercel comme variable <strong>GOOGLE_REFRESH_TOKEN</strong>.</p>
<code>${refreshToken}</code>
<p>Ne partagez pas cette valeur et ne la mettez jamais dans GitHub.</p>
<p>Après l'avoir enregistrée dans Vercel, redéployez le projet puis testez les créneaux sur votre domaine principal.</p>
</body></html>`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erreur pendant la finalisation OAuth Google.');
  }
};
