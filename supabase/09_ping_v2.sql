-- =============================================================
--  Note Spese — 09 Heartbeat (keep-alive con scrittura reale)
--  ping() ora fa INSERT + DELETE su una tabella dedicata, invece
--  di un semplice select costante. Stessa firma: il .bat non cambia.
--
--  - La tabella è invisibile all'app e chiusa a tutti i ruoli:
--    si scrive SOLO tramite ping() (security definer).
--  - Tiene 30 giorni di storico: serve anche da log diagnostico
--    per vedere se e quando i ping arrivano davvero.
-- =============================================================

create table if not exists public.heartbeat (
  id     bigint generated always as identity primary key,
  ts     timestamptz not null default now(),
  source text not null default 'ping'
);

alter table public.heartbeat enable row level security;   -- nessuna policy = nessun accesso diretto
revoke all on public.heartbeat from anon, authenticated;

create or replace function public.ping()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  n7 integer;
begin
  insert into public.heartbeat (source) values ('ping');
  delete from public.heartbeat where ts < now() - interval '30 days';
  select count(*) into n7 from public.heartbeat where ts > now() - interval '7 days';
  return 'ok ' || n7;   -- es. "ok 42" = ping ricevuti negli ultimi 7 giorni
end
$fn$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon;