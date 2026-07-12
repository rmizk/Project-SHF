# Critique de design — Maquettes Comptéo (12/07/2026)

Basée sur la revue des écrans bureau (clair/sombre) et mobile de tous les modules.

## Impression générale

Très bon niveau : style cohérent et professionnel, adapté à une application financière. La hiérarchie visuelle est claire, les formats TND à 3 décimales sont respectés, et plusieurs décisions du PRD sont fidèlement traduites (TTC calculé automatiquement, retenues saisies avec lignes ajoutables, crédit de TVA en saisie manuelle, قباضة présente). Le plus gros risque n'est pas esthétique : **certains écrans inventent des concepts qui ne sont pas dans le PRD**.

## Écarts par rapport au PRD (à corriger avant développement)

| Constat | Gravité | Recommandation |
|---|---|---|
| Le tableau de bord introduit « Nouvelle écriture » et « Dernières opérations » avec des catégories (Charges, Ventes) qui n'existent dans aucun module | 🔴 Critique | Remplacer par des actions rapides par module (« + Facture », « + Attachement », « + Dépense ») et une liste des dernières opérations issue des 4 modules réels |
| Profil utilisateur individuel « Sonia Amri — Directrice financière » | 🔴 Critique | La v1 a un seul compte par organisation : afficher le nom de la société (SARL Meridian) à la place |
| Carte « Exercice 2025 clôturé — Générez votre liasse fiscale » dans la sidebar | 🟡 Modéré | Fonctionnalité inexistante au PRD — à supprimer (ou garder pour plus tard en P2) |
| Dashboard : « Montant à rapprocher » sous les attachements | 🟡 Modéré | Le rapprochement bancaire n'est pas dans le périmètre — remplacer par « Montant en attente » |
| Page de connexion : « 1 240+ sociétés · 99,9 % disponibilité » | 🟢 Mineur | Chiffres inventés — à retirer ou remplacer par un texte descriptif |

## Utilisabilité

| Constat | Gravité | Recommandation |
|---|---|---|
| **Mobile : la barre de navigation basse n'a que 4 onglets** (Bord, Achats, Compta, Dépenses) — Services et Paramètres sont inaccessibles | 🔴 Critique | Ajouter Services (module central !) ; Paramètres peut passer derrière l'avatar ou un onglet « Plus » |
| Mobile Services : le bouton flottant « Ajouter un attachement » recouvre la dernière ligne de la liste (Atlas Média) | 🟡 Modéré | Ajouter un padding bas à la liste égal à la hauteur du bouton |
| Modal Achats : la liste d'auto-complétion du fournisseur recouvre les champs suivants — impossible de vérifier la présence du champ Date | 🟡 Modéré | Vérifier que le modal contient bien N° facture + Date ; limiter la hauteur du dropdown |
| Modal Comptabilité : le bouton d'état « À payer » casse sur deux lignes (« À / payer ») | 🟢 Mineur | Élargir le bouton ou réduire le padding |
| Badge « +8,2 % » du dashboard mobile : le « % » passe à la ligne | 🟢 Mineur | `white-space: nowrap` sur les badges |

## Cohérence

Globalement excellente : sidebar, cartes, badges d'état, filtres mois/année et boutons « + Ajouter » identiques sur les 4 modules ; le thème sombre est un miroir fidèle du clair. Deux détails : les états En attente/Payé utilisent les mêmes couleurs partout (bien), mais le badge « Particulier » (pointillé orange) mériterait une légende ou une infobulle ; et l'icône pièce jointe absente est un tiret sur Achats — reprendre le même motif sur Dépenses (déjà fait, bien).

## Accessibilité (pré-audit rapide)

- **Contrastes** : les textes secondaires gris clair (« vs 316 900,000 le mois dernier », placeholders, sous-titres) semblent sous le ratio 4,5:1 — à foncer d'un cran. À vérifier aussi : badge vert clair sur fond blanc.
- **Cibles tactiles** : boutons pièce jointe (icône seule) et menus « ⋮ » un peu petits sur mobile — viser 44×44 px.
- **Libellés** : les boutons icône (pièce jointe, notification, ⋮) devront avoir des `aria-label` en développement.
- Un audit complet WCAG pourra être fait sur le code (`/design:accessibility-review`).

