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

// V16.8 — Assistante IA du portfolio
const assistantLauncher = document.getElementById("assistantLauncher");
const assistantPanel = document.getElementById("assistantPanel");
const assistantClose = document.getElementById("assistantClose");
const assistantMessages = document.getElementById("assistantMessages");
const assistantForm = document.getElementById("assistantForm");
const assistantInput = document.getElementById("assistantInput");
const assistantSuggestions = document.getElementById("assistantSuggestions");
const assistantHistory = [];

function toggleAssistant(open) {
  if (!assistantPanel) return;
  assistantPanel.hidden = !open;
  assistantLauncher?.setAttribute("aria-expanded", String(open));
  if (open) setTimeout(() => assistantInput?.focus(), 50);
}

function addAssistantMessage(text, role, extraClass = "") {
  const message = document.createElement("div");
  message.className = `assistant-message ${role} ${extraClass}`.trim();
  message.textContent = text;
  assistantMessages.appendChild(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
  return message;
}

function assistantFallback(question) {
  const value = question.toLowerCase();
  if (value.includes("rendez") || value.includes("meet")) return "Vous pouvez choisir une date et un créneau dans la section Rendez-vous : #rendezvous";
  if (value.includes("service") || value.includes("site web") || value.includes("prix") || value.includes("devis")) return "Kabakaro réalise des sites vitrines, des sites professionnels et des solutions web sur mesure. Consultez #services ou écrivez à kabakaro16@gmail.com pour un devis.";
  if (value.includes("probl") || value.includes("erreur") || value.includes("bug") || value.includes("marche")) return "Je suis désolée pour ce problème. Essayez d’actualiser la page. Si le souci continue, indiquez l’appareil utilisé, la page concernée et ce qui s’affiche, puis contactez Kabakaro à kabakaro16@gmail.com.";
  if (value.includes("projet") || value.includes("portfolio")) return "Vous pouvez découvrir les réalisations de Kabakaro dans la section Projets : #projets";
  return "Je peux vous renseigner sur les services, les projets, la prise de rendez-vous ou vous aider à signaler un problème. Vous pouvez aussi contacter Kabakaro à kabakaro16@gmail.com.";
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
    const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: assistantHistory.slice(-8) }) });
    const data = await response.json();
    if (!response.ok || !data.answer) throw new Error(data.error || "Réponse indisponible");
    typing.remove();
    const reply = addAssistantMessage(data.answer, "bot");
    linkifyAssistantMessage(reply);
    assistantHistory.push({ role: "assistant", content: data.answer });
  } catch (error) {
    typing.remove();
    const reply = addAssistantMessage(assistantFallback(question), "bot");
    linkifyAssistantMessage(reply);
  } finally {
    submit.disabled = false;
    assistantInput.focus();
  }
}

assistantLauncher?.addEventListener("click", () => toggleAssistant(assistantPanel.hidden));
assistantClose?.addEventListener("click", () => toggleAssistant(false));
assistantForm?.addEventListener("submit", (event) => { event.preventDefault(); const question = assistantInput.value.trim(); if (!question) return; assistantInput.value = ""; askAssistant(question); });
assistantSuggestions?.addEventListener("click", (event) => { const button = event.target.closest("button[data-question]"); if (button) askAssistant(button.dataset.question); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && assistantPanel && !assistantPanel.hidden) toggleAssistant(false); });
