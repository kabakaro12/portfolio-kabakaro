const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav");
menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", nav.classList.contains("open"));
});
document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, {threshold: .12});
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

// V15 — Rendez-vous Google Calendar + lien Google Meet automatique
const bookingDate = document.getElementById("bookingDate");
const slotsContainer = document.getElementById("slots");
const selectedSlotInput = document.getElementById("selectedSlot");
const availabilityStatus = document.getElementById("availabilityStatus");
const bookingForm = document.getElementById("bookingForm");

const pad = n => String(n).padStart(2, "0");

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

if (bookingDate) {
  bookingDate.min = todayISO();
}

function setAvailabilityStatus(text, kind = "") {
  if (!availabilityStatus) return;
  availabilityStatus.textContent = text;
  availabilityStatus.className = kind;
}

function renderSlots(slots = []) {
  slotsContainer.innerHTML = "";
  selectedSlotInput.value = "";

  if (!slots.length) {
    setAvailabilityStatus("Aucun créneau libre pour cette date.", "error");
    return;
  }

  setAvailabilityStatus(`${slots.length} créneau${slots.length > 1 ? "x" : ""} disponible${slots.length > 1 ? "s" : ""}.`, "ok");

  slots.forEach(slot => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.dataset.start = slot.start;
    btn.dataset.end = slot.end;
    btn.innerHTML = `<strong>${slot.label}</strong><br><span>30 min</span>`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".slot").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedSlotInput.value = JSON.stringify({ start: slot.start, end: slot.end, label: slot.label });
    });
    slotsContainer.appendChild(btn);
  });
}

bookingDate?.addEventListener("change", async () => {
  const date = bookingDate.value;
  if (!date) return;

  slotsContainer.innerHTML = "";
  selectedSlotInput.value = "";
  setAvailabilityStatus("Recherche des disponibilités…", "loading");

  try {
    const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Impossible de charger les disponibilités.");
    renderSlots(data.slots || []);
  } catch (err) {
    setAvailabilityStatus(err.message || "Erreur de calendrier.", "error");
  }
});

bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = document.getElementById("meetingType").value;
  const name = document.getElementById("bookingName").value.trim();
  const email = document.getElementById("bookingEmail").value.trim();
  const project = document.getElementById("bookingProject").value.trim();
  const msg = document.getElementById("bookingMessage");

  if (!selectedSlotInput.value) {
    msg.textContent = "Choisissez un créneau disponible.";
    msg.classList.remove("success");
    return;
  }

  const slot = JSON.parse(selectedSlotInput.value);
  const submitBtn = bookingForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Confirmation en cours…";
  msg.textContent = "Vérification du créneau dans Google Calendar…";
  msg.classList.remove("success");

  try {
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meetingType: type,
        name,
        email,
        project,
        start: slot.start,
        end: slot.end
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Impossible de créer le rendez-vous.");

    const meetAction = data.meetLink
      ? `<div style="margin-top:10px"><a href="${data.meetLink}" target="_blank" rel="noopener">Ouvrir le lien Google Meet ↗</a></div>`
      : "";

    msg.innerHTML = `
      <strong>Votre rendez-vous a bien été envoyé.</strong><br>
      Rendez-vous confirmé pour <strong>${slot.label}</strong>.<br>
      Vous recevrez également l'invitation Google Calendar par e-mail.<br><br>
      <strong>Nous vous recontacterons pour la suite.</strong>
      Il n'est pas nécessaire de nous relancer ou de refaire une réservation pour le même rendez-vous.
      ${meetAction}
    `;
    msg.classList.add("success");
    bookingForm.reset();
    slotsContainer.innerHTML = "";
    selectedSlotInput.value = "";
    setAvailabilityStatus("Rendez-vous enregistré.", "ok");
  } catch (err) {
    msg.textContent = err.message || "Une erreur est survenue.";
    msg.classList.remove("success");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmer mon rendez-vous";
  }
});

// V16.9 — Assistante automatique gratuite du portfolio
const assistantLauncher = document.getElementById("assistantLauncher");
const assistantPanel = document.getElementById("assistantPanel");
const assistantClose = document.getElementById("assistantClose");
const assistantMessages = document.getElementById("assistantMessages");
const assistantForm = document.getElementById("assistantForm");
const assistantInput = document.getElementById("assistantInput");
const assistantSuggestions = document.getElementById("assistantSuggestions");
const assistantHistory = [];
const issueReportPanel = document.getElementById("issueReportPanel");
const issueReportForm = document.getElementById("issueReportForm");
const issueReportStatus = document.getElementById("issueReportStatus");
const issueSuccessCard = document.getElementById("issueSuccessCard");
let assistantScrollPosition = 0;

