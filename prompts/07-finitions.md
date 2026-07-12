# Prompt 7 — Finitions v1

Passe de revue finale avant déploiement :

1. **Cohérence visuelle** : compare chaque page aux screens `design/screens/` (clair ET sombre, bureau ET mobile). Corrige les écarts de spacing, badges, formats de montants (`1 234,567` TND partout).
2. **Responsive** : bottom nav visible sur tous les écrans mobiles, aucun bouton flottant qui recouvre du contenu, modals utilisables sur mobile.
3. **États vides** pour les 4 modules (modèle : screen `04-achats-etat-vide-*`) et messages d'erreur en français partout.
4. **Accessibilité** : `aria-label` sur tous les boutons icône, contraste des textes secondaires, focus visible, cibles tactiles ≥ 44 px.
5. **Sécurité** : vérifie que chaque requête passe par la RLS (aucun `service_role` côté client), que les buckets Storage sont privés avec URLs signées, et qu'aucun secret n'est commité.
6. **Vérification finale** : `npm run build` sans erreur ni warning TypeScript, test manuel du parcours complet (connexion → saisie dans chaque module → TVA → profil).

Corrige tout ce qui coince, puis commit « Finitions v1 » et pousse sur GitHub.
