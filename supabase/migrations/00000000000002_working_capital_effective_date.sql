-- Fond de roulement : date d'effet saisie par l'utilisateur dans le modal
-- « + Ajouter » (les lignes existantes héritent de leur date de création).

alter table public.working_capital_history
  add column if not exists effective_date date;

update public.working_capital_history
  set effective_date = created_at::date
  where effective_date is null;

alter table public.working_capital_history
  alter column effective_date set default current_date;

alter table public.working_capital_history
  alter column effective_date set not null;

drop index if exists public.working_capital_history_org_created_idx;
create index if not exists working_capital_history_org_effective_idx
  on public.working_capital_history (organization_id, effective_date desc, created_at desc);
