# Prompt 4 — Module Dépenses

Lis CLAUDE.md (règle métier n°6), regarde les screens `design/screens/depenses/` et implémente le module Dépenses :

1. **Liste des dépenses** : nom, catégorie, type (badges : « Avec facture » bleu, « Sans facture » gris, « Particulier » orange pointillé), montant, date, pièce (icône). Filtre mois/année + recherche.
2. **Modal « Ajouter une dépense »** : sélecteur de type en 3 boutons, catégorie (depuis `expense_categories`), nom, montant, date. **La zone de dépôt pièce jointe n'apparaît que si type = « Avec facture »** et devient alors obligatoire (screens `10-*` : les deux états du modal). Upload vers le bucket `expense-receipts`.
3. Les dépenses « Particulier » sont marquées visuellement dans la liste.

Teste les 3 types (dont la validation de la pièce jointe), puis commit.
