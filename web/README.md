# Note Spese — versione online CON autenticazione (Livello 1)

Ora si entra solo con login (magic link via email) e accedono solo le email in
allowlist. Chi apre il link senza login vede la schermata di accesso; un'email
non ammessa vede "non autorizzata". Tutte le funzioni (menù long-press, gestione
membri, rinomina/rimozione gruppo, foto) restano invariate.

## Setup Supabase (una volta)
1. **Migrazione**: SQL Editor -> incolla `auth-level1.sql`. Prima di eseguire,
   scrivi le vostre email nell'INSERT su `master.allowed_emails` (minuscolo).
   Aggiungerne dopo: `insert into master.allowed_emails(email) values ('x@y.it');`
2. **URL di ritorno** (fondamentale): Authentication -> URL Configuration ->
   con il login a CODICE non serve configurare URL di ritorno (non c'e' link).
3. (Email provider e magic link sono attivi di default.)

## "Logga una volta e resta dentro"
La sessione è persistente e si rinnova da sola: dopo il primo accesso non viene
più chiesto il login. **Su iPhone**, per far durare a lungo la sessione, aggiungi
la PWA alla Home (Safari -> Condividi -> Aggiungi a Home): un'app installata non
subisce la cancellazione dello storage dopo 7 giorni che avviene in Safari.
Il pulsante ⏻ in alto fa logout manuale.

## Deploy
Ricarica la cartella su Netlify. Cache service worker a v6.

## Nota di sicurezza
La chiave anon nel codice non concede piu' accesso ai dati da sola: dopo la
migrazione i dati sono leggibili/scrivibili solo da utenti autenticati e in
allowlist (RLS). L'anonimo riceve "permission denied".

## Rimborsi visibili nella lista (novita')
I "Salda" ora compaiono nella lista movimenti in stile attenuato, es.
"Bruno ha saldato Anna". Tieni premuto un rimborso per eliminarlo: utile per
annullare un "Salda" fatto per sbaglio (era il caso dei saldi residui dopo aver
cancellato le spese).


## Login con CODICE numerico (non link)
La app ora chiede un codice a 6 cifre, non un link: niente redirect, niente
rimbalzo tra mail e browser. Per farlo funzionare, imposta il template email:
Authentication -> Email Templates -> "Magic Link" -> nel corpo usa il token:

    <p>Codice di accesso:</p>
    <p style="font-size:26px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>

Salva. Da quel momento l'email conterra' il codice invece del link.
(Il vecchio problema del redirect a localhost:3000 non si presenta piu': con il
codice non c'e' alcun URL di ritorno da configurare.)


## Pannello ACCESSI (solo admin)
Se la tua email e' admin, in home compare l'icona 👥: apre "Gestione accessi",
dove aggiungi email, le disattivi/riattivi (senza cancellarle) o le rimuovi.
Sul tuo indirizzo non compaiono toggle/rimozione, per non bloccarti fuori.

Setup (una volta): esegui `admin-panel.sql` nell'SQL Editor, poi nominati admin:

    insert into master.allowed_emails (email, is_admin, enabled)
    values ('tua@email.it', true, true)
    on conflict (email) do update set is_admin = true, enabled = true;

La sicurezza e' sul database (RLS): solo un admin puo' leggere/gestire la lista;
gli altri utenti non vedono nemmeno il pulsante e comunque l'API li rifiuta.


## Modifica spesa + refresh nel gruppo
- Dentro un gruppo: pulsante ↻ nell'header, oppure trascina in basso (pull-to-refresh)
  per ricaricare i conti.
- Tieni premuto una spesa -> "Modifica spesa": si riapre pre-compilata; salvando,
  la spesa viene aggiornata mantenendo id e data (non salta in cima).

## MIGRAZIONE per la modifica spesa
Esegui una volta nell'SQL Editor: `edit-expense.sql` (aggiunge la RPC
`update_expense`, che aggiorna spesa e quote in un'unica transazione).


## Aggiornamento: performance, Totali, data spesa
**Apertura più rapida.** Il caricamento usa una sola RPC (`bootstrap`) invece di 7
round trip, e l'ultimo stato viene tenuto in cache locale: alla riapertura la app
compare subito e si aggiorna in background (indicatore "Aggiorno…").
`index.html` usa `preconnect` + `defer` per non bloccare il rendering.

**Scheda Totali.** Dentro un gruppo, accanto a "Bilanci" c'è "Totali": per ogni
membro quanto ha anticipato ("Ha pagato") e quanto gli è costato ("Sua quota"),
più il totale delle spese del gruppo. I rimborsi non sono conteggiati: sono giri
di denaro, non spesa nuova.

**Data della spesa.** Nel pannello spesa c'è il campo Data (pre-compilato a oggi
per le nuove, con la data reale in modifica). Utile per inserire spese in ritardo.

### Migrazioni richieste
Esegui `07_bootstrap.sql` e `08_expense_date.sql`. La 08 elimina e ricrea
`add_expense`/`update_expense` con il parametro data: va applicata dopo la 05.
