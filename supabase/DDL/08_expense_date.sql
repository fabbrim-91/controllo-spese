-- =============================================================
--  Note Spese — 08 Data della spesa modificabile
--  Aggiunge p_created_at (opzionale) a add_expense e update_expense.
--
--  NB: le vecchie firme a 5 parametri vengono eliminate prima di
--  ricreare le funzioni. Se restassero entrambe, una chiamata con
--  parametri nominati diventerebbe ambigua ("function is not unique").
-- =============================================================

drop function if exists master.add_expense(uuid, uuid, integer, text, uuid[]);
drop function if exists master.update_expense(uuid, uuid, integer, text, uuid[]);

-- ---------- add_expense (con data opzionale) ----------
create or replace function master.add_expense(
  p_group_id        uuid,
  p_payer_id        uuid,
  p_amount_cents    integer,
  p_description     text,
  p_participant_ids uuid[],
  p_created_at      timestamptz default null
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

  insert into master.expenses (group_id, payer_id, amount_cents, description, created_at)
  values (p_group_id, p_payer_id, p_amount_cents,
          coalesce(nullif(p_description, ''), 'Spesa'),
          coalesce(p_created_at, now()))
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

-- ---------- update_expense (con data opzionale) ----------
create or replace function master.update_expense(
  p_expense_id      uuid,
  p_payer_id        uuid,
  p_amount_cents    integer,
  p_description     text,
  p_participant_ids uuid[],
  p_created_at      timestamptz default null
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
         description  = coalesce(nullif(p_description, ''), 'Spesa'),
         created_at   = coalesce(p_created_at, created_at)
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

grant execute on function master.add_expense(uuid, uuid, integer, text, uuid[], timestamptz)    to authenticated;
grant execute on function master.update_expense(uuid, uuid, integer, text, uuid[], timestamptz) to authenticated;
