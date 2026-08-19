const { getPool } = require("../../lib/db");
const { requireUser, sendError } = require("../../lib/auth");

module.exports = async function handler(req,res){
  try {
    const user=requireUser(req);
    const id=Number(req.query.id);
    if(!Number.isInteger(id)) return res.status(400).json({ok:false,error:"ID invalide"});
    const db=getPool();

    if(req.method==="GET"){
      const r=await db.query(
        `SELECT id,title,template,data,created_at,updated_at
         FROM user_cvs WHERE id=$1 AND user_id=$2`,
        [id,user.sub]
      );
      if(!r.rowCount) return res.status(404).json({ok:false,error:"CV introuvable"});
      return res.json({ok:true,cv:r.rows[0]});
    }

    if(req.method==="PUT"){
      const { title="Mon CV", template="classic", data={} }=req.body||{};
      const r=await db.query(
        `UPDATE user_cvs SET title=$1,template=$2,data=$3::jsonb,updated_at=NOW()
         WHERE id=$4 AND user_id=$5
         RETURNING id,title,template,data,created_at,updated_at`,
        [String(title).slice(0,160), template==="modern"?"modern":"classic", JSON.stringify(data), id, user.sub]
      );
      if(!r.rowCount) return res.status(404).json({ok:false,error:"CV introuvable"});
      return res.json({ok:true,cv:r.rows[0]});
    }

    if(req.method==="DELETE"){
      const r=await db.query("DELETE FROM user_cvs WHERE id=$1 AND user_id=$2 RETURNING id",[id,user.sub]);
      if(!r.rowCount) return res.status(404).json({ok:false,error:"CV introuvable"});
      return res.json({ok:true});
    }

    res.status(405).json({ok:false,error:"Méthode non autorisée"});
  } catch(err){ sendError(res,err); }
};
