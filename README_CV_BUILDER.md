# Kabakaro Dev — Créateur de CV V1 complète

Cette version est adaptée au dépôt actuel `kabakaro12/portfolio-kabakaro`, qui est un site statique HTML/CSS/JavaScript.

## Fichiers à ajouter à la racine du dépôt

- `creer-mon-cv.html`
- `cv-builder.css`
- `cv-builder.js`

## Modification à faire dans `index.html`

Dans le menu `<nav class="nav">`, ajoutez cette ligne avant le lien Contact :

```html
<a href="creer-mon-cv.html">Créer mon CV</a>
```

Vous pouvez aussi ajouter un bouton dans le hero :

```html
<a class="btn secondary" href="creer-mon-cv.html">📄 Créer mon CV gratuitement</a>
```

## Fonctionnalités de cette V1

- Formulaire en 5 étapes
- Aperçu A4 en direct
- 2 modèles : classique et moderne
- Expériences multiples
- Formations multiples
- Compétences et langues
- Sauvegarde automatique avec `localStorage`
- Bouton Enregistrer
- Nouveau CV / remise à zéro
- Export PDF via impression navigateur
- Responsive mobile
- SEO de base
- Les données restent dans le navigateur

## Important

Cette V1 n'a pas encore de compte utilisateur ni de base de données.
La prochaine version peut ajouter :
- inscription / connexion,
- PostgreSQL,
- plusieurs CV par utilisateur,
- génération PDF côté serveur,
- historique et duplication,
- optimisation IA selon une offre.
