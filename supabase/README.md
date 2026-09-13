# Supabase — PRIMA SECOND HOME

Samostatný projekt pre hostí (NIE ten istý ako PRIMA RE SERVICE ani PRIMA TOOLS — anonymná
autentifikácia hostí nesmie zdieľať databázu so zamestnaneckými dátami).

```
migrations/     jediný zdroj zmien schémy (`supabase db push`), UTC pečiatka, idempotentné
  20260906120000_guest_schema.sql   základ: prevádzky, pobyty, kódy, väzby, žiadosti, oznamy, RLS
  20260914090000_guest_v1_1.sql     v1.1: práčovňa, povolenia, podpisy, identita, správy, limity, office kódy, čistenie, storage
  20260914120000_office_cleaning_forget.sql  v1.2: office používatelia a politiky, upratovanie z RE SERVICE, guest_forget_me
functions/      edge funkcie (Deno, bez externých balíkov) — `supabase functions deploy`
  _shared/      env, http (webhook secret), supa (service REST), deepl, ticket-bridge, push-texts, guest-push, webpush
  guest-request-bridge   INSERT guest_requests → ticket + notifikácia v RE SERVICE
  sync-ticket-status     cron: stav ticketu → stav žiadosti + push
  sync-cleaning          cron: plán upratovania RE SERVICE → next/last cleaning, stav izby
  send-push              INSERT guest_announcements → push hosťom budovy; INSERT guest_messages → preklad + push; cielené push
  sign-rules             INSERT guest_signatures → PDF (Cloudflare Browser Rendering) → guest-docs → e-mail
  guest-cleanup          cron: anonymizácia + zmazanie súborov
  translate              DeepL pre appku
seed/rules.sql  ubytovací poriadok (generuje tools/export-rules.mjs)
config.toml     verify_jwt podľa funkcie
```

Testy bez siete: `test/db.test.mjs` (PGlite: migrácie, RLS, RPC), `test/edge-functions.test.mjs`,
`test/webpush.test.mjs`, `test/ticket-bridge-parity.test.mjs`. Nasadenie krok za krokom:
[docs/SETUP_SUPABASE.md](../docs/SETUP_SUPABASE.md).
