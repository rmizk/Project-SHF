# PRD — Application de Gestion Financière pour Sociétés (BTP / Services)

**Version :** 1.0 (MVP) · **Date :** 11 juillet 2026 · **Auteur :** Ramzi · **Langue de l'application : Français**

---

## 1. Énoncé du problème

Les petites sociétés de travaux et de services gèrent aujourd'hui leurs finances (factures d'achat, attachements clients, dépenses, obligations fiscales et sociales) sur Excel ou sur papier. Résultat : pas de vision claire du fond de roulement, calcul de la TVA à payer fait manuellement en fin de mois avec risque d'erreur, et échéances (TVA, CNSS, قباضة, assurance chantier) suivies de mémoire. Le coût de l'inaction : erreurs de déclaration, pénalités de retard, et un gérant qui ne connaît jamais sa trésorerie réelle.

## 2. Objectifs

1. **Centraliser** toutes les opérations financières de la société (achats, services, dépenses, paiements) dans une seule application en français.
2. **Automatiser le calcul de la TVA à payer** par période (TVA collectée − TVA déductible), sans calcul manuel.
3. **Donner une visibilité sur le fond de roulement** dès la page d'accueil.
4. **Réduire le temps de préparation comptable mensuelle** (objectif : passer de plusieurs heures à moins de 30 minutes).
5. **Contrôler l'accès** : seules les organisations approuvées peuvent utiliser la plateforme.

## 3. Non-objectifs (hors périmètre v1)

- **Pas d'entité Chantier/Projet** — décision explicite pour la v1. Les modules restent indépendants. (Conséquence assumée : le bénéfice net est calculé au niveau de l'attachement seul, sans rattachement des achats/dépenses. À revoir en v2.)
- **Pas d'intégration bancaire** ni de rapprochement automatique — trop complexe pour le MVP.
- **Pas de génération de déclarations officielles** (TVA, CNSS) — l'application calcule les montants, elle ne télédéclare pas.
- **Pas de multi-langue** — l'interface est en français uniquement.
- **Pas de gestion de rôles avancée** (admin/comptable/lecture seule) — un seul niveau d'accès par organisation en v1.
- **Pas d'application mobile native** — web responsive uniquement.

## 4. Utilisateurs cibles

- **Le gérant** d'une petite société de travaux/services : saisit les opérations, consulte le fond de roulement et la TVA due.
- **L'administrateur de la plateforme** (vous) : approuve ou refuse les demandes d'inscription des organisations.

## 5. Accès et authentification

### Parcours d'inscription

1. Le visiteur remplit un formulaire de **demande d'ajout d'organisation** (nom de la société, matricule fiscal, email, téléphone).
2. L'administrateur de la plateforme **approuve ou refuse** la demande.
3. Si approuvée : l'organisation reçoit par email un **ID d'organisation** et un **mot de passe généré**.
4. Connexion avec ID organisation + mot de passe.

### User stories

- En tant que **gérant**, je veux demander l'ajout de mon organisation afin d'accéder à la plateforme.
- En tant que **gérant**, je veux recevoir mes identifiants par email dès l'approbation afin de me connecter sans étape supplémentaire.
- En tant que **gérant**, je veux pouvoir changer mon mot de passe afin de sécuriser mon compte.
- En tant qu'**administrateur plateforme**, je veux voir la liste des demandes en attente afin de les approuver ou refuser.

### Critères d'acceptation

