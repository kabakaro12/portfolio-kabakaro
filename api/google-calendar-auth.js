const crypto = require('crypto');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Configuration manquante : ${name}`);
  return value;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Méthode non autorisée.');

  try {
    const clientId = requireEnv('GOOGLE_CLIENT_ID');
    const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');
    const state = crypto.randomBytes(24).toString('hex');

    res.setHeader(
      'Set-Cookie',
      `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.events.freebusy'
      ].join(' '),
      state
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Configuration OAuth Google incomplète sur Vercel.');
  }
};
