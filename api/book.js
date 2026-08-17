const { getAccessToken, calendarId, timezone, CALENDAR_API } = require("../lib/google");

async function checkBusy(accessToken, start, end) {
  const response = await fetch(`${CALENDAR_API}/freeBusy`, { method:"POST", headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"}, body:JSON.stringify({timeMin:start,timeMax:end,timeZone:timezone(),items:[{id:calendarId()}]}) });
  const data = await response.json();
  if (!response.ok) throw new Error("Vérification du créneau impossible.");
  return (data.calendars?.[calendarId()]?.busy || []).length > 0;
}
const esc = v => String(v||"").replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));
async function notify({meetingType,name,email,phone,projectType,budget,deadline,project,start,end}){
  const key=process.env.RESEND_API_KEY; if(!key) return {sent:false};
  const owner=process.env.NOTIFICATION_EMAIL||"kabakaro16@gmail.com";
  const from=process.env.NOTIFICATION_FROM||"Kabakaro Portfolio <onboarding@resend.dev>";
  const fmt=new Intl.DateTimeFormat("fr-FR",{timeZone:timezone(),weekday:"long",day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const html=`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827"><h2>Nouvelle demande de rendez-vous à qualifier</h2><p><b>Statut :</b> En attente de validation</p><div style="background:#f3f4f6;border-radius:12px;padding:18px"><p><b>Créneau :</b> ${esc(fmt.format(new Date(start)))}</p><p><b>Client :</b> ${esc(name)}</p><p><b>E-mail :</b> ${esc(email)}</p><p><b>Téléphone :</b> ${esc(phone)}</p><p><b>Rendez-vous :</b> ${esc(meetingType)}</p><p><b>Type de projet :</b> ${esc(projectType)}</p><p><b>Budget :</b> ${esc(budget)}</p><p><b>Délai :</b> ${esc(deadline)}</p><p><b>Description :</b><br>${esc(project).replace(/\n/g,"<br>")}</p></div><p>Valide la demande depuis l'espace administrateur pour créer Google Meet et envoyer l'invitation au client.</p></div>`;
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[owner],subject:`Demande RDV à qualifier — ${name}`,html})});
  return {sent:r.ok};
}
module.exports=async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Méthode non autorisée."});
  try{
    const {meetingType,name,email,phone,projectType,budget,deadline,project,start,end}=req.body||{};
    if(!meetingType||!name||!email||!phone||!projectType||!budget||!deadline||!project||!start||!end) return res.status(400).json({error:"Merci de renseigner toutes les informations du projet."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Adresse e-mail invalide."});
    if(String(project).trim().length<30) return res.status(400).json({error:"Décrivez votre projet en au moins 30 caractères."});
    const token=await getAccessToken();
    if(await checkBusy(token,start,end)) return res.status(409).json({error:"Ce créneau vient d'être réservé. Choisissez-en un autre."});
    const description=`Prospect : ${name}\nE-mail : ${email}\nTéléphone : ${phone}\nType : ${meetingType}\nType projet : ${projectType}\nBudget : ${budget}\nDélai : ${deadline}\n\nProjet :\n${project}\n\nDemande effectuée depuis portfolio-kabakaro.vercel.app`;
    const event={summary:`Rendez-vous portfolio — ${meetingType}`,description,start:{dateTime:start,timeZone:timezone()},end:{dateTime:end,timeZone:timezone()},transparency:"opaque",extendedProperties:{private:{qualificationStatus:"pending",crmStatus:"Nouveau",prospectName:name,prospectEmail:email,prospectPhone:phone,projectType,budget,deadline}}};
    const r=await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(event)});
    const created=await r.json(); if(!r.ok) throw new Error("Google Calendar n'a pas pu enregistrer la demande.");
    const notification=await notify({meetingType,name,email,phone,projectType,budget,deadline,project,start,end});
    return res.status(201).json({ok:true,eventId:created.id,status:"pending",ownerNotificationSent:notification.sent});
  }catch(e){console.error(e);return res.status(500).json({error:"La demande de rendez-vous n'a pas pu être enregistrée."});}
};
