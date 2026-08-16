
# Kabakaro Portfolio — Version finale 2026

## Demandes de devis guidées (V17.9)

Ajout d’un estimateur public, de l’enregistrement des demandes dans Upstash et de leur suivi dans l’administration (nouveau, contacté, proposition envoyée, gagné ou perdu). Les témoignages publiés sont désormais chargés sans délai de cache. Le projet reste limité à exactement 12 fonctions serveur pour Vercel Hobby.

## Compatibilité Vercel Hobby (V17.8.2)

Les modules Google et Redis ont été déplacés hors du dossier `api` et l’ancienne route OpenAI inutilisée a été supprimée. Le projet contient désormais exactement 12 fonctions serveur, conformément à la limite du forfait gratuit Vercel Hobby.

## Correctif administration Safari (V17.8.1)

La route du tableau de bord utilise désormais un en-tête d’autorisation standard encodé et une URL absolue, afin d’éviter l’erreur Safari « The string did not match the expected pattern » sur iPhone.

## Tableau de bord administrateur (V17.8)

Ajout des statistiques de visites totales, quotidiennes et hebdomadaires, de l’enregistrement des témoignages dans Upstash, de leur modération (publier, masquer, supprimer) et de leur affichage automatique sur le portfolio après validation. La session administrateur se ferme après 30 minutes d’inactivité.

## Témoignages vérifiés et compteur de vues (V17.7)

