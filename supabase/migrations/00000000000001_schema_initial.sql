-- ============================================================
-- Migration initiale — Comptéo
-- Schéma complet : tables, contraintes, index, RLS, Storage
-- Aligné sur docs/modele-donnees.md (v1.0)
-- ============================================================

-- ------------------------------------------------------------
-- Fonction utilitaire : organization_id extrait du JWT
-- ------------------------------------------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'organization_id', '')::uuid
$$;

-- ------------------------------------------------------------
-- 1. organizations / organization_requests
-- ------------------------------------------------------------
create table public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  org_code             text unique not null,
  name                 text not null,
  tax_id               text not null,
  email                text,
  phone                text,
  logo_path            text,
  auth_user_id         uuid unique not null references auth.users (id),
  must_change_password boolean not null default true,
  created_at           timestamptz not null default now()
);

create table public.organization_requests (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null,
  tax_id       text not null,
  email        text not null,
  phone        text,
  status       text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  processed_at timestamptz
);

-- ------------------------------------------------------------
-- 2. suppliers / clients / expense_categories
-- ------------------------------------------------------------
create table public.suppliers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name            text not null,
  unique (organization_id, name)
);

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name            text not null,
  unique (organization_id, name)
);

create table public.expense_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name            text not null,
  unique (organization_id, name)
);

-- ------------------------------------------------------------
-- 3. purchase_invoices / attachements / attachement_deductions / expenses
-- ------------------------------------------------------------
create table public.purchase_invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  supplier_id     uuid not null references public.suppliers (id),
  invoice_number  text not null,
  invoice_date    date not null,
  amount_ht       numeric(14,3) not null check (amount_ht >= 0),
  vat_rate        numeric(4,2) not null check (vat_rate in (0, 7, 13, 19)),
  amount_ttc      numeric(14,3) generated always as
                  (round(amount_ht * (1 + vat_rate / 100), 3)) stored,
  attachment_path text,
  created_at      timestamptz not null default now(),
  unique (organization_id, supplier_id, invoice_number)
);

create index purchase_invoices_org_date_idx
  on public.purchase_invoices (organization_id, invoice_date);

create table public.attachements (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id),
  client_id         uuid not null references public.clients (id),
  amount_ht         numeric(14,3) not null check (amount_ht >= 0),
  vat_rate          numeric(4,2) not null check (vat_rate in (0, 7, 13, 19)),
  attachement_date  date not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'paid')),
  paid_at           date,
  net_profit        numeric(14,3),
  created_at        timestamptz not null default now()
);

create index attachements_org_date_idx
  on public.attachements (organization_id, attachement_date);

create table public.attachement_deductions (
  id             uuid primary key default gen_random_uuid(),
  attachement_id uuid not null references public.attachements (id) on delete cascade,
  label          text not null,
  amount         numeric(14,3) not null check (amount >= 0)
);

create index attachement_deductions_attachement_idx
  on public.attachement_deductions (attachement_id);

create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  type            text not null
                  check (type in ('with_invoice', 'without_invoice', 'personal')),
  category_id     uuid not null references public.expense_categories (id),
  name            text not null,
  amount          numeric(14,3) not null check (amount >= 0),
  expense_date    date not null,
  attachment_path text,
  created_at      timestamptz not null default now(),
  -- Pièce jointe obligatoire uniquement pour les dépenses « avec facture »
  check (type <> 'with_invoice' or attachment_path is not null)
);

create index expenses_org_date_idx
  on public.expenses (organization_id, expense_date);

-- ------------------------------------------------------------
-- 4. accounting_payments / vat_credits / working_capital_history
-- ------------------------------------------------------------
create table public.accounting_payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  type            text not null
                  check (type in ('tva', 'accountant_fees', 'qabadha', 'cnss', 'site_insurance')),
  amount          numeric(14,3) not null check (amount >= 0),
  payment_date    date not null,
  status          text not null default 'to_pay'
                  check (status in ('to_pay', 'paid')),
  note            text,
  created_at      timestamptz not null default now()
);

create index accounting_payments_org_date_idx
  on public.accounting_payments (organization_id, payment_date);

create table public.vat_credits (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  period          date not null check (extract(day from period) = 1),
  amount          numeric(14,3) not null check (amount >= 0),
  unique (organization_id, period)
);

create table public.working_capital_history (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  amount          numeric(14,3) not null,
  note            text,
  created_at      timestamptz not null default now()
);

create index working_capital_history_org_created_idx
  on public.working_capital_history (organization_id, created_at desc);

-- ------------------------------------------------------------
-- 5. RLS — isolation par organisation
-- ------------------------------------------------------------
alter table public.organizations            enable row level security;
alter table public.organization_requests    enable row level security;
alter table public.suppliers                enable row level security;
alter table public.clients                  enable row level security;
alter table public.expense_categories       enable row level security;
alter table public.purchase_invoices        enable row level security;
alter table public.attachements             enable row level security;
alter table public.attachement_deductions   enable row level security;
alter table public.expenses                 enable row level security;
alter table public.accounting_payments      enable row level security;
alter table public.vat_credits              enable row level security;
alter table public.working_capital_history  enable row level security;

-- organizations : l'organisation ne voit et ne modifie que sa propre ligne
create policy org_select on public.organizations
  for select to authenticated
  using (id = public.current_organization_id());

create policy org_update on public.organizations
  for update to authenticated
  using (id = public.current_organization_id())
  with check (id = public.current_organization_id());

-- organization_requests : insertion publique (formulaire), lecture/gestion via service role uniquement
create policy org_requests_public_insert on public.organization_requests
  for insert to anon, authenticated
  with check (true);

-- Tables privées : politique identique
create policy org_isolation on public.suppliers
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.clients
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.expense_categories
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.purchase_invoices
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.attachements
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- attachement_deductions : isolation via l'attachement parent
create policy org_isolation on public.attachement_deductions
  for all to authenticated
  using (exists (
    select 1 from public.attachements a
    where a.id = attachement_id
      and a.organization_id = public.current_organization_id()
  ))
  with check (exists (
    select 1 from public.attachements a
    where a.id = attachement_id
      and a.organization_id = public.current_organization_id()
  ));

create policy org_isolation on public.expenses
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.accounting_payments
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.vat_credits
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy org_isolation on public.working_capital_history
  for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- ------------------------------------------------------------
-- 6. Storage : buckets + politiques (préfixe = organization_id du JWT)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invoices',         'invoices',         false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('expense-receipts', 'expense-receipts', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('logos',            'logos',            false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy storage_org_isolation_select on storage.objects
  for select to authenticated
  using (
    bucket_id in ('invoices', 'expense-receipts', 'logos')
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

create policy storage_org_isolation_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('invoices', 'expense-receipts', 'logos')
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

create policy storage_org_isolation_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('invoices', 'expense-receipts', 'logos')
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );

create policy storage_org_isolation_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('invoices', 'expense-receipts', 'logos')
    and (storage.foldername(name))[1] = public.current_organization_id()::text
  );
