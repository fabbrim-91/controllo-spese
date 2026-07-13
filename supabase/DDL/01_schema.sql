-- =============================================================
--  Note Spese — schema Supabase  (FASE SENZA AUTH)
--  Tutto dentro lo schema dedicato "master" (non "public").
--
--  DOPO aver eseguito questo script:
--   Dashboard -> Settings/Integrations -> Data API -> Exposed schemas
--   -> aggiungi "master" -> Save   (altrimenti errore PGRST106)
-- =============================================================

create schema if not exists master;

-- ------------------------------------------------------------
-- 1) TABELLE
-- ------------------------------------------------------------
create table master.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table master.members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references master.groups(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table master.expenses (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references master.groups(id) on delete cascade,
  payer_id     uuid not null references master.members(id),
  amount_cents integer not null check (amount_cents > 0),
  description  text not null default 'Spesa',
  created_at   timestamptz not null default now()
);

create table master.expense_shares (
  expense_id  uuid not null references master.expenses(id) on delete cascade,
  member_id   uuid not null references master.members(id),
  share_cents integer not null check (share_cents >= 0),
  primary key (expense_id, member_id)
);

create table master.settlements (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references master.groups(id) on delete cascade,
  from_member  uuid not null references master.members(id),
  to_member    uuid not null references master.members(id),
  amount_cents integer not null check (amount_cents > 0),
  created_at   timestamptz not null default now()
);

create index on master.members       (group_id);
create index on master.expenses       (group_id);
create index on master.expense_shares (expense_id);
create index on master.settlements    (group_id);

-- ------------------------------------------------------------
-- 2) INVARIANTE: somma(quote) = totale, per OGNI spesa
--    Trigger DEFERRABLE: verifica a fine transazione.
-- ------------------------------------------------------------
create or replace function master.enforce_share_sum()
returns trigger language plpgsql as $$
declare
  eid uuid := coalesce(new.expense_id, old.expense_id);
  amt integer;
  s   integer;
begin
  select amount_cents into amt from master.expenses where id = eid;
  if not found then return null; end if;
  select coalesce(sum(share_cents), 0) into s
    from master.expense_shares where expense_id = eid;
  if s <> amt then
    raise exception 'Somma quote (%) diversa dal totale (%) per la spesa %', s, amt, eid;
  end if;
  return null;
end $$;

create or replace function master.enforce_expense_total()
returns trigger language plpgsql as $$
declare
  s integer;
begin
  select coalesce(sum(share_cents), 0) into s
    from master.expense_shares where expense_id = new.id;
  if s <> new.amount_cents then
    raise exception 'Somma quote (%) diversa dal totale (%) per la spesa %', s, new.amount_cents, new.id;
  end if;
  return null;
end $$;

create constraint trigger trg_shares_sum
  after insert or update or delete on master.expense_shares
  deferrable initially deferred
  for each row execute function master.enforce_share_sum();

create constraint trigger trg_expense_total
  after insert or update on master.expenses
  deferrable initially deferred
  for each row execute function master.enforce_expense_total();

-- ------------------------------------------------------------
-- 3) RPC: aggiungi spesa con split equo, ATOMICO.
-- ------------------------------------------------------------
create or replace function master.add_expense(
  p_group_id        uuid,
  p_payer_id        uuid,
  p_amount_cents    integer,
  p_description     text,
  p_participant_ids uuid[]
) returns uuid language plpgsql as $$
declare
  v_expense_id uuid;
  n    integer := array_length(p_participant_ids, 1);
  base integer;
  rem  integer;
  i    integer;
begin
  if n is null or n = 0 then raise exception 'Nessun partecipante'; end if;
  if p_amount_cents <= 0 then raise exception 'Importo non valido'; end if;

  insert into master.expenses (group_id, payer_id, amount_cents, description)
  values (p_group_id, p_payer_id, p_amount_cents,
          coalesce(nullif(p_description, ''), 'Spesa'))
  returning id into v_expense_id;

  base := p_amount_cents / n;
  rem  := p_amount_cents - base * n;

  for i in 1 .. n loop
    insert into master.expense_shares (expense_id, member_id, share_cents)
    values (v_expense_id, p_participant_ids[i],
            base + case when i <= rem then 1 else 0 end);
  end loop;

  return v_expense_id;
end $$;

-- ------------------------------------------------------------
-- 4) SICUREZZA — FASE SENZA AUTH (TEMPORANEA!)
--    RLS attiva + policy "tutto permesso" per anon.
--    Chiunque conosca l'URL puo' leggere/scrivere: solo per test.
-- ------------------------------------------------------------
alter table master.groups         enable row level security;
alter table master.members        enable row level security;
alter table master.expenses       enable row level security;
alter table master.expense_shares enable row level security;
alter table master.settlements    enable row level security;

do $$
declare
  t text;
  tbls text[] := array['groups','members','expenses','expense_shares','settlements'];
begin
  foreach t in array tbls loop
    execute format(
      'create policy anon_all_%1$s on master.%1$I for all to anon using (true) with check (true);', t);
  end loop;
end $$;

-- Grant espliciti sullo schema custom (Data API).
grant usage on schema master to anon, authenticated, service_role;
grant select, insert, update, delete on all tables    in schema master to anon, authenticated, service_role;
grant execute                        on all functions in schema master to anon, authenticated, service_role;

-- Default privileges: gli oggetti futuri ereditano i grant.
alter default privileges in schema master
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema master
  grant execute on routines to anon, authenticated, service_role;