## Ce qui fonctionne très bien

- Le modal « Enregistrer le paiement » : montant HT rappelé, lignes de retenues ajoutables, total des retenues en rouge, bénéfice net en vert avec la formule affichée — exactement la décision du PRD, et pédagogique.
- La carte TVA du mois : équation visuelle « collectée − déductible − crédit = à payer » avec le crédit en saisie manuelle — conforme et très lisible.
- L'état vide Achats avec appel à l'action centré.
- L'historique du fond de roulement avec variations colorées.
- Le champ pièce jointe conditionnel sur les dépenses (« requise pour une dépense avec facture »).

## Recommandations prioritaires

1. **Réaligner le tableau de bord sur le PRD** — supprimer « Nouvelle écriture »/« écritures », brancher les dernières opérations sur les 4 modules réels. C'est le seul écran qui raconte une autre application.
2. **Réparer la navigation mobile** — ajouter Services, régler le chevauchement du bouton flottant.
3. **Retirer les éléments hors périmètre** — profil individuel, liasse fiscale, « à rapprocher », stats marketing.
4. **Passe de finition** — bouton « À payer » sur une ligne, badges sans retour à la ligne, contrastes des textes secondaires.

## Prompt de correction suggéré pour Claude Design

> Corrections : 1) Tableau de bord : remplace le bouton « Nouvelle écriture » par trois actions rapides (+ Facture, + Attachement, + Dépense) et renomme « Dernières opérations » en listant des éléments des modules Achats/Services/Dépenses/Comptabilité uniquement (pas de catégories Charges/Ventes). 2) Remplace le profil « Sonia Amri » par le nom de l'organisation « SARL Meridian ». 3) Supprime la carte « Exercice 2025 clôturé » et la mention « Montant à rapprocher ». 4) Mobile : la barre de navigation basse doit être **présente sur tous les écrans de l'application** (Tableau de bord, Achats, Services, Comptabilité, Dépenses, Paramètres) — pas seulement sur le tableau de bord ; ajoute « Services » aux onglets, et un espace sous les listes pour que le bouton flottant ne recouvre ni la dernière ligne ni la barre de navigation. 5) Corrige le bouton « À payer » qui s'affiche sur deux lignes et empêche les badges de pourcentage de casser à la ligne. 6) Fonce légèrement les textes secondaires gris pour le contraste.

## Correction complémentaire (à envoyer séparément — navigation mobile)

> Sur mobile, la barre de navigation basse doit être présente sur tous les écrans de l'application (Tableau de bord, Achats, Services, Comptabilité, Dépenses, Paramètres), pas seulement sur le tableau de bord. Ajoute aussi un espace sous les listes pour que le bouton flottant ne recouvre ni la dernière ligne ni la barre de navigation.

**English version:**

> On mobile, the bottom navigation bar must be visible on every screen of the app (Tableau de bord, Achats, Services, Comptabilité, Dépenses, Paramètres), not just the dashboard. Also add bottom padding under lists so the floating button covers neither the last row nor the nav bar. Keep all UI text in French.

## Correction complémentaire 2 (navigation Paramètres — décision du 12/07)

Paramètres sort de la navigation principale : la page s'ouvre en cliquant sur le nom de l'organisation en bas de la sidebar (bureau) ou sur l'avatar en haut (mobile). La barre mobile passe à 5 onglets : Tableau de bord, Achats, Services, Comptabilité, Dépenses.

> Navigation change (keep all UI text in French): remove "Paramètres" from the sidebar and from the mobile bottom nav. The Paramètres page opens when clicking the organization name at the bottom of the sidebar (desktop) or the avatar in the top bar (mobile) — add a chevron or gear hint so it's discoverable. The mobile bottom nav now has exactly 5 tabs: Tableau de bord, Achats, Services, Comptabilité, Dépenses.

## Correction complémentaire 3+4 fusionnée (page Profil — prompt unique envoyé)

