# Note Spese

App per dividere le spese di gruppo — nello spirito di Splitwise — costruita come
**PWA** leggera su backend **Supabase**. Crei gruppi, aggiungi spese, e l'app calcola
chi deve dare quanto a chi, semplificando i rimborsi al minor numero di transazioni.

Pensata per uso reale tra famiglia e amici: installabile su iOS/Android, dati condivisi
tra dispositivi, accesso riservato tramite codice via email.

---

## Funzionalità

- Gruppi con foto, membri gestibili, rinomina ed eliminazione
- Spese con split equo (resto ai centesimi gestito), scelta del pagante e dei partecipanti
- Modifica e cancellazione delle spese
- Bilanci per persona (a credito / a debito), sempre a somma zero
- Semplificazione dei debiti: "chi salda chi" in poche transazioni
- Rimborsi ("Salda") tracciati nella lista movimenti e annullabili
- Login senza password tramite **codice numerico** via email (magic link OTP)
- **Pannello accessi** riservato all'admin: abilita/disabilita/rimuovi email
- Installabile come app (PWA), funziona offline (riserva), refresh e pull-to-refresh

---

## Stack

| Livello | Tecnologia |
|--------|------------|
| Frontend | PWA in JavaScript vanilla (nessun build step) |
| Backend | Supabase (Postgres + Auth + API REST auto-generata) |
| Hosting | Netlify (static hosting, HTTPS) |
| Auth | Supabase Auth, OTP via email (SMTP custom) |
| Keep-alive | Script `.bat` + Windows Task Scheduler → RPC `public.ping()` |

Nessun framework, nessun bundler: l'app è servita così com'è. La libreria `supabase-js`
è caricata da CDN.

---

## Architettura in breve

```
┌─────────────┐     HTTPS      ┌──────────────┐     API REST     ┌──────────────┐
│  Browser /  │ ─────────────► │   Netlify    │                  │   Supabase   │
│  PWA (app)  │   (file        │  (static     │                  │  Postgres +  │
│             │    statici)    │   hosting)   │                  │  Auth + API  │
└─────────────┘                └──────────────┘                  └──────────────┘
       │                                                                  ▲
       └──────────────  API REST + Auth (chiave anon pubblica)  ──────────┘
```

Non esiste un server applicativo custom: la PWA parla **direttamente** con l'API di
Supabase dal browser. La protezione dei dati non è nel nascondere la chiave (pubblica per
disegno), ma nelle **policy RLS** lato database.

---

## Struttura del repository

```
.
├── README.md                 ← questo file
├── web/                      ← la PWA (contenuto da pubblicare su Netlify)
│   ├── index.html
│   ├── app.js                ← logica: store (Supabase), UI, bilanci, semplificazione
│   ├── styles.css
│   ├── sw.js                 ← service worker (strategia network-first)
│   ├── manifest.json
│   └── icons/
├── supabase-migrations/      ← DDL del database, in ordine di applicazione
│   ├── 01_schema.sql
│   ├── 02_auth_level1.sql
│   ├── 03_admin_panel.sql
│   ├── 04_group_image.sql
│   ├── 05_edit_expense.sql
│   ├── 06_keepalive_ping.sql
│   └── README.md
└── keepalive/
    └── ping.bat              ← keep-alive per il piano free (Task Scheduler)
```

> La struttura è una proposta: adattala pure. L'importante è tenere separati frontend,
> migrazioni DB e utility.

---

## Setup da zero

### 1. Database (Supabase)
1. Crea un progetto Supabase (regione consigliata: **EU / Frankfurt**).
2. Nell'**SQL Editor** esegui le migrazioni in `supabase-migrations/` **in ordine**
   (`01` → `06`).
3. **Esponi lo schema**: Settings → API → *Exposed schemas* → aggiungi `master`
   (lascia anche `public`).
4. **Email**: configura un **SMTP custom** (es. Gmail con app password) e nel template
   *Magic Link* usa `{{ .Token }}` per inviare il codice.
