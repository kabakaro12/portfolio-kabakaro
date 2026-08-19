const bcrypt = require("bcryptjs");
const { getPool } = require("../../lib/db");
const { signUser, sendError } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok:false, error:"Email et mot de passe requis" });

    const db = getPool();
    const result = await db.query(
      "SELECT id,first_name,last_name,email,password_hash FROM app_users WHERE email=$1",
      [email.trim().toLowerCase()]
    );
    if (!result.rowCount) return res.status(401).json({ ok:false, error:"Identifiants incorrects" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ ok:false, error:"Identifiants incorrects" });

    res.json({
      ok:true,
      token: signUser(user),
      user:{ id:user.id, firstName:user.first_name, lastName:user.last_name, email:user.email }
    });
  } catch (err) { sendError(res, err); }
};
