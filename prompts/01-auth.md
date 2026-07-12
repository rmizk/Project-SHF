# Prompt 1 — Authentification organisation

Lis CLAUDE.md (règle métier n°3), regarde les screens `design/screens/connexion/` et `design/screens/formulaire-public/`, puis implémente :

1. **Page de connexion** (fidèle aux screens) : identifiant d'organisation + mot de passe, « Rester connecté », « Mot de passe oublié ? », lien vers la demande d'ajout. Résolution `org_code` → email technique interne → Supabase Auth.
2. **Changement de mot de passe forcé** à la première connexion (`must_change_password`).
3. **Formulaire public « Demander l'ajout de mon organisation »** + écran de confirmation (screens `formulaire-public/`) : insertion dans `organization_requests`.
4. **Réinitialisation de mot de passe** par email.
5. Protection des routes : tout sauf connexion/formulaire public exige une session ; middleware qui injecte l'organisation courante.
6. Script ou Edge Function d'approbation d'une demande (création organisation + compte Auth + envoi des identifiants par email) — pour l'instant, un script `npm run approve-org <request_id>` suffit.

Teste le parcours complet avec une organisation de test, puis commit.
