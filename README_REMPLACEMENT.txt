Kabakaro Dev — Correctif connexion Neon / PostgreSQL

À remplacer dans le dépôt GitHub :
- lib/db.js
- lib/auth.js

Ne remplace aucun autre fichier.

Après remplacement :
1. Commit changes
2. Attendre le redéploiement Vercel
3. Vérifier le statut Ready
4. Retester la création de compte

Le nouveau db.js utilise DATABASE_URL en priorité, puis POSTGRES_URL.
Le nouveau auth.js écrit les erreurs serveur dans les logs Vercel.
