const SYSTEM_PROMPT = `Tu es l'assistante virtuelle du portfolio de Kabakaro Keita, développeur Full Stack Web & Mobile.
Réponds en français, de manière chaleureuse, professionnelle et concise (maximum 120 mots).
Services : sites vitrines, sites professionnels, applications web/mobile et solutions sur mesure.
Technologies : React, React Native, JavaScript/TypeScript, Node.js, Python/Django, PostgreSQL, MongoDB, Symfony/PHP, Docker, Nginx et API REST.
Projets : G-Transport, G-Music et Proptech Solutions, entre autres.
Contact : kabakaro16@gmail.com ; téléphone 07 45 93 61 72. Sections : #services, #projets, #rendezvous et #contact.
Aide à naviguer et à décrire un bug (appareil, page, action, message affiché). Ne prétends jamais avoir réparé le site ou confirmé un rendez-vous. N'invente ni prix, ni délai, ni disponibilité. Ne demande jamais de mot de passe, donnée bancaire, pièce d'identité ou information confidentielle. Si la question est hors sujet, recentre poliment sur le portfolio.`;

function sendJson(response, status, data) { response.status(status).setHeader("Content-Type", "application/json; charset=utf-8"); response.setHeader("Cache-Control", "no-store"); return response.end(JSON.stringify(data)); }
function extractText(result) { if (typeof result.output_text === "string" && result.output_text.trim()) return result.output_text.trim(); return (result.output || []).flatMap(item => item.content || []).filter(item => item.type === "output_text" && typeof item.text === "string").map(item => item.text).join("\n").trim(); }

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Méthode non autorisée." });
  if (!process.env.OPENAI_API_KEY) return sendJson(response, 503, { error: "L’assistante IA n’est pas encore configurée." });
  const messages = Array.isArray(request.body?.messages) ? request.body.messages : [];
  const safeMessages = messages.slice(-8).filter(message => ["user", "assistant"].includes(message?.role) && typeof message?.content === "string").map(message => ({ role: message.role, content: message.content.trim().slice(0, 500) })).filter(message => message.content);
  if (!safeMessages.length) return sendJson(response, 400, { error: "Écrivez une question." });
  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_ASSISTANT_MODEL || "gpt-5-mini", instructions: SYSTEM_PROMPT, input: safeMessages, max_output_tokens: 220 }) });
    const result = await apiResponse.json();
    if (!apiResponse.ok) { console.error("OpenAI assistant error", apiResponse.status, result?.error?.type || "unknown"); return sendJson(response, 502, { error: "L’assistante est momentanément indisponible." }); }
    const answer = extractText(result);
    if (!answer) return sendJson(response, 502, { error: "Réponse vide de l’assistante." });
    return sendJson(response, 200, { answer });
  } catch (error) {
    console.error("Assistant route failure", error?.message || error);
    return sendJson(response, 500, { error: "L’assistante est momentanément indisponible." });
  }
};
