const { requireUser, sendError } = require("../../lib/auth");
module.exports = async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({ok:false,error:"Méthode non autorisée"});
  try {
    const u=requireUser(req);
    res.json({ok:true,user:{id:u.sub,email:u.email,firstName:u.firstName,lastName:u.lastName}});
  } catch(err){ sendError(res,err); }
};
