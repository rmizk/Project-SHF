# Prompt 5 — Module Comptabilité

Lis CLAUDE.md (règle métier n°4), regarde les screens `design/screens/comptabilite/` et implémente le module Comptabilité :

1. **Carte « TVA du mois »** en haut (fidèle au screen) : équation visuelle TVA collectée − TVA déductible − crédit de TVA = TVA à payer. Les deux premiers termes sont calculés côté serveur depuis les attachements et factures du mois filtré. Champ « Crédit de TVA à reporter » : saisie manuelle, sauvegardée dans `vat_credits` (unique par mois). Si le résultat est négatif, afficher « Crédit de TVA » sans report automatique.
2. **Liste des paiements** : type (TVA, Frais de comptable, قباضة (recette), CNSS, Assurance chantier — avec icônes comme sur les screens), montant, date, état (À payer / Payé). Filtre mois/année + recherche.
3. **Modal « Ajouter un paiement »** : type, montant, date, état. Pour le type TVA, proposer de préremplir le montant avec la TVA calculée du mois.
4. Le libellé قباضة doit s'afficher correctement (texte arabe, direction RTL locale au mot).

Vérifie le calcul de TVA avec des données de test des modules Achats et Services, puis commit.
