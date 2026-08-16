(() => {
  const $ = id => document.getElementById(id);
  const label = status => ({pending:"En attente",published:"Publié",hidden:"Masqué"}[status] || status);
  const escapeText = value => String(value || "");

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

  async function load() {
    if (!window.adminState?.password) return;
    const root=$("adminTestimonials"); root.innerHTML='<div class="dashboard-message">Chargement du tableau de bord…</div>';
    try {
      const response=await fetch("/api/admin-dashboard",{headers:{"x-admin-password":window.adminState.password}});
      const data=await response.json();
      if(response.status===401) throw new Error("AUTH");
      if(!response.ok) throw new Error(data.error||"Erreur serveur");
      $("dashViewsTotal").textContent=new Intl.NumberFormat("fr-FR").format(data.views.total);
      $("dashViewsToday").textContent=new Intl.NumberFormat("fr-FR").format(data.views.today);
      $("dashViewsWeek").textContent=new Intl.NumberFormat("fr-FR").format(data.views.week);
      $("dashPending").textContent=data.pending;
      renderTestimonials(data.testimonials);
    } catch(error) {
      root.innerHTML=`<div class="dashboard-message">${error.message==="AUTH"?"Session expirée.":escapeText(error.message)}</div>`;
    }
  }

  async function moderate(id,status,button) {
    if(status==="deleted" && !confirm("Supprimer définitivement ce témoignage ?")) return;
    button.disabled=true;
    try {
      const response=await fetch("/api/admin-dashboard",{method:"PATCH",headers:{"Content-Type":"application/json","x-admin-password":window.adminState.password},body:JSON.stringify({id,status})});
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
