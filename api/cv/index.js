const { getPool } = require("../../lib/db");
const { requireUser, sendError } = require("../../lib/auth");

module.exports = async function handler(req,res){
  try {
    const user=requireUser(req);
    const db=getPool();

    if(req.method==="GET"){
      const r=await db.query(
        `SELECT id,title,template,data,created_at,updated_at
         FROM user_cvs WHERE user_id=$1 ORDER BY updated_at DESC`,
        [user.sub]
      );
      return res.json({ok:true,cvs:r.rows});
    }

    if(req.method==="POST"){
      const { title="Mon CV", template="classic", data={} } = req.body || {};
      const r=await db.query(
        `INSERT INTO user_cvs(user_id,title,template,data)
         VALUES($1,$2,$3,$4::jsonb)
         RETURNING id,title,template,data,created_at,updated_at`,
        [user.sub, String(title).slice(0,160), template === "modern" ? "modern" : "classic", JSON.stringify(data)]
      );
      return res.status(201).json({ok:true,cv:r.rows[0]});
    }

    res.status(405).json({ok:false,error:"Méthode non autorisée"});
  } catch(err){ sendError(res,err); }
};
