const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL/POSTGRES_URL manquant");
    }

    pool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000
    });

    pool.on("error", (err) => {
      console.error("[DB] PostgreSQL error:", err);
    });
  }

  return pool;
}

module.exports = { getPool };
