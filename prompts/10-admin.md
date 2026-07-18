# Prompt 10 — Interface Super Admin

Zone `/admin` dans la même application, pour gérer les organisations et leurs demandes d'ajout. Remplace les scripts `approve-org`/`reject-org` (garde-les en secours). **UI : réutilise exactement le design system de l'application** (mêmes composants Sidebar/TopBar/DataTable/Modal/ConfirmDialog/StatusBadge, mêmes thèmes clair/sombre, textes en français).

## 1. Compte et sécurité

1. Script `npm run create-super-admin <email> <mot_de_passe>` : crée un utilisateur Supabase Auth avec `app_metadata.role = 'super_admin'`.
2. Migration : ajoute `status text NOT NULL DEFAULT 'active'` (`active` / `suspended`) à `organizations`.
3. Middleware : `/admin/*` accessible uniquement au rôle `super_admin` (vérifié côté serveur dans chaque Server Action aussi). Une organisation connectée qui tente d'y accéder → redirigée vers son tableau de bord. Une organisation `suspended` ne peut plus se connecter (message clair à la connexion).
4. `/admin/login` : connexion email + mot de passe, même style que la page de connexion existante. Déconnexion dans la TopBar admin.

## 2. Pages (sidebar admin : Tableau de bord, Organisations, Demandes)

### /admin (tableau de bord)
4 cartes : Organisations actives · Demandes **en attente** (avec lien vers /admin/demandes) · Demandes reçues ce mois · Organisations suspendues. En dessous : les 5 dernières organisations créées.

### /admin/organisations
- Tableau : logo, nom, org ID, matricule fiscal, email, date de création, statut (badge Actif vert / Suspendu orange).
- Menu ⋮ par ligne (RowActionsMenu) :
  - **Suspendre / Réactiver** : confirmation simple, bascule le statut.
  - **Supprimer définitivement** : dialogue de confirmation forte — l'utilisateur doit taper le nom exact de l'organisation pour activer le bouton. Supprime l'organisation, toutes ses données (cascade) et ses fichiers Storage. Avertissement explicite : « irréversible, toutes les données financières seront effacées ».

### /admin/demandes
- Filtres : En attente / Approuvées / Refusées. Tableau : société, matricule, email, téléphone, date, état.
- Pour les demandes en attente : **Approuver** (confirmation → crée l'organisation + compte Auth + envoie l'email d'identifiants, comme le script actuel) et **Refuser** (confirmation → email de refus).
- Vérification en base au moment de l'action : impossible d'approuver deux fois la même demande.
- Badge compteur des demandes en attente dans la sidebar admin.

## 3. Ajustement

L'email de notification à rmizkk@gmail.com inclut désormais un lien direct vers `/admin/demandes`.

## 4. Vérification

- `npm run build` sans erreur.
- Teste : création super admin → login /admin → demande de test visible → Approuver → email reçu + org listée → Suspendre (connexion org bloquée) → Réactiver → suppression avec confirmation forte. Vérifie qu'une organisation normale ne peut pas ouvrir /admin.
- Commit « Interface super admin » et push.
