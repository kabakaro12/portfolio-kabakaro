export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Méthode non autorisée'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'La fonction IA n’est pas encore configurée sur Vercel.'});
  const {action,data,jobOffer,rawText}=req.body||{};
  const rules=`Tu es un assistant CV francophone. Tu dois améliorer la forme sans inventer d'expérience, diplôme, entreprise, date ou compétence. Retourne uniquement un JSON valide avec {"explanation":"...","data":{...}}. Le champ data doit rester compatible avec cette structure: firstName,lastName,professionalTitle,email,phone,city,linkedin,github,portfolio,summary,experiences[],educations[],skills[],languages[].`;
  let task='';
  if(action==='import') task=`Analyse ce texte de CV importé et structure uniquement les informations réellement présentes. Texte:\n${rawText}`;
  else if(action==='summary') task=`Améliore uniquement le résumé professionnel du CV suivant, sans inventer: ${JSON.stringify(data)}`;
  else if(action==='experiences') task=`Réécris les descriptions d'expériences pour être plus claires, professionnelles et orientées résultats, sans ajouter de faits: ${JSON.stringify(data)}`;
  else if(action==='adapt') task=`Adapte le CV à cette offre en réorganisant le résumé et les compétences déjà présentes, sans inventer. Offre: ${jobOffer}\nCV:${JSON.stringify(data)}`;
  else if(action==='ats') task=`Analyse les mots-clés ATS de l'offre et indique dans explanation les mots-clés présents/manquants. Ne modifie pas le CV sauf réorganisation des compétences déjà réelles. Offre:${jobOffer}\nCV:${JSON.stringify(data)}`;
  else return res.status(400).json({error:'Action inconnue'});
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:'gpt-5.6-luna',input:rules+'\n\n'+task})});
    const payload=await r.json();
    if(!r.ok) return res.status(502).json({error:payload?.error?.message||'Erreur du service IA'});
    const text=(payload.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('') || payload.output_text || '';
    const cleaned=text.replace(/^```json\s*/i,'').replace(/```$/,'').trim();
    const parsed=JSON.parse(cleaned);
    return res.status(200).json(parsed);
  }catch(e){return res.status(500).json({error:'Réponse IA invalide ou indisponible.'})}
}