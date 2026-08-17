
# Rendez-vous Admin V2

Cette version améliore la qualification des prospects avant confirmation.

## Ajouts
- Statut "En attente d’informations"
- Bloc client + téléphone
- Bloc projet : type, description, budget, délai
- Alerte si des données sont manquantes
- Bouton "Confirmer le rendez-vous" désactivé tant que le projet n’est pas renseigné
- Bouton "Demander des précisions"
- Bouton "Annuler"
- Google Meet / Calendar / e-mail conservés
- Pipeline commercial :
  Demande reçue → Informations demandées → En attente de réponse → RDV confirmé → RDV réalisé → Devis envoyé → Gagné / Perdu

## Intégration
1. Copier `AppointmentQualificationCard.jsx` dans ton dossier `components/`.
2. Copier `AppointmentQualificationCard.css` au même endroit.
3. Importer le composant dans ta page admin.
4. Brancher `onRequestInfo`, `onConfirm` et `onCancel` sur tes fonctions API existantes.

## Exemple
```jsx
<AppointmentQualificationCard
  appointment={rdv}
  onRequestInfo={() => demanderPrecisions(rdv.id)}
  onConfirm={() => confirmerRdv(rdv.id)}
  onCancel={() => annulerRdv(rdv.id)}
/>
```