function toggleAssistant(open) {
  if (!assistantPanel) return;
  if (open && !document.body.classList.contains("assistant-open")) {
    assistantScrollPosition = window.scrollY;
    document.body.style.top = `-${assistantScrollPosition}px`;
    document.body.classList.add("assistant-open");
  } else if (!open && document.body.classList.contains("assistant-open")) {
    document.body.classList.remove("assistant-open");
    document.body.style.top = "";
    window.scrollTo(0, assistantScrollPosition);
  }
  assistantPanel.hidden = !open;
  assistantLauncher?.setAttribute("aria-expanded", String(open));
  if (open) setTimeout(() => assistantInput?.focus(), 50);
}

function showIssueReport() {
  if (!issueReportPanel) return;
  issueReportPanel.hidden = false;
  issueReportForm.hidden = false;
  issueSuccessCard.hidden = true;
  const pageField = document.getElementById("issuePage");
  if (pageField && !pageField.value) pageField.value = location.hash ? `Section ${location.hash}` : "Page d’accueil";
  setTimeout(() => document.getElementById("issueName")?.focus(), 50);
}

function hideIssueReport() { if (issueReportPanel) issueReportPanel.hidden = true; }

function addAssistantMessage(text, role, extraClass = "") {
  const message = document.createElement("div");
  message.className = `assistant-message ${role} ${extraClass}`.trim();
  message.textContent = text;
  assistantMessages.appendChild(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
  return message;
}

function assistantFallback(question) {
  const value = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const has = (...words) => words.some(word => value.includes(word));
  if (has("bonjour", "bonsoir", "salut", "hello", "coucou")) return "Bonjour 👋 Bienvenue sur le portfolio de Kabakaro Keita. Souhaitez-vous découvrir ses services, ses projets ou prendre rendez-vous ?";
  if (has("horaire", "site ouvert", "24h", "24 h", "prise en charge")) return "Le site est accessible 24 h/24 et 7 j/7. Vous pouvez envoyer votre demande à tout moment ; une personne la prendra en charge dès que possible.";
  if (has("merci", "parfait", "super")) return "Avec plaisir 😊 Je reste disponible si vous souhaitez consulter les projets, demander un devis ou prendre rendez-vous.";
  if (has("qui es", "qui est kabakaro", "presente", "profil")) return "Kabakaro Keita est développeur Full Stack Web & Mobile. Il conçoit des sites modernes, des applications et des solutions numériques sur mesure. Découvrez son profil dans #profil.";
  if (has("service", "propose", "prestation")) return "Kabakaro propose des sites vitrines, des sites professionnels, des applications web/mobile, la maintenance et des solutions sur mesure. Consultez #services.";
  if (has("prix", "tarif", "combien", "cout", "devis")) return "Le tarif dépend des fonctionnalités et de la taille du projet. Décrivez votre besoin à kabakaro16@gmail.com ou prenez rendez-vous dans #rendezvous pour recevoir une proposition adaptée.";
  if (has("delai", "duree", "combien de temps")) return "Le délai dépend du projet et des fonctionnalités demandées. Kabakaro pourra vous donner une estimation après un échange dans #rendezvous.";
  if (has("rendez", "meet", "reservation", "creneau", "disponibilite")) return "Choisissez une date et un créneau dans #rendezvous. Une invitation Google Calendar et un lien Google Meet vous seront envoyés.";
  if (has("contact", "email", "mail", "joindre", "appeler")) return "Contactez Kabakaro à kabakaro16@gmail.com ou au 07 45 93 61 72. Retrouvez aussi les liens utiles dans #contact.";
  if (has("cv", "curriculum", "recrut", "embauch", "emploi", "opportunite")) return "Le CV de Kabakaro est téléchargeable depuis la page d’accueil. Pour une opportunité professionnelle, écrivez à kabakaro16@gmail.com.";
  if (has("technologie", "competence", "langage", "framework", "stack")) return "Kabakaro travaille notamment avec React, React Native, JavaScript/TypeScript, Node.js, Python/Django, Symfony/PHP, PostgreSQL, MongoDB, Docker, Nginx et les API REST. Voir #competences.";
  if (has("g-transport", "gtransport", "transport", "bus")) return "G-Transport est une solution web et mobile de gestion du transport urbain et interurbain en Guinée. Retrouvez sa présentation dans #projets.";
  if (has("g-music", "gmusic", "flexmusic", "musique", "artiste")) return "G-Music est un projet de plateforme musicale destinée aux artistes et auditeurs guinéens. Découvrez-le dans #projets.";
  if (has("proptech", "benne", "dechet")) return "Proptech Solutions est une solution de réservation et de gestion de location de bennes. Le projet est présenté dans #projets.";
  if (has("projet", "realisation", "portfolio")) return "Découvrez les réalisations de Kabakaro, notamment G-Transport, G-Music et Proptech Solutions, dans #projets.";
  if (has("design", "maquette", "ui", "ux", "interface")) return "Découvrez une sélection de maquettes web, mobiles, e-commerce et tableaux de bord réalisées par Kabakaro dans #designs.";
  if (has("site vitrine", "site professionnel", "ecommerce", "e-commerce", "boutique")) return "Oui, Kabakaro peut réaliser ce type de site. Présentez votre activité à kabakaro16@gmail.com ou réservez un échange dans #rendezvous.";
  if (has("paiement", "payer", "facture")) return "Les modalités de paiement et de facturation sont définies dans la proposition correspondant au projet. Prenez rendez-vous dans #rendezvous pour en discuter.";
  if (has("probl", "erreur", "bug", "marche", "bloque", "page blanche", "connexion")) return "Je suis désolée pour ce problème. Actualisez la page. Si le souci continue, indiquez : 1) votre appareil, 2) la page concernée, 3) l’action effectuée et 4) le message affiché, puis écrivez à kabakaro16@gmail.com.";
  if (has("iphone", "android", "mobile")) return "Le portfolio est adapté aux mobiles. Si un problème persiste, indiquez le modèle du téléphone, le navigateur et l’action qui bloque à kabakaro16@gmail.com.";
  if (has("admin", "mot de passe", "password", "secret")) return "L’espace d’administration est réservé au propriétaire. Ne partagez jamais de mot de passe ou de donnée confidentielle dans cette conversation.";
  if (has("humain", "personne", "conseiller")) return "Pour échanger avec Kabakaro, écrivez à kabakaro16@gmail.com, appelez le 07 45 93 61 72 ou prenez rendez-vous dans #rendezvous.";
  if (has("au revoir", "bye", "bonne journee", "bonne nuit")) return "Merci pour votre visite 👋 À bientôt sur le portfolio de Kabakaro !";
  return "Je n’ai pas encore de réponse précise. Je peux vous renseigner sur les services, les tarifs, les projets, les technologies, le CV, le contact, la prise de rendez-vous ou un problème technique.";
}

function linkifyAssistantMessage(message) {
  const text = message.textContent;
  const fragment = document.createDocumentFragment();
  const pattern = /(#[a-z]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
    const link = document.createElement("a");
    link.textContent = match[0];
    link.href = match[0].startsWith("#") ? match[0] : `mailto:${match[0]}`;
    link.addEventListener("click", () => toggleAssistant(false));
    fragment.append(link);
    lastIndex = match.index + match[0].length;
  }
  fragment.append(document.createTextNode(text.slice(lastIndex)));
  message.replaceChildren(fragment);
}

async function askAssistant(question) {
  addAssistantMessage(question, "user");
  assistantHistory.push({ role: "user", content: question });
  const typing = addAssistantMessage("L’assistante vous répond…", "bot", "typing");
  const submit = assistantForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 450));
    typing.remove();
    const answer = assistantFallback(question);
    const reply = addAssistantMessage(answer, "bot");
    linkifyAssistantMessage(reply);
    assistantHistory.push({ role: "assistant", content: answer });
    const normalizedQuestion = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (["probleme", "erreur", "bug", "bloque", "page blanche"].some(word => normalizedQuestion.includes(word))) setTimeout(showIssueReport, 650);
  } finally {
    submit.disabled = false;
    assistantInput.focus();
  }
}

