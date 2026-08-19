KABAKARO DEV — VERSION VERCEL HOBBY (12 FONCTIONS MAX)

Cause trouvée :
Vercel Hobby refuse les déploiements avec plus de 12 Serverless Functions.

Cette correction regroupe :
- inscription
- connexion
- session utilisateur
- liste/création des CV
- modification/suppression d'un CV
- duplication de CV
- compteur de vues

dans UNE seule fonction : api/gateway.js

IMPORTANT :
1) Ajouter api/gateway.js
2) Remplacer vercel.json
3) SUPPRIMER tous les fichiers indiqués dans A_SUPPRIMER_DE_GITHUB.txt
4) NE PAS supprimer les autres API existantes.
5) Commit directement sur main.
6) Attendre Vercel : Status READY.

Après déploiement :
Tester :
https://portfolio-kabakaro.vercel.app/api/auth/register

En ouvrant cette URL avec le navigateur (GET), la réponse attendue est un JSON 405 :
{"ok":false,"error":"Méthode non autorisée"}

Si tu vois cela, la route d'inscription est enfin déployée.
Ensuite tester connexion.html et créer un compte.

Nombre attendu après nettoyage :
11 fonctions API existantes + api/gateway.js = 12 fonctions.
