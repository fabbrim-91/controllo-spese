-- =============================================================
--  Note Spese — 07 Bootstrap (performance)
--  Una sola RPC che restituisce permessi + tutti i dati annidati,
--  al posto di 7 round trip separati. Riduce drasticamente il
--  tempo di apertura della app.
--  security invoker (default): la RLS resta applicata.
-- =============================================================
create or replace function master.bootstrap()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'is_allowed', master.is_allowed(),
    'is_admin',   master.is_admin(),
    'groups', coalesce((
      select jsonb_agg(gr order by gr.created_at desc)
      from (
        select
          g.id, g.name, g.image_url, g.created_at,
          coalesce((
            select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name) order by m.created_at)
            from master.members m where m.group_id = g.id
          ), '[]'::jsonb) as members,
          coalesce((
            select jsonb_agg(jsonb_build_object(
                     'id', e.id,
                     'payer_id', e.payer_id,
                     'amount_cents', e.amount_cents,
                     'description', e.description,
                     'created_at', e.created_at,
                     'splits', coalesce((
                       select jsonb_agg(jsonb_build_object('member_id', s.member_id, 'share_cents', s.share_cents))
                       from master.expense_shares s where s.expense_id = e.id
                     ), '[]'::jsonb)
                   ) order by e.created_at desc)
            from master.expenses e where e.group_id = g.id
          ), '[]'::jsonb) as expenses,
          coalesce((
            select jsonb_agg(jsonb_build_object(
                     'id', st.id,
                     'from_member', st.from_member,
                     'to_member', st.to_member,
                     'amount_cents', st.amount_cents,
                     'created_at', st.created_at
                   ) order by st.created_at desc)
            from master.settlements st where st.group_id = g.id
          ), '[]'::jsonb) as settlements
        from master.groups g
      ) gr
    ), '[]'::jsonb)
  );
$$;

grant execute on function master.bootstrap() to authenticated;
