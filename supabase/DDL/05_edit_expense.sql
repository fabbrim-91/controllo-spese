-- =============================================================
--  Note Spese — Modifica spesa (RPC atomica)
--  Eseguire nell'SQL Editor DOPO gli altri script.
--
--  Aggiorna la spesa e RICALCOLA le quote in un'unica transazione,
--  mantenendo lo stesso id e la stessa data. L'invariante
--  somma(quote) = totale resta garantita dal trigger deferred.
-- =============================================================
create or replace function master.update_expense(
  p_expense_id      uuid,
  p_payer_id        uuid,
  p_amount_cents    integer,
  p_description     text,
  p_participant_ids uuid[]
) returns void language plpgsql as $$
declare
  n    integer := array_length(p_participant_ids, 1);
  base integer;
  rem  integer;
  i    integer;
begin
  if n is null or n = 0 then raise exception 'Nessun partecipante'; end if;
  if p_amount_cents <= 0 then raise exception 'Importo non valido'; end if;

  update master.expenses
     set payer_id     = p_payer_id,
         amount_cents = p_amount_cents,
         description  = coalesce(nullif(p_description, ''), 'Spesa')
   where id = p_expense_id;

  if not found then raise exception 'Spesa inesistente'; end if;

  delete from master.expense_shares where expense_id = p_expense_id;

  base := p_amount_cents / n;
  rem  := p_amount_cents - base * n;
  for i in 1 .. n loop
    insert into master.expense_shares (expense_id, member_id, share_cents)
    values (p_expense_id, p_participant_ids[i], base + case when i <= rem then 1 else 0 end);
  end loop;
end $$;

grant execute on function master.update_expense(uuid, uuid, integer, text, uuid[]) to authenticated;
