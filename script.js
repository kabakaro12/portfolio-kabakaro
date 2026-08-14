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
