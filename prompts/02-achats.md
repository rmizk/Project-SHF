# Prompt 2 — Module Achats

Regarde les screens `design/screens/achats/` (liste, modal d'ajout, état vide) et implémente le module Achats :

1. **Liste des factures** : colonnes Fournisseur (avatar initiales), N° facture, Date, Montant HT, TVA, TTC, Pièce (icône si jointe). Filtre mois/année (composant `MonthYearFilter`) + recherche (fournisseur ou n° facture). État vide fidèle au screen.
2. **Modal « Ajouter une facture »** : fournisseur avec auto-complétion (création à la volée dans `suppliers`), n° facture, date, montant HT, taux de TVA en boutons (0/7/13/19 %), TTC calculé automatiquement en lecture seule, zone de dépôt pièce jointe optionnelle (PDF/JPG/PNG, 10 Mo, upload vers le bucket `invoices`).
3. Blocage des doublons (même fournisseur + même n°) avec message clair en français.
4. Versions mobile fidèles aux screens (cartes au lieu du tableau si c'est ce que montrent les maquettes).

Teste l'ajout, le filtre, la recherche et l'upload, puis commit.
