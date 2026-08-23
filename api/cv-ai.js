export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');

  if(req.method!=='POST'){
    return res.status(405).json({error:'Méthode non autorisée'});
  }

  if(!process.env.OPENAI_API_KEY){
    return res.status(503).json({
      error:'L’IA n’est pas activée : ajoutez OPENAI_API_KEY dans Vercel > Settings > Environment Variables, puis redéployez.'
    });
  }

  const {action,data={},jobOffer='',rawText=''}=req.body||{};

  const rules=`Tu es un assistant CV francophone.
Tu ne dois jamais inventer une expérience, une entreprise, un diplôme, une date ou une compétence.
Réponds uniquement avec un objet JSON valide, sans Markdown :
{"explanation":"texte court","data":{...}}
Le champ data doit rester compatible avec :
firstName,lastName,professionalTitle,email,phone,city,linkedin,github,portfolio,summary,experiences,educations,skills,languages.`;

  let task='';
  if(action==='import'){
    task=`Structure uniquement les informations réellement présentes dans ce CV :
${String(rawText).slice(0,50000)}`;
  }else if(action==='summary'){
    task=`Améliore uniquement le résumé professionnel, sans inventer :
${JSON.stringify(data)}`;
  }else if(action==='experiences'){
    task=`Améliore la rédaction des descriptions d'expériences sans ajouter de faits :
${JSON.stringify(data)}`;
  }else if(action==='adapt'){
    if(!jobOffer.trim()) return res.status(400).json({error:'Collez d’abord une offre d’emploi.'});
    task=`Adapte le résumé et l'ordre des compétences EXISTANTES à cette offre, sans inventer.
OFFRE:
${jobOffer}
CV:
${JSON.stringify(data)}`;
  }else if(action==='ats'){
    if(!jobOffer.trim()) return res.status(400).json({error:'Collez d’abord une offre d’emploi.'});
    task=`Analyse les mots-clés ATS de l'offre. Dans explanation, indique présents et manquants. N'ajoute aucune compétence.
OFFRE:
${jobOffer}
CV:
${JSON.stringify(data)}`;
  }else{
    return res.status(400).json({error:'Action IA inconnue.'});
  }

  try{
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`
      },
      body:JSON.stringify({
        model:'gpt-5.6-luna',
        input:rules+'\n\n'+task
      })
    });

    const payload=await r.json();

    if(!r.ok){
      return res.status(502).json({
        error:payload?.error?.message||'Le service OpenAI a refusé la requête.'
      });
    }

    const text=(payload.output||[])
      .flatMap(item=>item.content||[])
      .filter(c=>c.type==='output_text')
      .map(c=>c.text||'')
      .join('')
      || payload.output_text
      || '';

    if(!text.trim()){
      return res.status(502).json({error:'Aucune réponse reçue du modèle IA.'});
    }

    let cleaned=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    let parsed;
    try{
      parsed=JSON.parse(cleaned);
    }catch{
      const a=cleaned.indexOf('{');
      const b=cleaned.lastIndexOf('}');
      if(a<0||b<=a) throw new Error('JSON introuvable');
      parsed=JSON.parse(cleaned.slice(a,b+1));
    }

    return res.status(200).json({
      explanation:parsed.explanation||'Analyse terminée.',
      data:parsed.data||null
    });

  }catch(err){
    console.error('cv-ai',err);
    return res.status(500).json({
      error:'Erreur serveur IA. Vérifiez OPENAI_API_KEY et les logs Vercel.'
    });
  }
}