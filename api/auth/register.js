const bcrypt = require("bcryptjs");
const { getPool } = require("../../lib/db");
const { signUser, sendError } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });

  try {
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
    if (exists.rowCount) return res.status(409).json({ ok:false, error:"Un compte existe déjà avec cet email" });

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO app_users(first_name,last_name,email,password_hash)
       VALUES($1,$2,$3,$4)
       RETURNING id,first_name,last_name,email`,
      [firstName.trim(), lastName.trim(), normalizedEmail, hash]
    );

    const user = result.rows[0];
    res.status(201).json({
      ok:true,
      token: signUser(user),
      user:{ id:user.id, firstName:user.first_name, lastName:user.last_name, email:user.email }
    });
  } catch (err) { sendError(res, err); }
};
