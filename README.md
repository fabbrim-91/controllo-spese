# Note Spese — versione Supabase (dati condivisi)

Ora i dati vivono su Supabase (schema `master`), non più solo nel browser:
**tutti i dispositivi vedono gli stessi gruppi e spese**.

## Prerequisiti (già fatti)
- Schema `master` creato con `schema-master.sql`
- `master` aggiunto in **Settings → API → Exposed schemas**

URL progetto e chiave `anon` (pubblica) sono già dentro `app.js`.

## Avvio in locale
```bash
python3 -m http.server 8080
```
Apri `http://localhost:8080`. Il primo caricamento mostra "Carico i dati…",
poi la home. Il pulsante ↻ in alto forza un aggiornamento.

## Test multi-dispositivo
Servi la cartella (come sopra), poi apri la app da due dispositivi sulla stessa
rete (`http://<ip-del-pc>:8080`): crea un gruppo su uno, premi ↻ sull'altro →
compare. Per l'uso vero fuori casa serve pubblicarla su un hosting statico
(Cloudflare Pages / Netlify): a quel punto ognuno la usa dal proprio telefono.

## Se vedi l'errore "PGRST106 / schema must be one of..."
Manca il passo dell'esposizione: Settings → API → Exposed schemas → aggiungi
`master` → Save.

## Nota di sicurezza (fase senza auth)
La RLS è "tutto permesso": chiunque abbia l'URL del progetto + la chiave anon
può leggere e scrivere. Va bene per il test in famiglia, **non** per dati
sensibili. La chiusura arriva con la fase auth (magic link) + RLS per-utente.

## Cos'è cambiato dal codice locale
Solo il modulo `store` in `app.js`: prima parlava con `localStorage`, ora con
Supabase (select per la lettura, RPC `add_expense` per le spese, insert/delete
per il resto). Rendering, bilanci e semplificazione debiti sono identici.
Le spese si scrivono solo via RPC `add_expense` (spesa + quote in un'unica
transazione: l'invariante somma-quote = totale resta garantita).
```
"# controllo-spese" 
