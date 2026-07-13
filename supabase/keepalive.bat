@echo off
echo ---- %date% %time% ---- >> "%~dp0ping.log"
curl -sS --ssl-revoke-best-effort -X POST "https://asffddnjsipddojpgawx.supabase.co/rest/v1/rpc/ping" ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmZkZG5qc2lwZGRvanBnYXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDU4MTEsImV4cCI6MjA5OTE4MTgxMX0.E4KCJ9reb-VukldGuBD-YM_KoHodjKvonPzYh3mCF3g" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmZkZG5qc2lwZGRvanBnYXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDU4MTEsImV4cCI6MjA5OTE4MTgxMX0.E4KCJ9reb-VukldGuBD-YM_KoHodjKvonPzYh3mCF3g" ^
  -H "Content-Type: application/json" ^
  -w "HTTP=%%{http_code}\n" >> "%~dp0ping.log" 2>&1