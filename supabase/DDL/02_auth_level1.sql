-- =============================================================
--  Note Spese — AUTENTICAZIONE Livello 1 ("cancello di casa")
--  Eseguire nell'SQL Editor DOPO schema-master.sql.
--
--  Effetto: solo le email in allowlist, dopo login, leggono/scrivono.
--  Gli anonimi (chiunque col solo link) non accedono a nulla.
-- =============================================================

-- 1) Allowlist delle email ammesse ----------------------------
create table if not exists master.allowed_emails (
  email text primary key
);
-- Accesso diretto negato: si legge solo tramite la funzione qui sotto.
alter table master.allowed_emails enable row level security;

-- >>> INSERISCI QUI LE VOSTRE EMAIL (minuscolo consigliato):
-- insert into master.allowed_emails(email) values
--   ('tua@email.it'),
--   ('familiare1@email.it'),
--   ('familiare2@email.it')
-- on conflict do nothing;

-- 2) Helper: l'utente loggato e' in allowlist? ----------------
--    security definer: legge allowed_emails aggirando la sua RLS.
create or replace function master.is_allowed()
returns boolean
language sql stable security definer set search_path = master, public, pg_temp as $$
  select exists (
    select 1 from master.allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 3) Policy: via l'accesso anonimo, dentro solo authenticated in allowlist
do $$
declare
  t text;
  tbls text[] := array['groups','members','expenses','expense_shares','settlements'];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists anon_all_%1$s on master.%1$I;', t);
    execute format('drop policy if exists allow_%1$s on master.%1$I;', t);
    execute format($f$
      create policy allow_%1$s on master.%1$I
        for all to authenticated
        using (master.is_allowed()) with check (master.is_allowed());
    $f$, t);
  end loop;
end $$;

-- 4) Permessi: togli tutto all'anonimo, tieni gli autenticati --
revoke all privileges on all tables    in schema master from anon;
revoke all privileges on all functions in schema master from anon;
revoke usage on schema master from anon;
alter default privileges in schema master revoke all on tables   from anon;
alter default privileges in schema master revoke all on routines from anon;

grant usage on schema master to authenticated;
grant select, insert, update, delete on all tables    in schema master to authenticated;
grant execute                        on all functions in schema master to authenticated;
grant execute on function master.is_allowed() to authenticated;