Ajout d’un formulaire de témoignage avec consentement et validation avant publication. Le compteur global utilise Redis côté serveur et incrémente une seule fois par session. Variables compatibles : `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` ou `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

## Méthode professionnelle et FAQ (V17.6)

Ajout d’un parcours client en quatre étapes, d’engagements professionnels vérifiables et d’une FAQ sur les délais, le nom de domaine, le responsive, les modifications et le démarrage d’un projet.

## Correctif du défilement mobile (V17.5.1)

Sur iPhone, l’arrière-plan est désormais verrouillé pendant l’ouverture de l’assistante puis la position exacte est restaurée à sa fermeture. La hauteur utilise l’unité dynamique `dvh` et la fin de page est stabilisée au niveau du footer.

## Footer professionnel (V17.5)

Le pied de page comprend désormais l’identité Kabakaro Dev, la disponibilité du site, les coordonnées, la navigation, GitHub, LinkedIn, le CV, les pages légales et l’accès discret à l’administration. Le bouton secondaire du formulaire de signalement est devenu une action « Retour » pour éviter deux icônes de fermeture identiques.

## Confiance et confirmation (V17.4)

Après l’envoi d’un signalement, le formulaire est remplacé par une carte de confirmation avec référence de suivi, fermeture et nouveau signalement. Une case de consentement est obligatoire. Les pages `confidentialite.html` et `mentions-legales.html` sont accessibles dans le pied de page.

## Signalement de problème (V17.3)

Le bouton « Signaler un problème » ouvre un formulaire dans l’assistante. Le visiteur renseigne son nom, son e-mail, son appareil, la page concernée et une description. Une référence `KK-...` est générée et la demande est envoyée à `NOTIFICATION_EMAIL` avec Resend. Le bouton fonctionne avec les variables `RESEND_API_KEY` et `NOTIFICATION_FROM` déjà utilisées par les notifications de rendez-vous.

## Designs corrigés (V17.2)

Les trois affiches utilisent désormais le numéro réel `07 45 93 61 72`. Les statistiques non vérifiées ont été remplacées par des fonctionnalités réelles et les données de l’interface G-Transport sont identifiées comme données de démonstration.

## Galerie de designs (V17.1.1)

La section « Mes designs » présente les visuels réels de Proptech Solutions, G-Music et G-Transport. Les images sont optimisées en WebP, chargées progressivement et peuvent être ouvertes en grand. La galerie est accessible depuis le menu et reconnue par l’assistante automatique.

Les cartes utilisent des vignettes horizontales compactes afin d’éviter les affiches trop longues sur mobile. L’affiche verticale complète reste visible dans l’aperçu plein écran.

## Assistante automatique gratuite (V16.9.1)

Le bouton « Besoin d’aide ? » reconnaît les demandes fréquentes sur les services, tarifs, devis, délais, technologies, projets, CV, contact, rendez-vous et problèmes techniques. Les réponses fonctionnent sans API, sans crédit et sans facturation.

Le portfolio signale également qu’il est accessible 24 h/24 et 7 j/7 et que les demandes sont prises en charge dès que possible.

La route IA reste présente pour une éventuelle réactivation future, mais l’interface actuelle ne l’appelle pas. Aucune variable OpenAI n’est nécessaire pour cette version.

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


## Vue Pipeline commercial — v16.5

L'espace admin propose maintenant deux vues :

- **Vue liste**
- **Vue pipeline**

Le pipeline affiche cinq colonnes :
- Nouveau
- Contacté
- Devis envoyé
- Gagné
- Perdu

Chaque carte affiche le client, le type de projet, la date du rendez-vous, le montant estimé et la relance éventuelle.

Le statut commercial peut être modifié directement depuis la carte pipeline.


## Correctif Pipeline — v16.5.1

Les boutons **Vue liste** et **Vue pipeline** sont maintenant placés juste sous
**Actualiser / Déconnexion** dans l'espace administrateur.

Le sélecteur de vue est également sticky afin de rester facilement accessible sur mobile.


## Pipeline mobile — v16.6

Sur mobile, la vue Pipeline affiche une seule étape à la fois grâce à des onglets :
Nouveau, Contacté, Devis envoyé, Gagné et Perdu.

Chaque onglet affiche le nombre de prospects et le montant estimé.
Sur ordinateur, la vue en cinq colonnes reste inchangée.


## Devis PDF — v16.7

L'espace admin permet maintenant de générer un devis à partir d'un prospect.

Fonctionnement :
- bouton **Créer devis PDF** depuis la vue liste ;
- bouton **Devis PDF** depuis le pipeline ;
- montant HT ;
- TVA configurable ;
- durée de validité ;
- description de prestation ;
- téléchargement automatique du PDF ;
- passage automatique du suivi commercial à **Devis envoyé** ;
- montant estimé synchronisé avec le montant HT du devis.

Variables Vercel optionnelles pour personnaliser l'émetteur :
- `QUOTE_ISSUER_NAME`
- `QUOTE_ISSUER_TITLE`
- `QUOTE_ISSUER_EMAIL`
- `QUOTE_ISSUER_PHONE`
- `QUOTE_ISSUER_ADDRESS`

Important : le modèle PDF contient une note invitant à adapter les mentions fiscales, juridiques et les conditions de paiement à la situation réelle avant envoi au client.


## Correctif connexion admin — v16.7.1

Correction d'un bug d'initialisation JavaScript introduit avec la fenêtre de création de devis.

Symptôme :
- la page admin s'affichait ;
- le bouton Se connecter ne déclenchait aucun appel API ;
- les logs Vercel ne montraient pas `/api/admin-appointments`.

Correction :
- la fenêtre Devis est chargée avant le script JavaScript ;
- des protections supplémentaires évitent qu'un élément manquant bloque toute la page admin.


## Correctif PDF iPhone — v16.7.2

Sur iPhone/Safari, le téléchargement automatique via un lien `download` peut être bloqué.

La génération de devis fonctionne maintenant ainsi :
- sur iPhone/iPad : le PDF s'ouvre directement dans Safari ;
- utiliser ensuite **Partager → Enregistrer dans Fichiers** ;
- sur ordinateur : téléchargement classique du PDF.

Aucune nouvelle variable Vercel n'est nécessaire.


## Correctif devis iPhone — v16.7.3

Sur iPhone/iPad, après génération du devis PDF, l'application utilise maintenant
la feuille de partage native iOS.

Elle permet directement :
- Enregistrer dans Fichiers
- Imprimer
- AirDrop
- Envoyer par Mail / Messages
- Partager vers d'autres applications

Sur ordinateur, le téléchargement PDF classique reste inchangé.


## Correctif PDF iPhone — v16.7.4

Correction du blocage Safari lié aux actions asynchrones après un clic utilisateur.

Nouveau fonctionnement sur iPhone/iPad :
1. au clic sur Générer, un nouvel onglet Safari s'ouvre immédiatement ;
2. la génération du PDF continue en arrière-plan ;
3. le PDF remplace automatiquement la page de chargement ;
4. le visualiseur PDF iOS permet ensuite Partager, Imprimer et Enregistrer dans Fichiers.

Aucune nouvelle variable Vercel n'est nécessaire.
