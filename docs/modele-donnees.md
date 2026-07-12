# Modèle de données — Supabase (PostgreSQL)

Version 1.0 · 12/07/2026 · Aligné sur le PRD et les décisions validées.

## Vue d'ensemble

```
organization_requests          (demandes d'inscription, hors espace privé)
organizations ─┬─ working_capital_history   (fond de roulement)
               ├─ suppliers ── purchase_invoices        [Module Achats]
               ├─ clients ──── attachements ── attachement_deductions   [Module Services]
               ├─ expense_categories ── expenses        [Module Dépenses]
               ├─ accounting_payments                   [Module Comptabilité]
               └─ vat_credits                           (crédit de TVA saisi par mois)
```

Toutes les tables privées portent `organization_id` + politique RLS. Montants en `numeric(14,3)` (TND, 3 décimales). Jamais de `float`.

## Tables

### organization_requests — demandes d'ajout (formulaire public)

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| company_name | text NOT NULL | Nom de la société |
| tax_id | text NOT NULL | Matricule fiscal |
| email | text NOT NULL | Reçoit les identifiants après approbation |
| phone | text | |
| status | text NOT NULL | `pending` / `approved` / `rejected` — défaut `pending` |
| created_at / processed_at | timestamptz | |

RLS : insertion publique (anon) autorisée ; lecture/écriture réservées à l'administrateur plateforme (service role).

### organizations

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_code | text UNIQUE NOT NULL | Identifiant de connexion affiché (ex. `org-2841`) |
| name | text NOT NULL | |
| tax_id | text NOT NULL | |
| email / phone | text | |
| logo_path | text | Logo de la société (Supabase Storage, modifiable depuis la page Profil) |
| auth_user_id | uuid UNIQUE NOT NULL | Lien vers `auth.users` — un compte Auth par organisation (v1) |
| must_change_password | boolean | `true` à la création (changement forcé à la 1re connexion) |
| created_at | timestamptz | |

Connexion : l'utilisateur saisit `org_code` + mot de passe → l'app résout `org_code` en email technique interne (ex. `org-2841@app.interne`) et appelle Supabase Auth. `organization_id` est placé dans `app_metadata` du JWT pour les politiques RLS.

### working_capital_history — fond de roulement

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK NOT NULL | |
| amount | numeric(14,3) NOT NULL | Nouveau montant saisi |
| note | text | |
| created_at | timestamptz | |

Le montant actuel = dernière ligne. P1 : le recalcul automatique (fond initial + attachements payés − achats − dépenses **y compris « Particulier »** − paiements comptabilité) se fait dans une vue, sans modifier cette table.

### suppliers / clients — auto-complétion

| Colonne | Type |
|---|---|
| id | uuid PK |
| organization_id | uuid FK NOT NULL |
| name | text NOT NULL |

Contrainte `UNIQUE (organization_id, name)`. Créés à la volée depuis les modals.

### purchase_invoices — Module Achats

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK NOT NULL | |
| supplier_id | uuid FK NOT NULL | |
| invoice_number | text NOT NULL | |
| invoice_date | date NOT NULL | |
| amount_ht | numeric(14,3) NOT NULL | |
| vat_rate | numeric(4,2) NOT NULL | 0 / 7 / 13 / 19 |
| amount_ttc | numeric(14,3) GENERATED | `amount_ht * (1 + vat_rate/100)` |
| attachment_path | text | Chemin Supabase Storage (optionnel) |
| created_at | timestamptz | |

Contrainte anti-doublon : `UNIQUE (organization_id, supplier_id, invoice_number)`.
Index : `(organization_id, invoice_date)` pour les filtres mois/année.

### attachements — Module Services

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK NOT NULL | |
| client_id | uuid FK NOT NULL | |
| amount_ht | numeric(14,3) NOT NULL | |
| vat_rate | numeric(4,2) NOT NULL | |
| attachement_date | date NOT NULL | |
| status | text NOT NULL | `pending` / `paid` — défaut `pending` |
| paid_at | date | Renseigné au passage à `paid` |
| net_profit | numeric(14,3) | Calculé côté serveur : `amount_ht − somme(deductions)` — NULL tant que non payé |
| created_at | timestamptz | |

