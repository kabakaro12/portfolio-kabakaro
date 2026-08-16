(() => {
  const $ = id => document.getElementById(id);
  const label = status => ({pending:"En attente",published:"Publié",hidden:"Masqué"}[status] || status);
  const escapeText = value => String(value || "");
  const adminHeaders = (json=false) => ({
    ...(json ? {"Content-Type":"application/json"} : {}),
    "Authorization":`Bearer ${encodeURIComponent(String(window.adminState?.password || ""))}`
  });
  const showMessage = text => {
    const root=$("adminTestimonials");
    const box=document.createElement("div"); box.className="dashboard-message"; box.textContent=text;
    root.replaceChildren(box);
  };

  function renderTestimonials(items) {
    const root = $("adminTestimonials");
    if (!items?.length) { root.innerHTML='<div class="dashboard-message">Aucun témoignage reçu pour le moment.</div>'; return; }
    root.replaceChildren(...items.map(item => {
      const card=document.createElement("article"); card.className="admin-review";
      const head=document.createElement("div"); head.className="admin-review-head";
      const who=document.createElement("div"); const strong=document.createElement("strong"); strong.textContent=escapeText(item.name); const meta=document.createElement("small"); meta.textContent=`${escapeText(item.company||"Client")} • ${Number(item.rating)||0}/5 • ${new Date(item.createdAt).toLocaleDateString("fr-FR")}`; who.append(strong,document.createElement("br"),meta);
      const status=document.createElement("span"); status.className=`status-${item.status}`; status.textContent=label(item.status); head.append(who,status);
      const message=document.createElement("p"); message.textContent=escapeText(item.message);
      const contact=document.createElement("small"); contact.textContent=escapeText(item.email);
      const actions=document.createElement("div"); actions.className="review-actions";
      [["published","Publier","publish-review"],["hidden","Masquer","hide-review"],["deleted","Supprimer","delete-review"]].forEach(([value,text,cls])=>{ const button=document.createElement("button"); button.type="button"; button.className=cls; button.textContent=text; button.addEventListener("click",()=>moderate(item.id,value,button)); actions.append(button); });
      card.append(head,message,contact,actions); return card;
    }));
  }

  const quoteLabel = status => ({new:"Nouveau",contacted:"Contacté",proposal:"Proposition envoyée",won:"Gagné",lost:"Perdu"}[status] || status);
  function renderQuotes(items) {
    const root=$("adminQuotes");
    if(!items?.length){root.innerHTML='<div class="dashboard-message">Aucune demande de devis reçue.</div>';return;}
    root.replaceChildren(...items.map(item=>{
      const card=document.createElement("article"); card.className="admin-quote-card";
      const head=document.createElement("div"); head.className="admin-review-head";
      const who=document.createElement("div"); const strong=document.createElement("strong"); strong.textContent=item.name; const meta=document.createElement("small"); meta.textContent=`${item.id} • ${new Date(item.createdAt).toLocaleDateString("fr-FR")}`; who.append(strong,document.createElement("br"),meta);
      const status=document.createElement("span"); status.className=`status-${item.status}`; status.textContent=quoteLabel(item.status); head.append(who,status);
      const estimate=document.createElement("p"); estimate.className="estimate"; estimate.textContent=`${Number(item.estimatedMin).toLocaleString("fr-FR")} € – ${Number(item.estimatedMax).toLocaleString("fr-FR")} €`;
      const project=document.createElement("p"); project.textContent=`${item.projectType} • ${item.pages} page(s)${item.deadline?" • "+item.deadline:""}\n${item.details}`;
      const contact=document.createElement("a"); contact.href=`mailto:${item.email}?subject=${encodeURIComponent("Votre demande de devis "+item.id)}`; contact.textContent=`${item.email}${item.phone?" • "+item.phone:""}`;
      const select=document.createElement("select"); [["new","Nouveau"],["contacted","Contacté"],["proposal","Proposition envoyée"],["won","Gagné"],["lost","Perdu"]].forEach(([value,text])=>{const option=document.createElement("option");option.value=value;option.textContent=text;option.selected=item.status===value;select.append(option);}); select.addEventListener("change",()=>updateQuote(item.id,select.value,select));
      const del=document.createElement("button"); del.type="button"; del.className="delete-review"; del.textContent="Supprimer"; del.addEventListener("click",()=>updateQuote(item.id,"deleted",del));
      card.append(head,estimate,project,contact,select,del); return card;
    }));
  }

  async function load() {
    if (!window.adminState?.password) return;
    const root=$("adminTestimonials"); showMessage("Chargement du tableau de bord…");
    try {
      const endpoint=new URL("/api/admin-dashboard",window.location.origin).toString();
      const response=await fetch(endpoint,{headers:adminHeaders(),cache:"no-store"});
      const data=await response.json();
      if(response.status===401) throw new Error("AUTH");
      if(!response.ok) throw new Error(data.error||"Erreur serveur");
      $("dashViewsTotal").textContent=new Intl.NumberFormat("fr-FR").format(data.views.total);
      $("dashViewsToday").textContent=new Intl.NumberFormat("fr-FR").format(data.views.today);
      $("dashViewsWeek").textContent=new Intl.NumberFormat("fr-FR").format(data.views.week);
      $("dashPending").textContent=data.pending;
      $("dashNewQuotes").textContent=data.newQuotes || 0;
      renderQuotes(data.quotes);
      renderTestimonials(data.testimonials);
    } catch(error) {
      showMessage(error.message==="AUTH"?"Session expirée.":escapeText(error.message));
    }
  }

  async function updateQuote(id,status,control){
    if(status==="deleted"&&!confirm("Supprimer définitivement cette demande de devis ?")) return;
    control.disabled=true;
    try{const endpoint=new URL("/api/admin-dashboard",window.location.origin).toString();const response=await fetch(endpoint,{method:"PATCH",headers:adminHeaders(true),body:JSON.stringify({entity:"quote",id,status})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Action impossible");await load();}catch(error){alert(error.message);control.disabled=false;}
  }

  async function moderate(id,status,button) {
    if(status==="deleted" && !confirm("Supprimer définitivement ce témoignage ?")) return;
    button.disabled=true;
    try {
      const endpoint=new URL("/api/admin-dashboard",window.location.origin).toString();
      const response=await fetch(endpoint,{method:"PATCH",headers:adminHeaders(true),body:JSON.stringify({id,status})});
      const data=await response.json(); if(!response.ok) throw new Error(data.error||"Action impossible"); await load();
    } catch(error) { alert(error.message); button.disabled=false; }
  }

  window.loadAdminDashboard=load;
  $("refreshDashboard")?.addEventListener("click",load);
  let idleTimer;
  const resetIdle=()=>{ clearTimeout(idleTimer); idleTimer=setTimeout(()=>$("logoutBtn")?.click(),30*60*1000); };
  ["click","keydown","touchstart"].forEach(event=>document.addEventListener(event,resetIdle,{passive:true})); resetIdle();
  if(window.adminState?.password) load();
})();
