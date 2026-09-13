# Nasadenie backendu (Supabase) — kolo B

Všetko v tomto návode je jednorazové nastavenie; kód je hotový a otestovaný. Po dokončení appka
prestane bežať v DEMO režime a hlásenia hostí sa objavia v PRIMA RE SERVICE.

## 0. Čo vznikne

- Supabase projekt **prima-home** (EÚ región), oddelený od RE SERVICE a TOOLS.
- Schéma z `supabase/migrations/`, šesť edge funkcií, dva privátne buckety, webhooky a cron.
- Appka prepne na ostrý režim, keď má `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`.

## 1. Projekt

1. supabase.com → New project → región **EU (Frankfurt)**, uložiť DB heslo.
2. **Authentication → Sign In / Providers → Anonymous sign-ins: ON.** Hostia nemajú účty; anonymný
   používateľ sa zviaže s pobytom kódom z lístka (RPC `redeem_code`, limit 10 pokusov / 15 min).
3. **Database → Extensions:** zapnúť `pg_cron` a `pg_net` (cron a volanie funkcií z DB).
4. **Settings → API:** Project URL, publishable (anon) key, service_role key (ten nikdy do klienta).

## 2. Schéma

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push          # aplikuje supabase/migrations/*.sql v poradí
```

Overenie: Table Editor ukáže `guest_stays`, `guest_requests`, `guest_bookings`, …; Storage má
privátne buckety `guest-photos` a `guest-docs`. Ak bol `pg_cron` zapnutý až po migrácii, v SQL
editore spustite `select cron.schedule('guest-cleanup', '30 3 * * *', 'select public.guest_cleanup(30)');`.

Ubytovací poriadok do tabuľky `rules`: `node tools/export-rules.mjs > supabase/seed/rules.sql`
a obsah spustiť v SQL editore (súbor je v repe, idempotentný).

## 3. Secrets a edge funkcie

```bash
npx web-push generate-vapid-keys        # VAPID pár pre push (web-push je devDependency)
npx supabase secrets set \
  WEBHOOK_SECRET=<náhodných 32+ znakov> \
  RE_SERVICE_URL=https://<ref-re-service>.supabase.co RE_SERVICE_SERVICE_KEY=<service_role RE SERVICE> \
  DEEPL_KEY=<DeepL API kľúč; free končí :fx> \
  VAPID_PUBLIC_KEY=<…> VAPID_PRIVATE_KEY=<…> VAPID_SUBJECT=mailto:office@primare.sk \
  CF_ACCOUNT_ID=<Cloudflare account id> CF_API_TOKEN=<token s právom Browser Rendering: Edit> \
  RESEND_API_KEY=<…> MAIL_FROM="PRIMA SECOND HOME <noreply@primare.sk>"
npx supabase functions deploy guest-request-bridge sync-ticket-status send-push translate sign-rules guest-cleanup
```

`SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` dostávajú funkcie automaticky. Bez `CF_*` funkcia
`sign-rules` PDF nevyrobí (hosť má PDF z telefónu), bez `RESEND_API_KEY` nepošle e-mail, bez
`DEEPL_KEY` idú texty personálu bez prekladu, bez `VAPID_*` sa push preskočí — nič nespadne.

## 4. Webhooky (Database → Webhooks, typ Supabase Edge Function, POST, timeout 5000 ms)

| Tabuľka | Udalosť | Funkcia | HTTP hlavička |
|---|---|---|---|
| `guest_requests` | INSERT | `guest-request-bridge` | `x-webhook-secret: <WEBHOOK_SECRET>` |
| `guest_announcements` | INSERT | `send-push` | `x-webhook-secret: <WEBHOOK_SECRET>` |
| `guest_signatures` | INSERT | `sign-rules` | `x-webhook-secret: <WEBHOOK_SECRET>` |

## 5. Cron (SQL editor; pg_cron + pg_net)

```sql
select cron.schedule('sync-ticket-status', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/sync-ticket-status',
    headers := '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}'::jsonb,
    body := '{}'::jsonb) $$);
select cron.schedule('guest-cleanup-files', '40 3 * * *', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/guest-cleanup',
    headers := '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}'::jsonb,
    body := '{}'::jsonb) $$);
```

## 6. Prvý pobyt a kód (kým nie je modul „Hostia“ v TOOLS)

```sql
insert into public.guest_stays (property_id, room, surname_prefix, display_name, client_company, check_in, check_out, lang, email)
values ('p_ic23', '111/2', public.guest_norm_surname('Kovalenko'), 'Oleksandr K.', 'Demo Agency s.r.o.',
        current_date, current_date + 90, 'uk', null)
returning id;
select public.office_issue_code('<id z predchádzajúceho riadku>', 'IC23-1102', 14, 'recepcia');
```

Kód má mať aspoň 6 znakov (`IC23-1102` → `IC231102`), platí 14 dní, ukladá sa len ako odtlačok.
Oznam: `insert into public.guest_announcements (property_id, severity, texts, valid_to) values
('p_ic23', 'warning', '{"sk":{"title":"…","body":"…"},"uk":{"title":"…","body":"…"}}', now() + interval '3 days');`
— webhook ho hneď pošle ako push.

## 7. Appka (Cloudflare → Workers & Pages → projekt → Settings → Variables and Secrets)

- produkcia (`main`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`
- staging (ostatné vetvy): `VITE_SUPABASE_URL_STAGING`, `VITE_SUPABASE_ANON_KEY_STAGING`
  (druhý Supabase projekt alebo ten istý — `vite.config.js` prepína podľa vetvy)

Bez premenných beží DEMO. Po nastavení zmizne z profilu žltý pruh „Demo-režim“.

## 8. RE SERVICE (jednorazovo, mimo tohto repa)

- V kóde RE SERVICE netreba nič: most zapisuje so service role priamo do `tickets` a `notifications`,
  personál vidí hlásenie pri najbližšom obnovení (do 60 s). Push personálu: v RE SERVICE projekte
  pridať Database Webhook `notifications` INSERT → ich `send-push` (voliteľné).
- Hosťovské tickety majú ID `G-…` (RPC `alloc_ticket_ids` v RE SERVICE vyžaduje oprávnenie
  personálu). Ak má RE SERVICE trvať na `T-` číslach, pridá sa tam `security definer` obal.
- QR z dverí bez účtu personálu → presmerovanie do appky: `integrations/re-service/deep-link-redirect.js`
  (jeden import a volanie v `src/boot/deep-link.js` RE SERVICE).

## 9. Kontrola po nasadení

1. Appka: kód → Home → Nahlásiť problém → v RE SERVICE do 5 s ticket `G-…` s prekladom a odkazmi na fotky.
2. Zmena stavu ticketu v RE SERVICE → do 5 minút v appke (Žiadosti) + push.
3. Check-in: podpis → Dokumenty → PDF; v bucketе `guest-docs` súbor `poriadok-…pdf`; e-mail s kópiou.
4. Oznam vložený do DB → push hosťom budovy vo svojom jazyku.
5. `npm run check` lokálne (testy DB bežia nad PGlite bez siete).
