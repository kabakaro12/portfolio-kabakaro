const bcrypt = require("bcryptjs");
const { getPool } = require("../lib/db");
const { signUser, requireUser, sendError } = require("../lib/auth");
const { configured, pipeline } = require("../lib/redis");

const VIEW_KEY = "kabakaro:portfolio:views";

function routeName(req) {
  return String(req.query.route || "").trim();
}

function sendJson(res, status, data) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(data);
}

async function authRegister(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });

  const { firstName, lastName, email, password } = req.body || {};
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ ok:false, error:"Tous les champs sont obligatoires" });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok:false, error:"Le mot de passe doit contenir au moins 8 caractères" });
  }

  const db = getPool();
  const normalizedEmail = email.trim().toLowerCase();

  const exists = await db.query("SELECT id FROM app_users WHERE email=$1", [normalizedEmail]);
  if (exists.rowCount) {
    return res.status(409).json({ ok:false, error:"Un compte existe déjà avec cet email" });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO app_users(first_name,last_name,email,password_hash)
     VALUES($1,$2,$3,$4)
     RETURNING id,first_name,last_name,email`,
    [firstName.trim(), lastName.trim(), normalizedEmail, hash]
  );

  const user = result.rows[0];
  return res.status(201).json({
    ok:true,
    token: signUser(user),
    user:{
      id:user.id,
      firstName:user.first_name,
      lastName:user.last_name,
      email:user.email
    }
  });
}

async function authLogin(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok:false, error:"Email et mot de passe requis" });
  }

  const db = getPool();
  const result = await db.query(
    "SELECT id,first_name,last_name,email,password_hash FROM app_users WHERE email=$1",
    [email.trim().toLowerCase()]
  );

  if (!result.rowCount) return res.status(401).json({ ok:false, error:"Identifiants incorrects" });

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ ok:false, error:"Identifiants incorrects" });

  return res.json({
    ok:true,
    token: signUser(user),
    user:{
      id:user.id,
      firstName:user.first_name,
      lastName:user.last_name,
      email:user.email
    }
  });
}

async function authMe(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });

  const u = requireUser(req);
  return res.json({
    ok:true,
    user:{ id:u.sub, email:u.email, firstName:u.firstName, lastName:u.lastName }
  });
}

async function cvList(req, res) {
  const user = requireUser(req);
  const db = getPool();

  if (req.method === "GET") {
    const r = await db.query(
      `SELECT id,title,template,data,created_at,updated_at
       FROM user_cvs WHERE user_id=$1 ORDER BY updated_at DESC`,
      [user.sub]
    );
    return res.json({ ok:true, cvs:r.rows });
  }

  if (req.method === "POST") {
    const { title="Mon CV", template="classic", data={} } = req.body || {};
    const r = await db.query(
      `INSERT INTO user_cvs(user_id,title,template,data)
       VALUES($1,$2,$3,$4::jsonb)
       RETURNING id,title,template,data,created_at,updated_at`,
      [
        user.sub,
        String(title).slice(0,160),
        template === "modern" ? "modern" : "classic",
        JSON.stringify(data)
      ]
    );
    return res.status(201).json({ ok:true, cv:r.rows[0] });
  }

  return res.status(405).json({ ok:false, error:"Méthode non autorisée" });
}

async function cvDuplicate(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });

  const user = requireUser(req);
  const id = Number((req.body || {}).id);
  const db = getPool();

  const r = await db.query(
    `INSERT INTO user_cvs(user_id,title,template,data)
     SELECT user_id, title || ' - copie', template, data
     FROM user_cvs WHERE id=$1 AND user_id=$2
     RETURNING id,title,template,data,created_at,updated_at`,
    [id, user.sub]
  );

  if (!r.rowCount) return res.status(404).json({ ok:false, error:"CV introuvable" });
  return res.status(201).json({ ok:true, cv:r.rows[0] });
}

async function cvItem(req, res) {
  const user = requireUser(req);
  const id = Number(req.query.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ ok:false, error:"ID invalide" });
  }

  const db = getPool();

  if (req.method === "GET") {
    const r = await db.query(
      `SELECT id,title,template,data,created_at,updated_at
       FROM user_cvs WHERE id=$1 AND user_id=$2`,
      [id, user.sub]
    );
    if (!r.rowCount) return res.status(404).json({ ok:false, error:"CV introuvable" });
    return res.json({ ok:true, cv:r.rows[0] });
  }

  if (req.method === "PUT") {
    const { title="Mon CV", template="classic", data={} } = req.body || {};
    const r = await db.query(
      `UPDATE user_cvs
       SET title=$1,template=$2,data=$3::jsonb,updated_at=NOW()
       WHERE id=$4 AND user_id=$5
       RETURNING id,title,template,data,created_at,updated_at`,
      [
        String(title).slice(0,160),
        template === "modern" ? "modern" : "classic",
        JSON.stringify(data),
        id,
        user.sub
      ]
    );
    if (!r.rowCount) return res.status(404).json({ ok:false, error:"CV introuvable" });
    return res.json({ ok:true, cv:r.rows[0] });
  }

  if (req.method === "DELETE") {
    const r = await db.query(
      "DELETE FROM user_cvs WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, user.sub]
    );
    if (!r.rowCount) return res.status(404).json({ ok:false, error:"CV introuvable" });
    return res.json({ ok:true });
  }

  return res.status(405).json({ ok:false, error:"Méthode non autorisée" });
}

async function views(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return sendJson(res, 405, { error:"Méthode non autorisée." });
  }

  if (!configured()) {
    return sendJson(res, 200, { views:0, today:0, configured:false });
  }

  const day = new Date().toISOString().slice(0, 10);
  const dayKey = `${VIEW_KEY}:day:${day}`;
  const commands = req.method === "POST"
    ? [["INCR", VIEW_KEY], ["INCR", dayKey], ["EXPIRE", dayKey, 7776000]]
    : [["GET", VIEW_KEY], ["GET", dayKey]];

  const values = await pipeline(commands);
  return sendJson(res, 200, {
    views:Number(values[0] || 0),
    today:Number(values[1] || 0),
    configured:true
  });
}

module.exports = async function handler(req, res) {
  try {
    const route = routeName(req);

    if (route === "auth-register") return await authRegister(req, res);
    if (route === "auth-login") return await authLogin(req, res);
    if (route === "auth-me") return await authMe(req, res);

    if (route === "cv-list") return await cvList(req, res);
    if (route === "cv-duplicate") return await cvDuplicate(req, res);
    if (route === "cv-item") return await cvItem(req, res);

    if (route === "views") return await views(req, res);

    return res.status(404).json({ ok:false, error:"Route API inconnue" });
  } catch (err) {
    if (routeName(req) === "views") {
      console.error("Page views error", err?.message || err);
      return sendJson(res, 503, { error:"Compteur temporairement indisponible.", configured:true });
    }

    console.error("[GATEWAY API ERROR]", err);
    return sendError(res, err);
  }
};
