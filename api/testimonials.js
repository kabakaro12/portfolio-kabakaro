const { configured, pipeline } = require("../lib/redis");
const TESTIMONIAL_KEY = "kabakaro:portfolio:testimonials";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  if (req.method !== "GET") return res.status(405).json({ error:"Méthode non autorisée." });
  if (!configured()) return res.status(200).json({ testimonials:[] });
  try {
    const [items] = await pipeline([["LRANGE", TESTIMONIAL_KEY, 0, 49]]);
    const testimonials = (items || []).map(item => { try { return JSON.parse(item); } catch { return null; } })
      .filter(item => item?.status === "published")
      .map(({ id, name, company, rating, message, createdAt }) => ({ id, name, company, rating, message, createdAt }));
    return res.status(200).json({ testimonials });
  } catch (error) {
    console.error("Public testimonials error", error?.message || error);
    return res.status(200).json({ testimonials:[] });
  }
};
