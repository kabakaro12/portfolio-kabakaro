# Kabakaro Dev — Créateur de CV V2

Cette V2 ajoute :
- 5 styles de CV
- palette de couleurs
- import PDF, DOCX et TXT
- extraction du texte côté navigateur
- assistant IA côté serveur Vercel
- optimisation du résumé
- amélioration des expériences
- adaptation à une offre d’emploi
- analyse ATS
- export PDF via impression navigateur

## Fichiers à ajouter/remplacer
- `creer-mon-cv.html` → remplacer l’actuel
- `cv-builder-v2.css` → ajouter
- `cv-builder-v2.js` → ajouter
- `api/cv-ai.js` → ajouter dans le dossier `api`

## Configuration IA sur Vercel
Dans les variables d’environnement Vercel, ajouter `OPENAI_API_KEY`. La clé reste côté serveur et ne doit jamais être placée dans le JavaScript du navigateur.

Le code utilise l’API Responses côté serveur.
