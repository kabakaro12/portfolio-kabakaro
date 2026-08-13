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


// V12 — Prototype de prise de rendez-vous
const slotButtons = document.querySelectorAll(".slot");
const selectedSlotInput = document.getElementById("selectedSlot");
slotButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    slotButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSlotInput.value = btn.dataset.slot;
  });
});

const bookingForm = document.getElementById("bookingForm");
bookingForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = document.getElementById("meetingType").value;
  const slot = selectedSlotInput.value;
  const name = document.getElementById("bookingName").value.trim();
  const email = document.getElementById("bookingEmail").value.trim();
  const project = document.getElementById("bookingProject").value.trim();
  const msg = document.getElementById("bookingMessage");

  if (!slot) {
    msg.textContent = "Choisissez d’abord un créneau disponible.";
    msg.classList.remove("success");
    return;
  }

  const subject = encodeURIComponent(`Rendez-vous portfolio - ${type}`);
  const body = encodeURIComponent(
`Bonjour Kabakaro,

Je souhaite réserver un rendez-vous.

Nom : ${name}
E-mail : ${email}
Type : ${type}
Créneau souhaité : ${slot}
Projet : ${project || "À préciser"}

Merci de me confirmer votre disponibilité.`
  );

  msg.textContent = "Votre demande est prête. Votre application e-mail va s’ouvrir pour la confirmation.";
  msg.classList.add("success");
  setTimeout(() => {
    window.location.href = `mailto:kabakaro16@gmail.com?subject=${subject}&body=${body}`;
  }, 250);
});
