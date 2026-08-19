document.addEventListener("DOMContentLoaded",async()=>{
  const s=getSession();
  if(!s?.token){location.href="connexion.html";return}
  hello.textContent=`Bonjour ${s.user?.firstName||""} 👋`;
  logoutBtn.addEventListener("click",logout);

  async function load(){
    try{
      const r=await api("/api/cv");
      const list=r.cvs||[];
      if(!list.length){cvGrid.innerHTML=`<div class="card empty"><h2>Aucun CV</h2><p class="muted">Créez votre premier CV professionnel.</p><a class="btn primary" href="creer-mon-cv.html?new=1">Créer mon CV</a></div>`;return}
      cvGrid.innerHTML=list.map(cv=>`<article class="cv-card">
        <h3>${escapeHtml(cv.title)}</h3><small>Modifié le ${new Date(cv.updated_at).toLocaleDateString("fr-FR")}</small>
        <div class="actions">
          <a class="btn primary" href="creer-mon-cv.html?id=${cv.id}">Modifier</a>
          <button class="btn ghost" data-dup="${cv.id}">Dupliquer</button>
          <button class="btn ghost" data-del="${cv.id}">Supprimer</button>
        </div></article>`).join("");
      document.querySelectorAll("[data-dup]").forEach(b=>b.onclick=async()=>{await api("/api/cv/duplicate",{method:"POST",body:JSON.stringify({id:+b.dataset.dup})});load()});
      document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(confirm("Supprimer ce CV ?")){await api(`/api/cv/${b.dataset.del}`,{method:"DELETE"});load()}});
    }catch(err){if(/session|auth/i.test(err.message)) logout(); else cvGrid.innerHTML=`<div class="card">${escapeHtml(err.message)}</div>`}
  }
  load();
});
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
