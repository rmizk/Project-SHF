# Prompt 8 — Itérations design & fonctionnalités (v1.1)

Corrections et améliorations décidées après revue de l'application. Commence par les composants partagés, puis applique-les aux modules.

## 1. Corrections globales

1. **Thème clair : la sidebar reste sombre.** Corrige : en mode clair, la sidebar doit être claire (fond blanc/gris clair, textes sombres), comme sur les maquettes `design/screens/tableau-de-bord/02-tableau-de-bord-bureau-clair.png`. Vérifie aussi la TopBar et la BottomNav mobile.
2. **Ordre de navigation** : Dépenses passe AVANT Comptabilité — sidebar, bottom nav mobile, et partout ailleurs. Mets aussi à jour CLAUDE.md (section Navigation).
3. **Composant `DatePicker` maison** : le calendrier natif du navigateur casse le design (voir le modal Achats). Crée un date picker stylé cohérent avec l'application (thèmes clair/sombre, français, format JJ/MM/AAAA) et remplace TOUS les `<input type="date">` de l'application par ce composant (modals Achats, Services, Dépenses, Comptabilité, et le nouveau modal Fond de roulement ci-dessous).
4. **Composant `RowActionsMenu`** : menu ⋮ réutilisable pour les lignes de tableau. IMPORTANT : affiche le menu via un **portal** (pas dans le conteneur du tableau) pour qu'il ne soit jamais rogné par l'overflow — c'est le bug visible dans Services où le menu de la dernière ligne force un scroll interne. Le menu s'ouvre vers le haut si l'espace sous le bouton est insuffisant.

## 2. Actions Modifier / Supprimer sur les tableaux

Ajoute le `RowActionsMenu` (⋮) sur chaque ligne des modules **Achats**, **Services** et **Dépenses** avec :

- **Modifier** : ouvre le modal d'ajout prérempli avec les valeurs de la ligne, titre « Modifier… », enregistre en base (y compris remplacement de pièce jointe).
- **Supprimer** : dialogue de confirmation (« Supprimer la facture FCT-… ? Cette action est irréversible. ») avant suppression, avec suppression de la pièce jointe du Storage le cas échéant.
- Dans Services, conserve l'action existante « Modifier les retenues » dans le même menu.
- Server Actions avec vérification d'organisation (RLS) pour update et delete.

## 3. Page Profil — carte Fond de roulement

1. Remplace le bouton « Mettre à jour » par **« + Ajouter »** : il ouvre un modal (montant + date, avec le DatePicker maison). Migration : ajoute une colonne `effective_date date` à `working_capital_history` si nécessaire.
2. N'enregistre pas d'entrée si le montant saisi est identique au montant actuel (fini les lignes « +0,000 »).
3. **Historique** : hauteur limitée à 4 lignes, scroll interne au-delà — la carte Fond de roulement ne doit pas dépasser la hauteur de la carte Profil de l'organisation.
4. **Carte Catégories de dépenses** : ajoute un bouton collapse/expand (chevron) dans son en-tête, état replié/déplié mémorisé (localStorage).

## 4. Vérification

- `npm run build` sans erreur.
- Teste : thème clair complet, édition + suppression dans les 3 modules (avec confirmation), menu ⋮ de la DERNIÈRE ligne d'un tableau (ne doit plus être rogné), date picker stylé dans tous les modals, ajout au fond de roulement via modal, collapse des catégories.
- Commit « Itérations v1.1 : thème clair, actions tableaux, date picker, profil » et push.