- [ ] Une organisation non approuvée ne peut pas se connecter (message d'erreur clair en français).
- [ ] Le mot de passe généré doit être changé à la première connexion.
- [ ] Réinitialisation du mot de passe possible par email.
- [ ] Toute demande refusée reçoit une notification email.

## 6. Modules et exigences

### 6.0 Fond de roulement

**Description :** espace où l'utilisateur saisit le fond de roulement de la société, affiché en permanence sur le tableau de bord.

| Priorité | Exigence | Critères d'acceptation |
|---|---|---|
| P0 | Saisie manuelle du fond de roulement initial | Champ montant (TND), modifiable, historique des modifications conservé |
| P0 | Affichage sur le tableau de bord | Visible dès la connexion |
| P1 | Recalcul automatique : fond initial + attachements payés − achats − dépenses (y compris type « Particulier ») − paiements comptabilité | Le calcul est détaillé au clic (transparence) |

### 6.1 Module Achats

**Liste des factures**

- En tant que gérant, je veux voir la liste des factures d'achat afin de suivre mes engagements fournisseurs.
- En tant que gérant, je veux filtrer par date (mois/année) ou rechercher (fournisseur, numéro) afin de retrouver une facture rapidement.

**Ajout de facture (modal)**

| Champ | Type | Obligatoire |
|---|---|---|
| Nom du fournisseur | Texte (auto-complétion sur fournisseurs existants) | Oui |
| Numéro de facture | Texte, unique par fournisseur | Oui |
| Date de facture | Date | Oui |
| Montant HT | Nombre (TND) | Oui |
| Taux de TVA | Sélection (0 %, 7 %, 13 %, 19 %) | Oui |
| Montant TTC | Calculé automatiquement | — |
| Pièce jointe | Fichier (PDF/image, max 10 Mo) | Non |

> Les champs Montant HT et Taux de TVA sont indispensables : sans eux, le calcul de la TVA déductible (module Comptabilité) est impossible.

**Critères d'acceptation**

- [ ] Le TTC se calcule automatiquement à la saisie du HT et du taux.
- [ ] Un doublon (même fournisseur + même numéro) est bloqué avec un message explicite.
- [ ] Le filtre mois/année retourne uniquement les factures de la période.
- [ ] La liste affiche : fournisseur, numéro, date, HT, TVA, TTC, pièce jointe (icône).

### 6.2 Module Services

**Ajout d'un attachement (modal)**

| Champ | Type | Obligatoire |
|---|---|---|
| Nom du client | Texte (auto-complétion) | Oui |
| Montant HT | Nombre (TND) | Oui |
| Taux de TVA | Sélection | Oui |
| Date | Date | Oui |
| État | En attente / Payé | Oui |

**Comportement :**

- Si l'état passe à **Payé**, l'application demande la **saisie des retenues et charges** appliquées à ce paiement, puis calcule le **bénéfice net** de l'attachement.
- Formule v1 (sans chantier) : `Bénéfice net = Montant HT − retenues et charges saisies au moment du paiement`.

**User stories**

- En tant que gérant, je veux enregistrer un attachement avec son état afin de suivre ce qui m'est dû.
- En tant que gérant, je veux voir le bénéfice net calculé dès qu'un attachement est payé afin de connaître ma marge réelle.
- En tant que gérant, je veux voir la liste des attachements en attente afin de relancer mes clients.

**Critères d'acceptation**

- [ ] Le passage En attente → Payé ouvre la saisie des retenues/charges et enregistre la date de paiement.
- [ ] Le bénéfice net est calculé automatiquement dès la validation de la saisie.
- [ ] Le détail du calcul du bénéfice net est consultable (pas une boîte noire).

### 6.3 Module Comptabilité

**Liste des paiements**

- Liste de toutes les obligations payées ou à payer, filtrable par date (mois/année) et par recherche.

**Types de paiements gérés (v1)**

| Type | Calcul |
|---|---|
| **TVA à payer** | Calculée automatiquement par période : TVA collectée (attachements) − TVA déductible (factures d'achat) |
| **Frais de comptable** | Saisie manuelle (montant + date) |
| **قباضة (autorités financières)** | Saisie manuelle : montant dû aux autorités de régulation financière (montant + date) |
| **CNSS** | Saisie manuelle (montant + trimestre) |
| **Assurance chantier** | Saisie manuelle (montant + date + référence) |

**User stories**

- En tant que gérant, je veux voir la TVA à payer du mois calculée automatiquement afin de préparer ma déclaration sans erreur.
- En tant que gérant, je veux enregistrer les paiements CNSS, قباضة, comptable et assurance afin d'avoir un historique complet.
- En tant que gérant, je veux filtrer les paiements par mois afin de préparer les déclarations avec mon comptable.

**Critères d'acceptation**

- [ ] La TVA à payer d'une période = somme TVA des attachements de la période − somme TVA des factures d'achat de la période − crédit de TVA saisi.
- [ ] Si la TVA déductible dépasse la TVA collectée, un **crédit de TVA** est affiché ; l'utilisateur **saisit manuellement** le crédit à reporter sur la période suivante (pas de report automatique).
- [ ] Chaque paiement a un état : À payer / Payé.

### 6.4 Module Dépenses

**Liste des dépenses** — filtrable par date (mois/année) et par recherche.

**Ajout d'une dépense (modal)**

| Champ | Type | Obligatoire |
|---|---|---|
| Type | Avec facture / Sans facture / Particulier | Oui |
| Catégorie | Sélection (liste gérée par l'organisation : carburant, matériel, salaires, loyer…) | Oui |
| Nom de la dépense | Texte | Oui |
| Montant | Nombre (TND) | Oui |
| Date | Date | Oui |
| Pièce jointe | Fichier — affiché **uniquement si type = Avec facture** | Oui si avec facture |

**Critères d'acceptation**

- [ ] Le champ pièce jointe n'apparaît que si le type est « Avec facture ».
- [ ] Les dépenses de type « Particulier » sont marquées visuellement et **incluses** dans le calcul du fond de roulement.
- [ ] Les catégories sont modifiables dans les paramètres.

## 7. Exigences transverses

| Priorité | Exigence |
|---|---|
| P0 | Interface 100 % en français (libellés, messages d'erreur, emails) |
| P0 | Montants en TND, format `1 234,567` (3 décimales, norme tunisienne) |
| P0 | Isolation stricte des données par organisation (multi-tenant) |
| P0 | Filtres mois/année identiques et cohérents sur les 4 modules |
| P1 | Tableau de bord : fond de roulement, TVA due du mois, attachements en attente, total dépenses du mois |
| P1 | Export CSV des listes (pour le comptable) |
| P2 | Rappels d'échéances (TVA mensuelle, CNSS trimestrielle, قباضة) |
| P2 | Comptes utilisateurs multiples par organisation (email + rôles) |
| P2 | Entité Chantier/Projet et bénéfice net par chantier |

## 8. Indicateurs de succès

**Indicateurs avancés (2–4 semaines après lancement)**

- 80 % des organisations approuvées saisissent au moins 5 opérations la première semaine.
- Le calcul de TVA du mois est consulté par 100 % des organisations actives avant le 28 du mois.

**Indicateurs retardés (3 mois)**

- Rétention : 70 % des organisations actives le mois 1 le sont encore le mois 3.
- Temps de préparation comptable mensuelle déclaré < 30 minutes (enquête utilisateur).

## 9. Questions ouvertes — Décisions

Toutes les questions ouvertes ont été tranchées le 11/07/2026 :

| # | Question | Décision |
|---|---|---|
| 1 | Retenues pour le calcul du bénéfice net d'un attachement | **Saisie manuelle** des retenues/charges au moment du paiement ; le bénéfice net est calculé à partir de cette saisie |
| 2 | Mot de passe unique ou comptes individuels ? | **Mot de passe unique** par organisation pour la v1 (comptes individuels en P2) |
| 3 | Que couvre la rubrique قباضة ? | **Montant simple** dû aux autorités de régulation financière (montant + date, pas de sous-types) |
| 4 | Gestion du crédit de TVA | **Saisie manuelle** : le crédit est affiché, l'utilisateur saisit lui-même le montant à reporter (pas de report automatique) |
| 5 | Dépenses « Particulier » dans le fond de roulement ? | **Oui, incluses** dans le recalcul du fond de roulement |

## 10. Phasage proposé

- **Phase 1 (MVP)** — Accès organisation, fond de roulement (saisie), Achats, Dépenses, Services (attachements + bénéfice net avec retenues saisies au paiement).
- **Phase 2** — Comptabilité complète (TVA auto + crédit saisi manuellement + paiements), tableau de bord, export CSV.
- **Phase 3** — Rappels d'échéances, comptes multiples, puis entité Chantier.
