# Kabakaro Dev — Créateur de CV V1

Module React prêt à intégrer.

## Fonctionnalités
- Formulaire en 5 étapes
- Aperçu du CV en direct
- Expériences multiples
- Formations multiples
- Compétences et langues
- 2 modèles : Classique / Moderne
- Responsive mobile
- Export PDF V1 via l'impression du navigateur

## Intégration
1. Copier `src/CvBuilder.jsx` et `src/CvBuilder.css` dans le projet.
2. Ajouter :
```jsx
import CvBuilder from "./CvBuilder";

export default function CreateCvPage() {
  return <CvBuilder />;
}
```
3. Créer la route `/creer-mon-cv`.
4. Ajouter `Créer mon CV` dans le menu.

## Étape suivante
Authentification, PostgreSQL, sauvegarde des CV, duplication, upload photo et génération PDF serveur.