5. **Nominati admin** e popola l'allowlist:
   ```sql
   insert into master.allowed_emails (email, is_admin, enabled)
   values ('tua@email.it', true, true)
   on conflict (email) do update set is_admin = true, enabled = true;
   ```

### 2. Frontend
1. In `web/app.js` imposta `SUPABASE_URL` e `SUPABASE_ANON_KEY` del tuo progetto
   (la chiave *anon* è pubblica: è corretto che stia nel client).
2. Pubblica la cartella `web/` su Netlify (drag-and-drop o collegando il repo).
3. Su iOS: apri il sito in Safari → Condividi → *Aggiungi a Home* (rende la sessione
   persistente a lungo termine).

### 3. Keep-alive (opzionale, piano free)
Il progetto Supabase free va in pausa dopo 7 giorni di inattività. Per evitarlo, pianifica
`keepalive/ping.bat` con l'Utilità di pianificazione di Windows (una volta al giorno).
Vedi commenti nello script.

---

## Sviluppo locale

Servi la cartella `web/` con un server statico (il service worker richiede `http`, non
`file://`):

```bash
cd web
python3 -m http.server 8080
# apri http://localhost:8080
```

Il service worker è in **network-first**: online scarichi sempre l'ultima versione, la
cache resta solo da riserva offline. In sviluppo, per un test pulito, usa una finestra in
incognito (niente cache tra sessioni).

---

## Modello dati

Schema `master`, cinque tabelle:

| Tabella | Ruolo |
|--------|-------|
| `groups` | gruppi (con `image_url` per la foto) |
| `members` | persone di un gruppo (nomi, non account) |
| `expenses` | spese (evento immutabile) |
| `expense_shares` | quote di una spesa per membro |
| `settlements` | rimborsi registrati |

Più `allowed_emails` (allowlist accessi) e le funzioni `add_expense`, `update_expense`,
`is_allowed`, `is_admin`, `ping`.

### Decisioni tecniche chiave
- **Modello a ledger**: i bilanci non sono salvati, si calcolano da spese e rimborsi.
  Verificabile, audit-friendly, ricostruibile.
- **Importi in centesimi interi**, mai float. Lo split distribuisce il resto in modo
  deterministico: `somma(quote) = totale`.
- **Invariante a livello DB**: un trigger deferred rifiuta qualunque scrittura che lasci
  `somma(quote) ≠ totale`. Le spese si scrivono **solo** via RPC atomiche
  (`add_expense` / `update_expense`), spesa e quote nella stessa transazione.
- **Semplificazione debiti**: greedy max-debitore ↔ max-creditore → al più `n-1`
  transazioni.

---

## Sicurezza

- **Livello 1 (attuale)**: accesso a invito. Solo le email in `allowed_emails` (abilitate)
  possono entrare; tutti gli ammessi condividono lo stesso spazio. La RLS impone ruolo
  `authenticated` + email in allowlist; l'anonimo non ha accesso ai dati.
- **Admin**: un flag `is_admin` (impostato solo via SQL) sblocca il pannello accessi.
  L'invariante "l'admin decide chi entra" è imposta dalla RLS, non dall'interfaccia.
- **Chiave anon**: pubblica per disegno; da sola non concede accesso ai dati.
- **Livello 2 (futuro)**: isolamento per gruppo (ognuno vede solo i propri) — non ancora
  implementato.

---

## Limiti noti / possibili sviluppi

- Split solo equo (no quote esatte o percentuali)
- Nessun realtime: refresh manuale o pull-to-refresh (i dati non compaiono da soli)
- Foto salvate come data URL nel DB (semplice; per volumi alti → Supabase Storage)
- Piano free Supabase: pausa dopo 7 giorni di inattività (mitigata dal keep-alive)
- Modello a spazio condiviso unico (Livello 1)

---

## Licenza

Progetto personale. Aggiungi qui la licenza che preferisci (es. MIT) se lo rendi pubblico.
