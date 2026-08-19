const jwt = require("jsonwebtoken");

function secret() {
  if (!process.env.AUTH_JWT_SECRET) throw new Error("AUTH_JWT_SECRET manquant");
  return process.env.AUTH_JWT_SECRET;
}

function signUser(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    },
    secret(),
    { expiresIn: "7d" }
  );
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function requireUser(req) {
  const token = readToken(req);

  if (!token) {
    const err = new Error("Authentification requise");
    err.statusCode = 401;
    throw err;
  }

  try {
    return jwt.verify(token, secret());
  } catch {
    const err = new Error("Session invalide ou expirée");
    err.statusCode = 401;
    throw err;
  }
}

function sendError(res, err) {
  console.error("[API ERROR]", err);

  const code = err.statusCode || 500;

  res.status(code).json({
    ok: false,
    error: code === 500 ? "Erreur serveur" : err.message
  });
}

module.exports = { signUser, requireUser, sendError };
