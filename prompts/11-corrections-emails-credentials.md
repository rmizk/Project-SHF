# Prompt 11 — Corrections emails + remise des identifiants

Contexte : Resend en mode test (`onboarding@resend.dev`) ne peut envoyer qu'à l'adresse du compte (rmizkk@gmail.com). Les emails vers les demandeurs échouent — la remise des identifiants se fera donc manuellement par l'admin, via l'interface.

## 1. Email de notification (nouvelle demande)

- Supprime la ligne « Traiter la demande : http://localhost:3000/... » — pas de lien dans cet email.
- Garde le reste (société, matricule, email, téléphone, ID de la demande).

## 2. Mot de passe temporaire visible dans l'admin

1. Migration : ajoute `temp_password text` (nullable) à `organizations`. À l'approbation d'une demande, stocke le mot de passe provisoire généré dans cette colonne.
2. Quand l'utilisateur change son mot de passe à la première connexion (`must_change_password` → false), **mets `temp_password` à NULL**. On ne conserve jamais un mot de passe actif en clair.
3. `/admin/organisations` : nouvelle colonne « Mot de passe temporaire » — masquée par défaut (●●●●●●), avec bouton œil pour afficher et bouton copier. Si NULL : afficher « Modifié par l'utilisateur » en gris.
4. À l'approbation, garde aussi le modal de confirmation avec org ID + mot de passe + boutons copier (première remise rapide), avec la mention « Ces identifiants restent disponibles dans la liste des organisations tant que le mot de passe n'a pas été changé ».

## 3. Emails vers les demandeurs

- Garde le code d'envoi (approbation/refus) mais il ne doit jamais bloquer l'action si l'envoi échoue (déjà le cas — vérifie). Ajoute un commentaire TODO : « réactiver pleinement après vérification d'un domaine dans Resend ».

## 4. Vérification

- `npm run build` sans erreur.
- Teste : demande → email sans lien ; approbation → modal identifiants + colonne visible dans /admin/organisations avec œil + copier ; première connexion + changement de mot de passe → la colonne affiche « Modifié par l'utilisateur ».
- Commit « Remise manuelle des identifiants + corrections emails » et push.
