# Supabase — PRIMA SECOND HOME

Samostatný projekt pre hostí (NIE ten istý ako PRIMA RE SERVICE ani PRIMA TOOLS — anonymná
autentifikácia hostí nesmie zdieľať databázu so zamestnaneckými dátami).

- `migrations/` — jediný zdroj zmien schémy (`npx supabase db push`), časová pečiatka v UTC,
  migrácie idempotentné — rovnaká konvencia ako v `prima-udrzba`.
- `functions/guest-request-bridge/` — edge funkcia: hlásenie hosťa → ticket v PRIMA RE SERVICE.
  Secrets: `RE_SERVICE_URL`, `RE_SERVICE_SERVICE_KEY` (service_role RE SERVICE projektu, nikdy v klientovi).

Stav: **návrh (v1.1)** — schéma je pripravená, ešte nebola nasadená na žiadny projekt.
Postup napojenia appky je v `docs/INTEGRATION.md`.