assistantLauncher?.addEventListener("click", () => toggleAssistant(assistantPanel.hidden));
assistantClose?.addEventListener("click", () => toggleAssistant(false));
assistantForm?.addEventListener("submit", (event) => { event.preventDefault(); const question = assistantInput.value.trim(); if (!question) return; assistantInput.value = ""; askAssistant(question); });
assistantSuggestions?.addEventListener("click", (event) => {
  const reportButton = event.target.closest('button[data-action="report-issue"]');
  if (reportButton) return showIssueReport();
  const button = event.target.closest("button[data-question]");
  if (button) askAssistant(button.dataset.question);
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && assistantPanel && !assistantPanel.hidden) toggleAssistant(false); });
document.getElementById("issueReportClose")?.addEventListener("click", hideIssueReport);

issueReportForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = issueReportForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = "Envoi en cours…";
  issueReportStatus.textContent = "Transmission sécurisée de votre demande…";
  issueReportStatus.className = "issue-report-status";
  const payload = Object.fromEntries(new FormData(issueReportForm).entries());
  payload.url = location.href;
  try {
    const response = await fetch("/api/report-issue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible d’envoyer le signalement.");
    issueReportForm.reset();
    issueReportForm.hidden = true;
    document.getElementById("issueTicketId").textContent = data.ticketId;
    issueSuccessCard.hidden = false;
  } catch (error) {
    issueReportStatus.textContent = error.message || "Une erreur est survenue. Écrivez à kabakaro16@gmail.com.";
    issueReportStatus.classList.add("error");
  } finally {
    submit.disabled = false;
    submit.textContent = "Envoyer le signalement";
  }
});
document.getElementById("issueSuccessClose")?.addEventListener("click", () => { hideIssueReport(); toggleAssistant(false); });
document.getElementById("issueReportAnother")?.addEventListener("click", () => { issueSuccessCard.hidden = true; issueReportForm.hidden = false; issueReportStatus.textContent = "Une personne prendra votre demande en charge dès que possible."; issueReportStatus.className = "issue-report-status"; document.getElementById("issueName")?.focus(); });

