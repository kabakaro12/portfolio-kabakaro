const { getAccessToken, calendarId, timezone, CALENDAR_API } = require("../lib/google");
function authorized(req){const expected=process.env.ADMIN_PASSWORD,provided=req.headers["x-admin-password"];if(!expected)throw new Error("ADMIN_PASSWORD manquant");return typeof provided==="string"&&provided===expected;}
module.exports=async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Méthode non autorisée."});
 try{
  if(!authorized(req))return res.status(401).json({error:"Mot de passe administrateur incorrect."});
  const {eventId,action}=req.body||{}; if(!eventId||!["confirm","cancel"].includes(action))return res.status(400).json({error:"Action invalide."});
  const token=await getAccessToken(); const url=`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`;
  const gr=await fetch(url,{headers:{Authorization:`Bearer ${token}`}}); const ev=await gr.json(); if(!gr.ok)throw new Error("Rendez-vous introuvable.");
  if(action==="cancel"){
    const dr=await fetch(`${url}?sendUpdates=none`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); if(!dr.ok&&dr.status!==204)throw new Error("Annulation impossible.");
    return res.status(200).json({ok:true,status:"Annulé"});
  }
  const priv=ev.extendedProperties?.private||{}; const email=priv.prospectEmail||((ev.description||"").match(/^E-mail\s*:\s*(.+)$/mi)||[])[1];
  if(!email)return res.status(400).json({error:"E-mail du client introuvable."});
  const patch={attendees:[{email}],conferenceData:{createRequest:{requestId:`portfolio-confirm-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,conferenceSolutionKey:{type:"hangoutsMeet"}}},reminders:{useDefault:false,overrides:[{method:"email",minutes:1440},{method:"popup",minutes:30}]},extendedProperties:{private:{...priv,qualificationStatus:"confirmed"}}};
  const pr=await fetch(`${url}?sendUpdates=all&conferenceDataVersion=1`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(patch)}); const updated=await pr.json(); if(!pr.ok)throw new Error("Confirmation impossible.");
  const meetLink=updated.hangoutLink||updated.conferenceData?.entryPoints?.find(p=>p.entryPointType==="video")?.uri||null;
  return res.status(200).json({ok:true,status:"Confirmé",meetLink,calendarLink:updated.htmlLink||null});
 }catch(e){console.error("[admin-appointment-action]",e);return res.status(500).json({error:e.message||"Action impossible."});}
};
