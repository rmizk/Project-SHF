-- Mot de passe provisoire en clair, visible du super admin tant que
-- l'utilisateur ne l'a pas remplacé (remise manuelle des identifiants,
-- Resend en mode test). Mis à NULL dès le premier changement de mot de
-- passe : on ne conserve jamais un mot de passe actif en clair.
alter table public.organizations
  add column if not exists temp_password text;