> Profile page fixes (keep all UI text in French): 1) Rename the "Paramètres" page to "Profil" — page title "Profil", subtitle "SARL Meridian · Organisation". 2) The organization item at the bottom of the sidebar must show an active state (same highlight treatment as the module nav items) when the Profil page is open. 3) In that sidebar item, replace the sun icon with a right chevron. 4) Move the light/dark theme toggle to the top bar, right of the screen next to the avatar, as a sun/moon icon button — and remove the "Apparence" card from the Profil page since the toggle is now global. 5) Remove the standalone "Mot de passe" card. 6) Create a "Profil de l'organisation" card in the LEFT column containing: a logo upload zone at the top (square avatar with an upload/change button, PNG/JPG), a "Nom de la société" text field, then a "Mot de passe" section inside the same card with the fields Mot de passe actuel / Nouveau / Confirmer and the "Changer le mot de passe" button. 7) Move the "Fond de roulement" card (with its "Historique des modifications") to the RIGHT column — and in the history list, remove the person names (Sonia Amri, Karim Belhadj), show only amount, variation and date. 8) "Catégories de dépenses" stays full-width below the two columns.

## Correction complémentaire 3 (page Profil — décision du 12/07)

La page « Paramètres » devient « **Profil** » (profil de l'organisation). Item sidebar avec état actif + chevron droit (plus d'icône soleil). Toggle clair/sombre déplacé en haut à droite près de l'avatar ; la carte « Apparence » disparaît de la page. L'historique du fond de roulement n'affiche plus de noms de personnes (un seul compte par organisation en v1).

> Profile page fixes (keep all UI text in French): 1) Rename the "Paramètres" page to "Profil" — page title "Profil", subtitle "SARL Meridian · Organisation". 2) The organization item at the bottom of the sidebar must show an active state (same highlight treatment as the module nav items) when the Profil page is open. 3) In that sidebar item, replace the sun icon with a right chevron. 4) Move the light/dark theme toggle to the top bar, right of the screen next to the avatar, as a sun/moon icon button — and remove the "Apparence" card from the Profil page since the toggle is now global. 5) In the "Historique des modifications" list, remove the person names (Sonia Amri, Karim Belhadj) — show only amount, variation and date.

## Correction complémentaire 4 (layout page Profil — décision du 12/07)

Nouveau layout : colonne gauche = carte « Profil de l'organisation » (logo de la société, nom de la société, section changement de mot de passe) ; colonne droite = carte « Fond de roulement » avec historique ; « Catégories de dépenses » en pleine largeur en dessous. Les cartes « Apparence » et « Mot de passe » autonomes disparaissent.

> Profil page layout rework (keep all UI text in French): 1) Remove the "Mot de passe" card and the "Apparence" card. 2) Create a "Profil de l'organisation" card in the LEFT column containing: a logo upload zone at the top (square avatar with an upload/change button, PNG/JPG), a "Nom de la société" text field, then a "Mot de passe" section inside the same card with the fields Mot de passe actuel / Nouveau / Confirmer and the "Changer le mot de passe" button. 3) Move the "Fond de roulement" card (with its "Historique des modifications") to the RIGHT column. 4) "Catégories de dépenses" stays full-width below the two columns.

## Same prompt in English (UI text stays in French)

> Fixes (keep all UI text in French): 1) Dashboard: replace the "Nouvelle écriture" button with three quick actions (+ Facture, + Attachement, + Dépense), and rework "Dernières opérations" so it only lists items from the Achats/Services/Dépenses/Comptabilité modules (no Charges/Ventes categories). 2) Replace the "Sonia Amri" user profile with the organization name "SARL Meridian". 3) Remove the "Exercice 2025 clôturé" card and the "Montant à rapprocher" mention. 4) Mobile: the bottom navigation bar must be **visible on every screen of the app** (Tableau de bord, Achats, Services, Comptabilité, Dépenses, Paramètres) — not just the dashboard; add "Services" to the tabs, and add bottom padding under lists so the floating button covers neither the last row nor the nav bar. 5) Fix the "À payer" status button wrapping onto two lines, and prevent percentage badges from line-breaking. 6) Slightly darken the secondary gray text for better contrast.
