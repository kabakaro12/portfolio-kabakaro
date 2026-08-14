# Portfolio Kabakaro Keita

Site statique professionnel prêt à héberger.

## Fichiers
- index.html
- style.css
- script.js

## Test local
Double-cliquez sur `index.html`, ou lancez :
`python3 -m http.server 8080`

Puis ouvrez http://localhost:8080

## Hébergement
Compatible avec Netlify, Vercel, GitHub Pages, OVH, Hostinger ou un serveur Nginx/Apache.

## À personnaliser
- Ajouter une photo professionnelle si souhaité.
- Ajouter le fichier PDF du CV et un bouton de téléchargement.
- Ajouter les URLs réelles de vos projets/GitHub.

## Mise à jour
Compétences ajoutées :
- Python
- Django
- Django REST Framework
- PostgreSQL
- Docker
- Linux
- Express
- Next.js
- Flutter
- API REST

Un emplacement de photo de profil est prêt dans la page d'accueil.
Les boutons GitHub sont prêts mais volontairement désactivés tant que les URL exactes des dépôts ne sont pas renseignées.

## GitHub
Profil : https://github.com/kabakaro12

Dépôts publics intégrés :
- ProjetStageDevFullStack
- CINELAND
- Gestion-de-cineland

## V5
- CV PDF téléchargeable
- SEO / Open Graph / Schema.org
- robots.txt + sitemap.xml
- favicon
- section technologies
- CTA GitHub amélioré


## V12
- G-Transport renforcé comme projet phare (statut Prototype / En développement).
- Ajout d'une section de prise de rendez-vous.
- Choix du type de rendez-vous et d'un créneau de démonstration.
- Qualification rapide du projet.
- Préparation d'un e-mail de confirmation.
- Bloc prévu pour un futur assistant IA.
- Prochaine étape : connexion à Google Calendar pour afficher les vraies disponibilités et créer les rendez-vous automatiquement.


## V13 — Google Calendar

La prise de rendez-vous n'utilise plus de faux créneaux. Le navigateur appelle deux fonctions Vercel :

- `GET /api/availability?date=YYYY-MM-DD` : lit uniquement les périodes occupées du calendrier et renvoie les créneaux libres.
- `POST /api/book` : revérifie le créneau, crée l'événement et invite le prospect par e-mail.

### Sécurité

Les identifiants Google ne sont jamais placés dans `index.html` ou `script.js`. Ils doivent être configurés dans **Vercel > Project Settings > Environment Variables**.

Variables :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID` (`primary` par défaut)
- `BOOKING_TIMEZONE` (`Europe/Paris`)
- `BOOKING_UTC_OFFSET` (`+02:00` en été en France, `+01:00` en hiver)

### Horaires V13

Par défaut : lundi à vendredi, 09:00–18:00, créneaux de 30 minutes.

### Étape suivante

Ajouter l'assistant IA qui :
1. qualifie le projet ;
2. appelle `/api/availability` ;
3. propose les créneaux ;
4. confirme via `/api/book`.

## Google Calendar — finalisation OAuth (V14)

Le backend utilise un refresh token Google pour consulter les disponibilités et créer les rendez-vous.

1. Dans Google Cloud OAuth, autoriser les scopes :
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.events.freebusy`
2. Dans Vercel, configurer `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI`.
3. Déployer la V14.
4. Ouvrir `https://portfolio-kabakaro.vercel.app/api/google-calendar/auth` et autoriser le compte Google.
5. Copier le refresh token affiché vers la variable Vercel `GOOGLE_REFRESH_TOKEN`.
6. Redéployer et tester la section Rendez-vous.

Ne jamais publier le client secret ou le refresh token dans GitHub.
