const crypto = require('crypto');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Configuration manquante : ${name}`);
  return value;
}

async function handleCvAi(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'L’IA n’est pas activée : ajoutez OPENAI_API_KEY dans Vercel puis redéployez.' });
  }

  const { action, data = {}, jobOffer = '', rawText = '' } = req.body || {};
  const rules = `Tu es un assistant CV francophone. Tu ne dois jamais inventer une expérience, une entreprise, un diplôme, une date ou une compétence. Réponds uniquement avec un objet JSON valide, sans Markdown : {"explanation":"texte court","data":{...}}. Le champ data doit rester compatible avec : firstName,lastName,professionalTitle,email,phone,city,linkedin,github,portfolio,summary,experiences,educations,skills,languages.`;

  let task = '';
  if (action === 'import') task = `Structure uniquement les informations réellement présentes dans ce CV :\n${String(rawText).slice(0, 50000)}`;
  else if (action === 'summary') task = `Améliore uniquement le résumé professionnel, sans inventer :\n${JSON.stringify(data)}`;
  else if (action === 'experiences') task = `Améliore la rédaction des descriptions d'expériences sans ajouter de faits :\n${JSON.stringify(data)}`;
  else if (action === 'adapt') {
    if (!jobOffer.trim()) return res.status(400).json({ error: 'Collez d’abord une offre d’emploi.' });
    task = `Adapte le résumé et l'ordre des compétences EXISTANTES à cette offre, sans inventer.\nOFFRE:\n${jobOffer}\nCV:\n${JSON.stringify(data)}`;
  } else if (action === 'ats') {
    if (!jobOffer.trim()) return res.status(400).json({ error: 'Collez d’abord une offre d’emploi.' });
    task = `Analyse les mots-clés ATS de l'offre. Dans explanation, indique présents et manquants. N'ajoute aucune compétence.\nOFFRE:\n${jobOffer}\nCV:\n${JSON.stringify(data)}`;
  } else return res.status(400).json({ error: 'Action IA inconnue.' });

  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body: JSON.stringify({ model: 'gpt-5.6-luna', input: rules + '\n\n' + task })
    });
    const payload = await r.json();
    if (!r.ok) return res.status(502).json({ error: payload?.error?.message || 'Le service OpenAI a refusé la requête.' });
    const text = (payload.output || []).flatMap(i => i.content || []).filter(c => c.type === 'output_text').map(c => c.text || '').join('') || payload.output_text || '';
    if (!text.trim()) return res.status(502).json({ error: 'Aucune réponse reçue du modèle IA.' });
    const cleaned = text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch {
      const a = cleaned.indexOf('{'), b = cleaned.lastIndexOf('}');
      if (a < 0 || b <= a) throw new Error('JSON introuvable');
      parsed = JSON.parse(cleaned.slice(a, b + 1));
    }
    return res.status(200).json({ explanation: parsed.explanation || 'Analyse terminée.', data: parsed.data || null });
  } catch (err) {
    console.error('cv-ai', err);
    return res.status(500).json({ error: 'Erreur serveur IA. Vérifiez OPENAI_API_KEY et les logs Vercel.' });
  }
}

module.exports = async function handler(req, res) {
  if (String(req.query.route || '') === 'cv-ai') return handleCvAi(req, res);
  if (req.method !== 'GET') return res.status(405).send('Méthode non autorisée.');
  try {
    const clientId = requireEnv('GOOGLE_CLIENT_ID');
    const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');
    const state = crypto.randomBytes(24).toString('hex');
    res.setHeader('Set-Cookie', `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true',
      scope: ['https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/calendar.events.freebusy'].join(' '), state
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Configuration OAuth Google incomplète sur Vercel.');
  }
};
