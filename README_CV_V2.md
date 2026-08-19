# Kabakaro Dev — CV Builder V2

La V2 transforme le générateur de CV en vrai espace utilisateur.

## Architecture
- Frontend : HTML/CSS/JavaScript existant
- Backend : Vercel Serverless Functions (`/api`)
- Base : PostgreSQL
- Auth : JWT + bcrypt
- Déploiement : Vercel

## Utilisation
L'utilisateur peut continuer à créer un CV sans compte. S'il se connecte, il peut enregistrer le CV en ligne et le retrouver depuis `mes-cv.html`.

## Variables Vercel
- `POSTGRES_URL`
- `AUTH_JWT_SECRET`

Voir `INSTALLATION_V2.txt`.
