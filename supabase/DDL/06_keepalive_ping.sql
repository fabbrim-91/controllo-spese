-- =============================================================
--  Note Spese — Keep-alive ping (piano free Supabase)
--  Funzione pubblica, richiamabile dal ruolo anon, che esegue una
--  query banale: serve solo a "toccare" il database periodicamente
--  (via .bat + Task Scheduler) per evitare la pausa dopo 7 giorni.
--  Sta in schema public (non master): non tocca alcun dato.
-- =============================================================
create or replace function public.ping() returns text
  language sql as $$ select 'ok'::text $$;

grant usage   on schema public to anon;
grant execute on function public.ping() to anon;
