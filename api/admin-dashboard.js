const { configured, pipeline } = require("../lib/redis");
const VIEW_KEY = "kabakaro:portfolio:views";
const TESTIMONIAL_KEY = "kabakaro:portfolio:testimonials";
const QUOTE_KEY = "kabakaro:portfolio:quotes";

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const bearer = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1];
  let decodedBearer = "";
  try { decodedBearer = bearer ? decodeURIComponent(bearer) : ""; } catch { decodedBearer = ""; }
  const provided = decodedBearer || req.headers["x-admin-password"];
  if (!expected) throw new Error("Configuration manquante : ADMIN_PASSWORD");
  return typeof provided === "string" && provided === expected;
}
function parseItems(items) { return (items || []).map(item => { try { return JSON.parse(item); } catch { return null; } }).filter(Boolean); }
function dayKeys(count=7) { return Array.from({length:count}, (_,i) => { const d=new Date(); d.setUTCDate(d.getUTCDate()-i); return `${VIEW_KEY}:day:${d.toISOString().slice(0,10)}`; }); }

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (!authorized(req)) return res.status(401).json({ error:"Mot de passe administrateur incorrect." });
    if (!configured()) return res.status(503).json({ error:"Upstash n’est pas configuré." });
    if (req.method === "GET") {
      const keys = dayKeys();
      const values = await pipeline([["GET",VIEW_KEY], ...keys.map(key=>["GET",key]), ["LRANGE",TESTIMONIAL_KEY,0,199], ["LRANGE",QUOTE_KEY,0,199]]);
      const testimonials = parseItems(values[values.length-2]);
      const quotes = parseItems(values[values.length-1]);
      return res.status(200).json({ views:{ total:Number(values[0]||0), today:Number(values[1]||0), week:values.slice(1,8).reduce((sum,v)=>sum+Number(v||0),0) }, testimonials, quotes, pending:testimonials.filter(x=>x.status==="pending").length, newQuotes:quotes.filter(x=>x.status==="new").length });
    }
    if (req.method === "PATCH") {
      const id = String(req.body?.id || "");
      const status = String(req.body?.status || "");
      if (req.body?.entity === "quote") {
        if (!id || !["new","contacted","proposal","won","lost","deleted"].includes(status)) return res.status(400).json({ error:"Action de devis invalide." });
        const [rawQuotes] = await pipeline([["LRANGE",QUOTE_KEY,0,199]]);
        let quotes = parseItems(rawQuotes);
        if (!quotes.some(item=>item.id===id)) return res.status(404).json({ error:"Demande de devis introuvable." });
        quotes = status === "deleted" ? quotes.filter(item=>item.id!==id) : quotes.map(item=>item.id===id ? {...item,status,updatedAt:new Date().toISOString()} : item);
        const quoteCommands = [["DEL",QUOTE_KEY]];
        if (quotes.length) quoteCommands.push(["RPUSH",QUOTE_KEY,...quotes.map(JSON.stringify)]);
        await pipeline(quoteCommands);
        return res.status(200).json({ ok:true, id, status });
      }
      if (!id || !["published","hidden","deleted"].includes(status)) return res.status(400).json({ error:"Action invalide." });
      const [raw] = await pipeline([["LRANGE",TESTIMONIAL_KEY,0,199]]);
      let items = parseItems(raw);
      if (!items.some(item=>item.id===id)) return res.status(404).json({ error:"Témoignage introuvable." });
      items = status === "deleted" ? items.filter(item=>item.id!==id) : items.map(item=>item.id===id ? {...item,status,moderatedAt:new Date().toISOString()} : item);
      const commands = [["DEL",TESTIMONIAL_KEY]];
      if (items.length) commands.push(["RPUSH",TESTIMONIAL_KEY,...items.map(JSON.stringify)]);
      await pipeline(commands);
      return res.status(200).json({ ok:true, id, status });
    }
    return res.status(405).json({ error:"Méthode non autorisée." });
  } catch (error) {
    console.error("Admin dashboard error", error?.message || error);
    return res.status(500).json({ error:"Impossible de charger le tableau de bord." });
  }
};
