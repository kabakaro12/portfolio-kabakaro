
# Kabakaro Portfolio — Version finale 2026

Cette version regroupe les fonctionnalités validées :

- Portfolio responsive web/mobile
- Projets et expériences mis à jour
- Jeu d'échecs Full Stack Java mis en avant
- Proptech Solutions présenté comme expérience salariée / maintenance du site
- Prise de rendez-vous depuis le portfolio
- Lecture des disponibilités Google Calendar
- Création automatique d'événements Google Calendar
- Création automatique d'un lien Google Meet
- Invitation calendrier envoyée au client
- Message de confirmation affiché au client après réservation
- Notification e-mail au propriétaire après une nouvelle réservation
- Diagnostic OAuth sécurisé dans les logs Vercel sans affichage des secrets

## Variables Vercel nécessaires

Google Calendar / Meet :
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REFRESH_TOKEN
- GOOGLE_REDIRECT_URI
- GOOGLE_CALENDAR_ID=primary
- BOOKING_TIMEZONE=Europe/Paris
- BOOKING_UTC_OFFSET=+02:00

Notification e-mail propriétaire :
- RESEND_API_KEY
- NOTIFICATION_EMAIL=kabakaro16@gmail.com
- NOTIFICATION_FROM=Kabakaro Portfolio <onboarding@resend.dev>

Après modification des variables Vercel, lancer un Redeploy.

## Déploiement

Le projet est prévu pour être déployé sur Vercel depuis le dépôt GitHub existant.


## Espace administrateur Rendez-vous — v16.1

URL :
- `/admin.html`

Nouvelle variable Vercel obligatoire :
- `ADMIN_PASSWORD` : choisis un mot de passe long et unique.

Fonctionnalités :
- accès protégé par mot de passe ;
- liste des rendez-vous du portfolio ;
- client, e-mail, type, projet, date et heure ;
- statut Google Calendar (confirmé, en attente, refusé, passé, etc.) ;
- accès direct au Google Meet et à Google Calendar ;
- recherche et filtres ;
- statistiques rapides.

Le mot de passe n'est pas enregistré dans le code GitHub. Il doit uniquement être configuré dans Vercel.


## Accès Administration — v16.2

Un lien discret **Administration** a été ajouté au pied de page du portfolio.
Il ouvre `/admin.html`.

L'accès reste protégé côté serveur par la variable Vercel `ADMIN_PASSWORD`.


## Mini-CRM — v16.3

L'espace `/admin.html` permet maintenant de gérer le suivi commercial de chaque rendez-vous :

- **Nouveau**
- **Contacté**
- **Devis envoyé**
- **Gagné**
- **Perdu**
- notes internes libres
- filtre par statut commercial
- recherche dans les notes

Les données CRM sont stockées dans les `extendedProperties.private` de l'événement Google Calendar.
Elles restent donc disponibles après un redéploiement Vercel et ne sont pas visibles par le client dans son invitation.


## Relances & montant estimé — v16.4

Le mini-CRM permet maintenant d'ajouter à chaque prospect :
- une **date de relance** ;
- un **montant estimé du projet en euros**.

Le tableau de bord affiche aussi :
- le **potentiel commercial total** ;
- le nombre de **relances à faire** ;
- un filtre **À relancer / Relances futures / Sans relance**.

Comme les autres données CRM, ces informations sont enregistrées dans les propriétés privées de l'événement Google Calendar et ne sont pas visibles par le client.
