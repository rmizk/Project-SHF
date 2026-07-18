# Prompt 9 — Déconnexion + notifications email des demandes

## 1. Bouton de déconnexion

1. Page Profil : bouton « Se déconnecter » (style discret mais visible, icône logout) en bas de la carte « Profil de l'organisation ».
2. Avatar de la TopBar : au clic, petit menu (portal, comme RowActionsMenu) avec « Profil » et « Se déconnecter ».
3. La déconnexion appelle Supabase Auth signOut, vide la session et redirige vers la page de connexion. Fonctionne aussi sur mobile.

## 2. Emails des demandes d'organisation (via Resend)

Utilise Resend (https://resend.com) avec la variable d'environnement `RESEND_API_KEY` (je l'ajouterai dans `.env.local` — utilise l'expéditeur `onboarding@resend.dev` tant qu'aucun domaine n'est vérifié).

1. **Nouvelle demande** : quand le formulaire public est soumis, envoie un email de notification à `rmizkk@gmail.com` avec les infos de la demande (société, matricule fiscal, email, téléphone) et l'ID de la demande.
2. **Approbation** (`npm run approve-org <request_id>`) : après création de l'organisation, envoie au demandeur un email en français avec son ID d'organisation, son mot de passe provisoire et le lien de connexion (rappel : changement de mot de passe forcé à la première connexion).
3. **Refus** : ajoute `npm run reject-org <request_id>` qui marque la demande refusée et envoie un email poli en français au demandeur.
4. Gestion d'erreur : si l'envoi échoue, l'action principale (enregistrement/approbation) ne doit PAS échouer — log l'erreur.

## 3. Vérification

- `npm run build` sans erreur.
- Teste : déconnexion (bureau + mobile), soumission d'une demande de test → email reçu, approbation → email d'identifiants reçu.
- Commit « Déconnexion + emails des demandes » et push.
