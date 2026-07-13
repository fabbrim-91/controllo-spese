-- =============================================================
--  Note Spese — Pannello ACCESSI (admin gestisce l'allowlist)
--  Eseguire nell'SQL Editor DOPO auth-level1.sql.
--
--  Aggiunge:
--   - colonne is_admin / enabled sull'allowlist
--   - funzione is_admin()
--   - policy: solo un admin puo' leggere/gestire l'allowlist dalla app
--  is_allowed() ora richiede anche enabled = true (email disattivabili).
-- =============================================================

alter table master.allowed_emails add column if not exists is_admin boolean not null default false;
alter table master.allowed_emails add column if not exists enabled  boolean not null default true;

-- Un utente e' "ammesso" solo se presente E abilitato
create or replace function master.is_allowed()
returns boolean language sql stable security definer set search_path = master, public, pg_temp as $$
  select exists (
    select 1 from master.allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and enabled
  );
$$;

-- Un utente e' "admin" se abilitato e con is_admin = true
create or replace function master.is_admin()
returns boolean language sql stable security definer set search_path = master, public, pg_temp as $$
  select exists (
    select 1 from master.allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and enabled and is_admin
  );
$$;

-- Solo gli admin possono leggere/gestire l'allowlist direttamente dalla app.
-- (Gli altri utenti non vedono nemmeno una riga: la porta e' chiusa dalla RLS.)
drop policy if exists admin_manage_emails on master.allowed_emails;
create policy admin_manage_emails on master.allowed_emails
  for all to authenticated
  using (master.is_admin()) with check (master.is_admin());

grant select, insert, update, delete on master.allowed_emails to authenticated;
grant execute on function master.is_admin() to authenticated;

-- >>> IMPOSTA TE STESSO COME ADMIN (una volta sola, con la TUA email):
-- insert into master.allowed_emails (email, is_admin, enabled)
-- values ('tua@email.it', true, true)
-- on conflict (email) do update set is_admin = true, enabled = true;
