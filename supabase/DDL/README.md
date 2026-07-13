# Note Spese — Migrazioni database (Supabase / Postgres)

DDL del progetto, in ordine di applicazione. Su un progetto Supabase nuovo,
eseguile in sequenza nell'SQL Editor. Ricostruiscono l'intero schema `master`
(più la funzione di keep-alive in `public`).

## Ordine
| # | File | Cosa fa |
|---|------|---------|
| 01 | `01_schema.sql` | Schema `master`: tabelle (groups, members, expenses, expense_shares, settlements), trigger deferred che garantisce somma(quote)=totale, RPC `add_expense`, RLS temporanea permissiva + grant. |
| 02 | `02_auth_level1.sql` | Autenticazione Livello 1: tabella `allowed_emails`, funzione `is_allowed()`, policy per soli utenti autenticati in allowlist, revoca accessi all'anonimo. |
| 03 | `03_admin_panel.sql` | Colonne `is_admin`/`enabled`, funzione `is_admin()`, policy che consente la gestione dell'allowlist solo agli admin; `is_allowed()` ora richiede `enabled`. |
| 04 | `04_group_image.sql` | Colonna `image_url` su groups (foto del gruppo, salvata come data URL). |
| 05 | `05_edit_expense.sql` | RPC `update_expense`: modifica atomica di una spesa (aggiorna spesa + ricalcola quote, stesso id). |
| 06 | `06_keepalive_ping.sql` | Funzione `public.ping()` richiamabile da `anon`, usata dal keep-alive (.bat) per evitare la pausa del piano free. |

## Passi manuali NON inclusi nella DDL (da fare in dashboard/SQL una volta)
- **Esporre lo schema**: Settings → API → Exposed schemas → aggiungi `master`
  (lascia anche `public`, dove sta `ping`).
- **SMTP + template email**: configura un SMTP custom (es. Gmail) e nel template
  "Magic Link" usa `{{ .Token }}` per ricevere il codice a 6+ cifre.
- **Popolare l'allowlist e nominarti admin**:
  ```sql
  insert into master.allowed_emails (email, is_admin, enabled)
  values ('tua@email.it', true, true)
  on conflict (email) do update set is_admin = true, enabled = true;
  ```

## Note tecniche
- Importi sempre in centesimi interi (mai float).
- Le spese si scrivono SOLO via RPC (`add_expense` / `update_expense`): il trigger
  deferred rifiuta qualsiasi scrittura che lasci somma(quote) != totale.
- Progetto = un solo database (`postgres`); l'isolamento è dato dallo schema `master`.
