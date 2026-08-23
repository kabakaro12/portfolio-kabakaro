(() => {
  const STORAGE_KEY='kabakaro_cv_builder_v2';
  const $=s=>document.querySelector(s);

  function modal(title,body){
    const m=$('#aiModal');
    if(!m) return;
    $('#aiTitle').textContent=title;
    $('#aiBody').textContent=body;
    $('#aiApply').hidden=true;
    m.hidden=false;
  }

  function readSaved(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return saved.data||{};
    }catch{ return {}; }
  }

  function saveData(data){
    let saved={};
    try{ saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); }catch{}
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      data,
      template:saved.template||'classic',
      color:saved.color||'#2563eb'
    }));
  }

  async function api(action,extra={}){
    modal('Analyse IA en cours…','Préparation de vos suggestions.');
    try{
      const url=new URL('/api/cv-ai',window.location.origin);
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),45000);

      const response=await fetch(url.toString(),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action,
          data:readSaved(),
          jobOffer:$('#jobOffer')?.value||'',
          ...extra
        }),
        signal:controller.signal
      });
      clearTimeout(timer);

      const raw=await response.text();
      let json;
      try{ json=JSON.parse(raw); }
      catch{ throw new Error('Le serveur IA a renvoyé une réponse invalide.'); }

      if(!response.ok) throw new Error(json.error||`Erreur IA (${response.status})`);
      return json;
    }catch(err){
      const message=err?.name==='AbortError'
        ? 'Le serveur a mis trop de temps à répondre. Réessayez.'
        : (err?.message||'Erreur IA.');
      modal('Impossible de lancer l’IA',message);
      throw err;
    }
  }

  async function extract(file){
    const status=$('#importStatus');
    status.textContent='Lecture du fichier…';

    try{
      const ext=(file.name.split('.').pop()||'').toLowerCase();
      let text='';

      if(ext==='txt'){
        text=await file.text();
      }else if(ext==='docx'){
        if(typeof mammoth==='undefined') throw new Error('Le lecteur DOCX n’est pas disponible.');
        const ab=await file.arrayBuffer();
        text=(await mammoth.extractRawText({arrayBuffer:ab})).value||'';
      }else if(ext==='pdf'){
        if(typeof pdfjsLib==='undefined') throw new Error('Le lecteur PDF n’est pas disponible.');
        const ab=await file.arrayBuffer();
        const pdf=await pdfjsLib.getDocument({
          data:new Uint8Array(ab),
          disableWorker:true
        }).promise;
        for(let p=1;p<=pdf.numPages;p++){
          const page=await pdf.getPage(p);
          const c=await page.getTextContent();
          text+=c.items.map(i=>i.str||'').join(' ')+'\n';
        }
      }else{
        throw new Error('Format non supporté. Utilisez PDF, DOCX ou TXT.');
      }

      if(!text.trim()) throw new Error('Aucun texte exploitable détecté dans ce fichier.');

      status.textContent='CV lu. Analyse IA en cours…';
      const result=await api('import',{rawText:text});

      if(!result?.data) throw new Error('L’IA n’a pas renvoyé de CV structuré.');

      saveData({...readSaved(),...result.data});
      status.textContent='CV importé et structuré ✓';
      modal('CV importé','Votre CV a été analysé et structuré. La page va se recharger.');
      setTimeout(()=>location.reload(),700);

    }catch(err){
      status.textContent='Erreur : '+(err?.message||'Import impossible');
    }
  }

  // Remplace l'ancien import AVANT son handler target.
  document.addEventListener('change',e=>{
    if(e.target?.id!=='cvFile') return;
    e.stopImmediatePropagation();
    const file=e.target.files?.[0];
    if(file) extract(file);
  },true);

  // Remplace les anciens boutons IA.
  document.addEventListener('click',async e=>{
    const btn=e.target.closest?.('[data-ai]');
    if(!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const action=btn.dataset.ai;
    try{
      const result=await api(action);
      const m=$('#aiModal');
      $('#aiTitle').textContent='Suggestions prêtes';
      $('#aiBody').textContent=result.explanation||'Analyse terminée.';

      if(result.data){
        const apply=$('#aiApply');
        apply.hidden=false;
        apply.onclick=()=>{
          saveData({...readSaved(),...result.data});
          m.hidden=true;
          location.reload();
        };
      }
    }catch{}
  },true);
})();