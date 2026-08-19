const { getPool } = require("../../lib/db");
const { requireUser, sendError } = require("../../lib/auth");

module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"Méthode non autorisée"});
  try {
    const user=requireUser(req);
    const id=Number((req.body||{}).id);
    const db=getPool();
    const r=await db.query(
      `INSERT INTO user_cvs(user_id,title,template,data)
       SELECT user_id, title || ' - copie', template, data
       FROM user_cvs WHERE id=$1 AND user_id=$2
       RETURNING id,title,template,data,created_at,updated_at`,
      [id,user.sub]
    );
    if(!r.rowCount) return res.status(404).json({ok:false,error:"CV introuvable"});
    res.status(201).json({ok:true,cv:r.rows[0]});
  } catch(err){ sendError(res,err); }
};