// Galerie des designs — ouverture en grand
const designLightbox = document.getElementById("designLightbox");
const designLightboxImage = document.getElementById("designLightboxImage");
const designLightboxTitle = document.getElementById("designLightboxTitle");
document.querySelectorAll(".design-image-button").forEach(button => button.addEventListener("click", () => {
  designLightboxImage.src = button.dataset.designImage;
  designLightboxImage.alt = `Design ${button.dataset.designTitle} réalisé par Kabakaro Dev`;
  designLightboxTitle.textContent = button.dataset.designTitle;
  designLightbox.showModal();
}));
document.getElementById("designLightboxClose")?.addEventListener("click", () => designLightbox.close());
designLightbox?.addEventListener("click", event => { if (event.target === designLightbox) designLightbox.close(); });

// V17.7 — Compteur global de visites (une incrémentation par session)
async function updatePageViews() {
  const counter = document.getElementById("pageViewCounter");
  const count = document.getElementById("pageViewCount");
  if (!counter || !count) return;
  try {
    const alreadyCounted = sessionStorage.getItem("kk-page-view-counted") === "yes";
    const response = await fetch("/api/views", { method: alreadyCounted ? "GET" : "POST", cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.configured || !Number.isFinite(Number(data.views))) return;
    if (!alreadyCounted) sessionStorage.setItem("kk-page-view-counted", "yes");
    count.textContent = new Intl.NumberFormat("fr-FR").format(Number(data.views));
    counter.hidden = false;
  } catch (_) {
    // Le compteur reste discret si le service de stockage est indisponible.
  }
}
updatePageViews();

// Collecte d'un témoignage pour vérification avant publication
const testimonialForm = document.getElementById("testimonialForm");
const testimonialStatus = document.getElementById("testimonialStatus");
testimonialForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = testimonialForm.querySelector('button[type="submit"]');
  const formData = new FormData(testimonialForm);
  const payload = Object.fromEntries(formData.entries());
  testimonialStatus.className = "testimonial-status";
  testimonialStatus.textContent = "Envoi en cours…";
  submit.disabled = true;
  try {
    const response = await fetch("/api/testimonial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible d’envoyer le témoignage.");
    testimonialForm.reset();
    testimonialStatus.textContent = "Merci ! Votre témoignage a été reçu et sera vérifié avant publication.";
    testimonialStatus.classList.add("success");
  } catch (error) {
    testimonialStatus.textContent = error.message || "Une erreur est survenue. Vous pouvez écrire à kabakaro16@gmail.com.";
    testimonialStatus.classList.add("error");
  } finally {
    submit.disabled = false;
  }
});

async function loadPublishedTestimonials() {
  const container = document.getElementById("publishedTestimonials");
  const empty = document.getElementById("testimonialEmpty");
  if (!container || !empty) return;
  try {
    const response = await fetch("/api/testimonials", { cache:"no-store" });
    const data = await response.json();
    if (!response.ok || !data.testimonials?.length) return;
    container.replaceChildren(...data.testimonials.map(item => {
      const article = document.createElement("article");
      article.className = "published-testimonial";
      const stars = document.createElement("div"); stars.className="stars"; stars.textContent="★".repeat(Math.max(3,Math.min(5,Number(item.rating)||5)));
      const quote = document.createElement("blockquote"); quote.textContent=item.message;
      const footer = document.createElement("footer");
      const identity = document.createElement("div"); const name=document.createElement("strong"); name.textContent=item.name; const company=document.createElement("span"); company.textContent=item.company||"Client"; identity.append(name,company);
      const verified=document.createElement("span"); verified.className="verified-review"; verified.textContent="✓ AVIS VÉRIFIÉ";
      footer.append(identity,verified); article.append(stars,quote,footer); return article;
    }));
    empty.hidden = true; container.hidden = false;
  } catch (_) {}
}
loadPublishedTestimonials();
