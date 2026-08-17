
import React from "react";
import "./AppointmentQualificationCard.css";

export default function AppointmentQualificationCard({
  appointment = {},
  onRequestInfo,
  onConfirm,
  onCancel,
}) {
  const {
    clientName = "Toure",
    email = "tmedby74@gmail.com",
    phone = "",
    start = "mar. 18 août 2026 à 12:00",
    end = "mar. 18 août 2026 à 12:30",
    type = "Premier échange",
    projectType = "",
    description = "",
    budget = "",
    deadline = "",
    meetUrl = "#",
    calendarUrl = "#",
  } = appointment;

  const missing = [
    !projectType && "Type de projet",
    !description && "Description",
    !budget && "Budget",
    !deadline && "Délai",
  ].filter(Boolean);

  const canConfirm = missing.length === 0;

  return (
    <article className="rdv-card">
      <header className="rdv-card__header">
        <div>
          <p className="rdv-card__eyebrow">Qualification du rendez-vous</p>
          <h2>{start}</h2>
          <p className="rdv-card__type">{type}</p>
        </div>

        <span className="rdv-status rdv-status--waiting">
          En attente d’informations
        </span>
      </header>

      <div className="rdv-grid">
        <section className="rdv-section">
          <h3>Client</h3>
          <dl>
            <div><dt>Nom</dt><dd>{clientName}</dd></div>
            <div><dt>E-mail</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            <div><dt>Téléphone</dt><dd>{phone || <span className="missing">Non renseigné</span>}</dd></div>
          </dl>
        </section>

        <section className="rdv-section">
          <h3>Créneau demandé</h3>
          <dl>
            <div><dt>Début</dt><dd>{start}</dd></div>
            <div><dt>Fin</dt><dd>{end}</dd></div>
          </dl>
        </section>
      </div>

      <section className="rdv-project">
        <div className="rdv-project__title">
          <h3>Informations projet</h3>
          {missing.length > 0 && (
            <span className="rdv-project__count">
              {missing.length} information{missing.length > 1 ? "s" : ""} manquante{missing.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="rdv-project__grid">
          <Info label="Type de projet" value={projectType} />
          <Info label="Budget estimé" value={budget} />
          <Info label="Délai souhaité" value={deadline} />
          <Info label="Description" value={description} wide />
        </div>
      </section>

      {missing.length > 0 && (
        <div className="rdv-alert" role="alert">
          <span className="rdv-alert__icon">!</span>
          <div>
            <strong>Informations nécessaires avant confirmation</strong>
            <p>
              Il manque : {missing.join(", ")}. Demande les précisions au client
              avant de confirmer définitivement le rendez-vous.
            </p>
          </div>
        </div>
      )}

      <div className="rdv-actions rdv-actions--primary">
        <button className="btn btn--primary" onClick={onRequestInfo}>
          Demander des précisions
        </button>

        <button
          className="btn btn--success"
          onClick={onConfirm}
          disabled={!canConfirm}
          title={!canConfirm ? "Complète d’abord les informations du projet" : ""}
        >
          Confirmer le rendez-vous
        </button>

        <button className="btn btn--danger" onClick={onCancel}>
          Annuler
        </button>
      </div>

      <div className="rdv-actions rdv-actions--secondary">
        <a className="btn btn--ghost" href={meetUrl} target="_blank" rel="noreferrer">
          Google Meet ↗
        </a>
        <a className="btn btn--ghost" href={calendarUrl} target="_blank" rel="noreferrer">
          Google Calendar ↗
        </a>
        <a className="btn btn--ghost" href={`mailto:${email}`}>
          Écrire au client
        </a>
      </div>

      <section className="rdv-followup">
        <h3>Suivi commercial</h3>
        <div className="rdv-steps">
          <Step done label="Demande reçue" />
          <Step done label="Informations demandées" />
          <Step active label="En attente de réponse" />
          <Step label="RDV confirmé" />
          <Step label="RDV réalisé" />
          <Step label="Devis envoyé" />
          <Step label="Gagné / Perdu" />
        </div>
      </section>
    </article>
  );
}

function Info({ label, value, wide = false }) {
  return (
    <div className={`rdv-info ${wide ? "rdv-info--wide" : ""}`}>
      <span>{label}</span>
      <strong>{value || <span className="missing">Non renseigné</span>}</strong>
    </div>
  );
}

function Step({ label, done = false, active = false }) {
  return (
    <div className={`rdv-step ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}>
      <span className="rdv-step__dot">{done ? "✓" : ""}</span>
      <span>{label}</span>
    </div>
  );
}
