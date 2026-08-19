KABAKARO DEV — Correctif Vercel API V2

Diagnostic:
- l'URL /api/auth/register renvoie actuellement 404 sur la production.
- les fonctions placées dans api/auth/ et api/cv/ ne sont donc pas exposées sur la version en ligne.
- le dernier déploiement avec api/**/*.js est en erreur.

À faire:
1. Ajouter les 6 fichiers du dossier api/ à la racine api/ de GitHub:
   api/auth-register.js
   api/auth-login.js
   api/auth-me.js
   api/cv-list.js
   api/cv-duplicate.js
   api/cv-item.js

2. Remplacer vercel.json par celui du ZIP.

3. Ne pas supprimer les dossiers existants:
   api/auth/
   api/cv/
   lib/

Les nouveaux fichiers sont de petits ponts vers les handlers déjà existants.

Après commit:
- attendre que Vercel affiche READY
- tester /api/auth/register dans le navigateur: un GET doit répondre "Méthode non autorisée" (405), et non plus 404.
- puis tester la création de compte.
