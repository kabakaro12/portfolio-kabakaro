/*
  À charger APRÈS auth-client.js et cv-builder.js dans creer-mon-cv.html.
  Cette couche relie la V1 locale à l'espace utilisateur V2.
*/
document.addEventListener("DOMContentLoaded", async () => {
  const session = getSession();
  const params = new URLSearchParams(location.search);
  const cvId = params.get("id");

  // Add account controls without breaking anonymous use
  const top = document.querySelector(".top-actions");
  if (top) {
    const a = document.createElement("a");
    a.className = "btn ghost";
    a.href = session?.token ? "mes-cv.html" : "connexion.html";
    a.textContent = session?.token ? "Mes CV" : "Connexion";
    top.prepend(a);

    if (session?.token) {
      const cloud = document.createElement("button");
      cloud.className = "btn primary";
      cloud.id = "cloudSaveBtn";
      cloud.textContent = "Sauvegarder en ligne";
      top.prepend(cloud);
      cloud.addEventListener("click", saveCloud);
    }
  }

  if (cvId && session?.token) {
    try {
      const r = await api(`/api/cv/${cvId}`);
      // The V1 builder persists under this local key.
      localStorage.setItem("kabakaro_cv_builder_v1", JSON.stringify({
        data: r.cv.data || {},
        template: r.cv.template || "classic"
      }));
      // Reload only once to let the existing builder consume the loaded state.
      const marker = `cv_loaded_${cvId}`;
      if (sessionStorage.getItem(marker) !== "1") {
        sessionStorage.setItem(marker, "1");
        location.reload();
        return;
      }
    } catch (e) {
      console.warn("Chargement CV:", e);
    }
  }

  async function saveCloud() {
    try {
      const raw = JSON.parse(localStorage.getItem("kabakaro_cv_builder_v1") || "{}");
      const data = raw.data || {};
      const title = data.professionalTitle || [data.firstName, data.lastName].filter(Boolean).join(" ") || "Mon CV";
      const payload = { title, template: raw.template || "classic", data };

      if (cvId) {
        await api(`/api/cv/${cvId}`, { method:"PUT", body:JSON.stringify(payload) });
      } else {
        const r = await api("/api/cv", { method:"POST", body:JSON.stringify(payload) });
        history.replaceState({}, "", `creer-mon-cv.html?id=${r.cv.id}`);
      }
      alert("CV sauvegardé dans votre espace.");
    } catch (e) {
      alert(e.message || "Impossible de sauvegarder.");
    }
  }
});
