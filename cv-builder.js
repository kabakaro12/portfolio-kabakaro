(() => {
  const STORAGE_KEY = "kabakaro_cv_builder_v1";
  const state = {
    step: 1,
    template: "classic",
    data: {
      firstName:"", lastName:"", professionalTitle:"", email:"", phone:"", city:"",
      linkedin:"", github:"", portfolio:"", summary:"",
      experiences:[{jobTitle:"",company:"",city:"",startDate:"",endDate:"",current:false,description:""}],
      educations:[{degree:"",school:"",field:"",startDate:"",endDate:""}],
      skills:["React","JavaScript"],
      languages:[{name:"Français",level:"Courant"}]
    }
  };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function load(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(saved?.data){ state.data = {...state.data, ...saved.data}; state.template = saved.template || "classic"; }
    } catch(e){}
  }

  function save(show=true){
    localStorage.setItem(STORAGE_KEY, JSON.stringify({data:state.data, template:state.template}));
    if(show) toast("CV enregistré sur cet appareil");
  }

  function toast(msg){
    const t=$("#toast"); t.textContent=msg; t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1800);
  }

  function field(id, key){
    const el=$("#"+id); el.value=state.data[key]||"";
    el.addEventListener("input",()=>{state.data[key]=el.value; render(); autosave();});
  }

  let timer;
  function autosave(){ clearTimeout(timer); timer=setTimeout(()=>save(false),500); }

  function bindBase(){
    [
      ["firstName","firstName"],["lastName","lastName"],["professionalTitle","professionalTitle"],
      ["email","email"],["phone","phone"],["city","city"],["linkedin","linkedin"],
      ["github","github"],["portfolio","portfolio"],["summary","summary"]
    ].forEach(x=>field(...x));
    $("#summary").addEventListener("input",()=>$("#summaryCount").textContent=$("#summary").value.length);
    $("#summaryCount").textContent=$("#summary").value.length;
  }

  function renderExperiences(){
    const box=$("#experiences");
    box.innerHTML=state.data.experiences.map((e,i)=>`
      <div class="entry">
        <div class="entry-title"><strong>Expérience ${i+1}</strong>${state.data.experiences.length>1?`<button class="remove" data-remove-exp="${i}">Supprimer</button>`:""}</div>
        <label>Poste<input data-exp="${i}" data-k="jobTitle" value="${esc(e.jobTitle)}"></label>
        <label>Entreprise<input data-exp="${i}" data-k="company" value="${esc(e.company)}"></label>
        <label>Ville<input data-exp="${i}" data-k="city" value="${esc(e.city)}"></label>
        <div class="grid2">
          <label>Début<input type="month" data-exp="${i}" data-k="startDate" value="${esc(e.startDate)}"></label>
          <label>Fin<input type="month" data-exp="${i}" data-k="endDate" value="${esc(e.endDate)}" ${e.current?"disabled":""}></label>
        </div>
        <label><span><input type="checkbox" data-current="${i}" ${e.current?"checked":""} style="width:auto;margin-right:8px">Poste actuel</span></label>
        <label>Description<textarea rows="4" data-exp="${i}" data-k="description">${esc(e.description)}</textarea></label>
      </div>`).join("");
    $$("[data-exp]").forEach(el=>el.addEventListener("input",()=>{state.data.experiences[+el.dataset.exp][el.dataset.k]=el.value;renderPreview();autosave();}));
    $$("[data-current]").forEach(el=>el.addEventListener("change",()=>{state.data.experiences[+el.dataset.current].current=el.checked;renderExperiences();renderPreview();autosave();}));
    $$("[data-remove-exp]").forEach(el=>el.addEventListener("click",()=>{state.data.experiences.splice(+el.dataset.removeExp,1);renderExperiences();renderPreview();autosave();}));
  }

  function renderEducations(){
    const box=$("#educations");
    box.innerHTML=state.data.educations.map((e,i)=>`
      <div class="entry">
        <div class="entry-title"><strong>Formation ${i+1}</strong>${state.data.educations.length>1?`<button class="remove" data-remove-edu="${i}">Supprimer</button>`:""}</div>
        <label>Diplôme<input data-edu="${i}" data-k="degree" value="${esc(e.degree)}"></label>
        <label>Établissement<input data-edu="${i}" data-k="school" value="${esc(e.school)}"></label>
        <label>Domaine<input data-edu="${i}" data-k="field" value="${esc(e.field)}"></label>
        <div class="grid2">
          <label>Début<input type="month" data-edu="${i}" data-k="startDate" value="${esc(e.startDate)}"></label>
          <label>Fin<input type="month" data-edu="${i}" data-k="endDate" value="${esc(e.endDate)}"></label>
        </div>
      </div>`).join("");
    $$("[data-edu]").forEach(el=>el.addEventListener("input",()=>{state.data.educations[+el.dataset.edu][el.dataset.k]=el.value;renderPreview();autosave();}));
    $$("[data-remove-edu]").forEach(el=>el.addEventListener("click",()=>{state.data.educations.splice(+el.dataset.removeEdu,1);renderEducations();renderPreview();autosave();}));
  }

  function renderSkills(){
    $("#skills").innerHTML=state.data.skills.map((s,i)=>`
      <div class="grid2"><label>Compétence ${i+1}<input data-skill="${i}" value="${esc(s)}"></label>
      ${state.data.skills.length>1?`<button class="remove" data-remove-skill="${i}" style="align-self:center">Supprimer</button>`:""}</div>`).join("");
    $$("[data-skill]").forEach(el=>el.addEventListener("input",()=>{state.data.skills[+el.dataset.skill]=el.value;renderPreview();autosave();}));
    $$("[data-remove-skill]").forEach(el=>el.addEventListener("click",()=>{state.data.skills.splice(+el.dataset.removeSkill,1);renderSkills();renderPreview();autosave();}));
  }

  function renderLanguages(){
    $("#languages").innerHTML=state.data.languages.map((l,i)=>`
      <div class="grid2">
        <label>Langue<input data-lang="${i}" data-k="name" value="${esc(l.name)}"></label>
        <label>Niveau<select data-lang="${i}" data-k="level">
          ${["Débutant","Intermédiaire","Professionnel","Courant","Langue maternelle"].map(x=>`<option ${x===l.level?"selected":""}>${x}</option>`).join("")}
        </select></label>
      </div>`).join("");
    $$("[data-lang]").forEach(el=>el.addEventListener("input",()=>{state.data.languages[+el.dataset.lang][el.dataset.k]=el.value;renderPreview();autosave();}));
  }

  function fmt(v){
    if(!v)return "";
    const [y,m]=v.split("-");
    return new Intl.DateTimeFormat("fr-FR",{month:"short",year:"numeric"}).format(new Date(+y,+m-1,1));
  }

  function renderPreview(){
    const d=state.data;
    $("#rName").textContent=(d.firstName+" "+d.lastName).trim()||"Votre nom";
    $("#rTitle").textContent=d.professionalTitle||"Votre titre professionnel";
    $("#rContact").textContent=[d.email,d.phone,d.city].filter(Boolean).join(" • ")||"email • téléphone • ville";
    $("#rLinks").textContent=[d.linkedin,d.github,d.portfolio].filter(Boolean).join(" • ");
    $("#rSummary").textContent=d.summary;
    $("#summarySection").hidden=!d.summary.trim();

    const exps=d.experiences.filter(e=>e.jobTitle||e.company||e.description);
    $("#experienceSection").hidden=!exps.length;
    $("#rExperiences").innerHTML=exps.map(e=>`
      <div class="resume-item">
        <div class="resume-row"><strong>${esc(e.jobTitle||"Poste")}</strong><span>${esc(fmt(e.startDate))}${e.startDate?" – ":""}${esc(e.current?"Aujourd’hui":fmt(e.endDate))}</span></div>
        <div class="resume-meta">${esc([e.company,e.city].filter(Boolean).join(" • "))}</div>
        ${e.description?`<p>${esc(e.description)}</p>`:""}
      </div>`).join("");

    const edus=d.educations.filter(e=>e.degree||e.school||e.field);
    $("#educationSection").hidden=!edus.length;
    $("#rEducations").innerHTML=edus.map(e=>`
      <div class="resume-item">
        <div class="resume-row"><strong>${esc(e.degree||"Diplôme")}</strong><span>${esc(fmt(e.startDate))}${e.startDate?" – ":""}${esc(fmt(e.endDate))}</span></div>
        <div class="resume-meta">${esc([e.school,e.field].filter(Boolean).join(" • "))}</div>
      </div>`).join("");

    $("#rSkills").innerHTML=d.skills.filter(Boolean).map(s=>`<span>${esc(s)}</span>`).join("");
    $("#rLanguages").innerHTML=d.languages.filter(l=>l.name).map(l=>`<p class="lang"><strong>${esc(l.name)}</strong> — ${esc(l.level)}</p>`).join("");

    $("#resume").className="resume "+state.template;
    $$("[data-template]").forEach(b=>b.classList.toggle("active",b.dataset.template===state.template));
  }

  function renderStep(){
    $$(".step").forEach(b=>b.classList.toggle("active",+b.dataset.step===state.step));
    $$(".step-panel").forEach(p=>p.classList.toggle("active",+p.dataset.panel===state.step));
    $("#prevBtn").disabled=state.step===1;
    $("#nextBtn").textContent=state.step===5?"Télécharger PDF":"Continuer";
  }

  function render(){
    renderExperiences(); renderEducations(); renderSkills(); renderLanguages(); renderPreview(); renderStep();
  }

  load();
  bindBase();
  render();

  $$(".step").forEach(b=>b.addEventListener("click",()=>{state.step=+b.dataset.step;renderStep();}));
  $("#prevBtn").addEventListener("click",()=>{state.step=Math.max(1,state.step-1);renderStep();});
  $("#nextBtn").addEventListener("click",()=>{if(state.step<5){state.step++;renderStep();}else window.print();});
  $("#addExperience").addEventListener("click",()=>{state.data.experiences.push({jobTitle:"",company:"",city:"",startDate:"",endDate:"",current:false,description:""});renderExperiences();autosave();});
  $("#addEducation").addEventListener("click",()=>{state.data.educations.push({degree:"",school:"",field:"",startDate:"",endDate:""});renderEducations();autosave();});
  $("#addSkill").addEventListener("click",()=>{state.data.skills.push("");renderSkills();autosave();});
  $("#addLanguage").addEventListener("click",()=>{state.data.languages.push({name:"",level:"Intermédiaire"});renderLanguages();autosave();});
  $$("[data-template]").forEach(b=>b.addEventListener("click",()=>{state.template=b.dataset.template;renderPreview();autosave();}));
  $("#saveBtn").addEventListener("click",()=>save(true));
  $("#printBtn").addEventListener("click",()=>window.print());
  $("#resetBtn").addEventListener("click",()=>{
    if(confirm("Créer un nouveau CV ? Les données enregistrées sur cet appareil seront effacées.")){
      localStorage.removeItem(STORAGE_KEY); location.reload();
    }
  });
})();
