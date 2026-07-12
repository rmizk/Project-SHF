# Prompt 6 — Tableau de bord + page Profil

Regarde les screens `design/screens/tableau-de-bord/` et `design/screens/profil/`, et lis la section « Navigation et layout » de CLAUDE.md.

## Tableau de bord

1. 4 cartes : Fond de roulement (montant actuel + variation vs mois précédent), TVA à payer ce mois (avec échéance), Attachements en attente (nombre + montant en attente), Dépenses du mois (total + mini-graphe).
2. Liste « Dernières opérations » agrégée depuis les 4 modules réels (factures, attachements, dépenses, paiements) avec montants signés et badges d'état. **Pas de concept d'« écriture »** : les actions rapides pointent vers les modals des modules.
3. Tout est calculé côté serveur pour l'organisation courante et le mois en cours.

## Page Profil (screens `profil/` — attention : le layout final diffère du screen, suivre docs/critique-design.md « Correction complémentaire 3+4 »)

1. Titre « Profil », sous-titre nom de l'organisation. Colonne gauche : carte « Profil de l'organisation » (logo uploadable vers le bucket `logos`, nom de la société modifiable, section changement de mot de passe). Colonne droite : carte « Fond de roulement » (montant actuel modifiable + historique des modifications, sans noms de personnes). En dessous, pleine largeur : gestion des catégories de dépenses (ajouter/renommer/supprimer).
2. Item Profil de la sidebar : logo + nom de l'organisation, chevron droit, état actif quand la page est ouverte. Sur mobile : accès via l'avatar de la TopBar.

Teste, puis commit.
