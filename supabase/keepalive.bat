@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  Supabase keep-alive
REM  Chiama master.ping() N volte: ogni chiamata esegue un
REM  count(*) su tutte le tabelle dello schema master.
REM ============================================================

set "PROJ=asffddnjsipddojpgawx"
set "SCHEMA=master"
set "KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmZkZG5qc2lwZGRvanBnYXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDU4MTEsImV4cCI6MjA5OTE4MTgxMX0.E4KCJ9reb-VukldGuBD-YM_KoHodjKvonPzYh3mCF3g"

REM  Numero di chiamate per esecuzione
set "CALLS=5"
REM  Secondi di attesa tra le chiamate
set "GAP=3"

set "LOG=%~dp0ping.log"
set "URL=https://%PROJ%.supabase.co/rest/v1/rpc/ping"

echo ---- %date% %time% ---- >> "%LOG%"

for /l %%I in (1,1,%CALLS%) do (
  <nul set /p "=  [%%I/%CALLS%] " >> "%LOG%"
  curl -sS --ssl-revoke-best-effort -m 20 --retry 2 --retry-delay 3 ^
    -X POST "%URL%" ^
    -H "apikey: %KEY%" ^
    -H "Authorization: Bearer %KEY%" ^
    -H "Content-Profile: %SCHEMA%" ^
    -H "Content-Type: application/json" ^
    -w " HTTP=%%{http_code}" >> "%LOG%" 2>&1
  echo. >> "%LOG%"
  if %%I lss %CALLS% timeout /t %GAP% /nobreak >NUL
)

endlocal