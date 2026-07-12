# Prompt 3 — Module Services

Lis CLAUDE.md (règle métier n°5), regarde les screens `design/screens/services/` et implémente le module Services :

1. **Liste des attachements** : client, montant HT, TVA, date, état (badge « En attente » orange / « Payé » vert), bénéfice net (« Net à définir » tant que non payé). Filtre mois/année + recherche.
2. **Modal « Ajouter un attachement »** : client avec auto-complétion (table `clients`), montant HT, taux de TVA, date, état initial.
3. **Modal « Enregistrer le paiement »** (screen `06-services-modal-de-paiement-*`) au passage En attente → Payé : rappel du montant HT, lignes de retenues ajoutables/supprimables (libellé + montant, table `attachement_deductions`), total des retenues en rouge, bénéfice net calculé en vert avec la formule affichée. Confirmation = statut `paid`, `paid_at`, `net_profit` calculés côté serveur.
4. Versions mobile fidèles aux screens (cartes avec HT et Net).

Teste le cycle complet attente → payé → bénéfice net, puis commit.