### attachement_deductions — retenues saisies au paiement

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| attachement_id | uuid FK NOT NULL | `ON DELETE CASCADE` |
| label | text NOT NULL | ex. « Retenue à la source (1,5 %) » |
| amount | numeric(14,3) NOT NULL | |

Décision PRD : montants saisis librement au moment du paiement (pas de pourcentages figés).

### expense_categories — catégories gérées dans Paramètres

| Colonne | Type |
|---|---|
| id | uuid PK |
| organization_id | uuid FK NOT NULL |
| name | text NOT NULL |

`UNIQUE (organization_id, name)`. Semées à la création de l'organisation (Restauration, Transport, Bureautique, Relations, Divers, Loyer…).

### expenses — Module Dépenses

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK NOT NULL | |
| type | text NOT NULL | `with_invoice` / `without_invoice` / `personal` |
| category_id | uuid FK NOT NULL | |
| name | text NOT NULL | |
| amount | numeric(14,3) NOT NULL | |
| expense_date | date NOT NULL | |
| attachment_path | text | **Obligatoire si `type = 'with_invoice'`** (contrainte CHECK) |
| created_at | timestamptz | |

Décision PRD : les dépenses `personal` sont marquées visuellement mais **incluses** dans le fond de roulement recalculé.

### accounting_payments — Module Comptabilité

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK NOT NULL | |
| type | text NOT NULL | `tva` / `accountant_fees` / `qabadha` / `cnss` / `site_insurance` |
| amount | numeric(14,3) NOT NULL | |
| payment_date | date NOT NULL | |
| status | text NOT NULL | `to_pay` / `paid` |
| note | text | |
| created_at | timestamptz | |

### vat_credits — crédit de TVA (saisie manuelle par mois)

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK NOT NULL | |
| period | date NOT NULL | 1er jour du mois concerné |
| amount | numeric(14,3) NOT NULL | |

`UNIQUE (organization_id, period)`. Décision PRD : pas de report automatique — l'utilisateur saisit le crédit à déduire.

## Calcul de la TVA du mois (vue ou Server Action)

```
TVA à payer (mois M) =
    Σ (attachements.amount_ht × vat_rate/100  où attachement_date ∈ M)   -- TVA collectée
  − Σ (purchase_invoices.amount_ht × vat_rate/100 où invoice_date ∈ M)  -- TVA déductible
  − COALESCE(vat_credits.amount pour M, 0)                              -- crédit saisi
```

Si le résultat est négatif : afficher « Crédit de TVA » (sans le reporter automatiquement).

## Sécurité (RLS)

Politique identique sur toutes les tables privées :

```sql
CREATE POLICY org_isolation ON <table>
  FOR ALL USING (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
```

- `organization_requests` : INSERT public, SELECT/UPDATE via service role uniquement.
- Approbation d'une demande (création org + compte Auth + email des identifiants) : Edge Function avec service role.

## Stockage (Supabase Storage)

- Bucket `invoices` : pièces jointes des factures d'achat.
- Bucket `expense-receipts` : factures des dépenses.
- Bucket `logos` : logo de la société (page Profil), PNG/JPG.
- Chemin : `{organization_id}/{uuid}.{ext}` — politique Storage calquée sur la RLS (préfixe = org du JWT). Limite 10 Mo, types PDF/JPG/PNG.

## Ordre de création (migration initiale)

1. `organizations`, `organization_requests`
2. `suppliers`, `clients`, `expense_categories`
3. `purchase_invoices`, `attachements`, `attachement_deductions`, `expenses`
4. `accounting_payments`, `vat_credits`, `working_capital_history`
5. Politiques RLS + buckets Storage + Edge Function d'approbation
