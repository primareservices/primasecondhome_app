-- PRIMA SECOND HOME — schéma v1.1 (kolo B, 14. 9. 2026). Idempotentné, len pridáva.
-- Zásady: hosť = anonymný Supabase používateľ (auth.uid()) zviazaný s pobytom cez guest_links.
-- Klient nikdy nezapisuje do RE SERVICE ani TOOLS — to robia edge funkcie so service role.
-- Bez rozšírení (pgcrypto/unaccent): sha256() je v jadre Postgresu, diakritiku rieši translate().
-- Testuje sa v test/db.test.mjs nad PGlite (rovnaké SQL, stub auth.uid()).

-- ── 0) prevádzky: seed šiestich budov (cudzí kľúč pobytov) ───────────────────
insert into public.properties (id, name, city, address, reception_phone, reception_email) values
  ('p_ic15',    'PRIMA IC 15',    'Bratislava', 'Ivanská cesta 15, 821 04 Bratislava',   '+421 2 3310 4420', 'office@primare.sk'),
  ('p_ic23',    'PRIMA IC 23',    'Bratislava', 'Ivanská cesta 23, 821 04 Bratislava',   '+421 2 3310 4420', 'office@primare.sk'),
  ('p_tarif',   'PRIMA Tarif',    'Bratislava', 'Stará Vajnorská 39A, 831 04 Bratislava', '+421 2 3310 4404', 'tarif@ubytovnaprima.sk'),
  ('p_nukleon', 'PRIMA Nukleon',  'Trnava',     'Jána Bottu 2, 917 01 Trnava',           '+421 2 3310 4420', 'office@primare.sk'),
  ('p_nitra',   'PRIMA Nitra',    'Nitra',      'Čajkovského 2, 949 11 Nitra',           '+421 2 3310 4403', 'nr@ubytovnaprima.sk'),
  ('p_galanta', 'PRIMA Galanta',  'Galanta',    'Matúškovská cesta, 924 01 Galanta',     '+421 2 3310 4420', 'office@primare.sk')
on conflict (id) do nothing;

-- ── 1) pomocné funkcie ───────────────────────────────────────────────────────
-- Vlastní prihlásený hosť daný pobyt? (security definer: nezávisí od RLS guest_links)
create or replace function public.guest_owns_stay(p_stay uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.guest_links l where l.uid = auth.uid() and l.stay_id = p_stay)
$$;
create or replace function public.guest_owns_stay_text(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select case when p ~ '^[0-9a-fA-F-]{36}$' then public.guest_owns_stay(p::uuid) else false end
$$;
revoke all on function public.guest_owns_stay(uuid) from public, anon;
revoke all on function public.guest_owns_stay_text(text) from public, anon;
grant execute on function public.guest_owns_stay(uuid) to authenticated;
grant execute on function public.guest_owns_stay_text(text) to authenticated;

-- Priezvisko → 3 písmená bez diakritiky (zrkadlo normSurname v src/data/demo-store.js).
create or replace function public.guest_norm_surname(p text)
returns text language sql immutable as $$
  select left(lower(regexp_replace(translate(coalesce(p, ''),
    'áäčďéěíĺľňóôöőŕřšťúůüűýžÁÄČĎÉĚÍĹĽŇÓÔÖŐŔŘŠŤÚŮÜŰÝŽăâîșşțţĂÂÎȘŞȚŢąćęłńśźżĄĆĘŁŃŚŹŻ',
    'aacdeeillnoooorrstuuuuyzAACDEEILLNOOOORRSTUUUUYZaaissttAAISSTTacelnszzACELNSZZ'), '[^A-Za-z]', '', 'g')), 3)
$$;
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ── 2) žiadosti: súkromné hlásenia, zrušenie, ochrana stavu ──────────────────
alter table public.guest_requests drop constraint if exists guest_requests_kind_check;
alter table public.guest_requests add constraint guest_requests_kind_check check (kind in ('issue','service','document','private'));
alter table public.guest_requests add column if not exists cancelled_at timestamptz;
drop trigger if exists guest_requests_touch on public.guest_requests;
create trigger guest_requests_touch before update on public.guest_requests for each row execute function public.touch_updated_at();
-- Hosť smie svoju žiadosť len zrušiť; ostatné stavy nastavuje personál (service role, edge funkcie).
create or replace function public.guest_requests_guard() returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'authenticated' then
    if new.status is distinct from old.status and new.status <> 'cancelled' then raise exception 'guest_may_only_cancel' using errcode = '42501'; end if;
    if new.status = 'cancelled' and old.status not in ('reported','assigned','forwarded','received') then raise exception 'cannot_cancel_now' using errcode = '42501'; end if;
    new.cancelled_at := case when new.status = 'cancelled' then coalesce(new.cancelled_at, now()) else old.cancelled_at end;
  end if;
  return new;
end $$;
drop trigger if exists guest_requests_guard on public.guest_requests;
create trigger guest_requests_guard before update on public.guest_requests for each row execute function public.guest_requests_guard();
revoke update on public.guest_requests from authenticated;
grant update (status, cancelled_at, timeline) on public.guest_requests to authenticated;

-- ── 3) pobyt: e-mail pre podpísané dokumenty, anonymizácia ───────────────────
alter table public.guest_stays add column if not exists email text;
alter table public.guest_stays add column if not exists anonymized_at timestamptz;

-- ── 4) práčovňa ──────────────────────────────────────────────────────────────
create table if not exists public.guest_bookings (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.guest_stays(id) on delete cascade,
  property_id text not null references public.properties(id),
  day date not null,
  start int not null check (start between 0 and 23),
  len int not null default 2 check (len between 1 and 6),
  machine int not null check (machine between 1 and 20),
  status text not null default 'booked' check (status in ('booked','cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create unique index if not exists guest_bookings_slot_uq on public.guest_bookings(property_id, day, start, machine) where status = 'booked';
create index if not exists guest_bookings_stay_idx on public.guest_bookings(stay_id, day);
-- Budovu dopĺňa trigger z pobytu — klient ju neposiela a nemôže si vybrať cudziu.
create or replace function public.guest_bookings_fill() returns trigger language plpgsql security definer set search_path = public as $$
begin
  select property_id into new.property_id from public.guest_stays where id = new.stay_id;
  if new.property_id is null then raise exception 'stay_not_found'; end if;
  return new;
end $$;
drop trigger if exists guest_bookings_fill on public.guest_bookings;
create trigger guest_bookings_fill before insert on public.guest_bookings for each row execute function public.guest_bookings_fill();
alter table public.guest_bookings enable row level security;
drop policy if exists own_bookings_select on public.guest_bookings; create policy own_bookings_select on public.guest_bookings for select using (public.guest_owns_stay(stay_id));
drop policy if exists own_bookings_insert on public.guest_bookings; create policy own_bookings_insert on public.guest_bookings for insert with check (public.guest_owns_stay(stay_id) and status = 'booked');
drop policy if exists own_bookings_update on public.guest_bookings; create policy own_bookings_update on public.guest_bookings for update using (public.guest_owns_stay(stay_id)) with check (public.guest_owns_stay(stay_id) and status = 'cancelled');
revoke update on public.guest_bookings from authenticated;
grant update (status, cancelled_at) on public.guest_bookings to authenticated;
-- Obsadenosť práčovne v budove hosťa bez odhalenia, kto rezervoval.
create or replace function public.laundry_occupancy(p_property text, p_from date, p_to date)
returns table(day date, start int, len int, machine int)
language sql stable security definer set search_path = public as $$
  select b.day, b.start, b.len, b.machine
  from public.guest_bookings b
  where b.property_id = p_property and b.status = 'booked' and b.day between p_from and p_to
    and exists (select 1 from public.guest_links l join public.guest_stays s on s.id = l.stay_id
                where l.uid = auth.uid() and s.property_id = p_property)
$$;
revoke all on function public.laundry_occupancy(text, date, date) from public, anon;
grant execute on function public.laundry_occupancy(text, date, date) to authenticated;

-- ── 5) povolenie na pobyt, prečítané oznamy, nastavenia ──────────────────────
create table if not exists public.guest_permits (
  stay_id uuid primary key references public.guest_stays(id) on delete cascade,
  expiry date,
  updated_at timestamptz not null default now()
);
alter table public.guest_permits enable row level security;
drop policy if exists own_permits on public.guest_permits; create policy own_permits on public.guest_permits for all using (public.guest_owns_stay(stay_id)) with check (public.guest_owns_stay(stay_id));

create table if not exists public.guest_ann_reads (
  uid uuid not null,
  ann_id uuid not null references public.guest_announcements(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (uid, ann_id)
);
alter table public.guest_ann_reads enable row level security;
drop policy if exists own_ann_reads on public.guest_ann_reads; create policy own_ann_reads on public.guest_ann_reads for all using (uid = auth.uid()) with check (uid = auth.uid());

create table if not exists public.guest_prefs (
  uid uuid primary key,
  notifications boolean not null default true,
  lang text,
  updated_at timestamptz not null default now()
);
alter table public.guest_prefs enable row level security;
drop policy if exists own_prefs on public.guest_prefs; create policy own_prefs on public.guest_prefs for all using (uid = auth.uid()) with check (uid = auth.uid());

-- ── 6) podpis ubytovacieho poriadku, overenie totožnosti ─────────────────────
create table if not exists public.guest_signatures (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.guest_stays(id) on delete cascade,
  version text not null,
  name text, email text, lang text,
  signature_path text,                         -- guest-docs/<stay>/signature-<id>.png
  pdf_path text, sha256 text,                  -- doplní edge funkcia sign-rules
  audit jsonb not null default '{}'::jsonb,    -- {ua, tz, app_version, identity_status}
  signed_at timestamptz not null default now(),
  email_sent_at timestamptz
);
create index if not exists guest_signatures_stay_idx on public.guest_signatures(stay_id, signed_at desc);
alter table public.guest_signatures enable row level security;
drop policy if exists own_sig_select on public.guest_signatures; create policy own_sig_select on public.guest_signatures for select using (public.guest_owns_stay(stay_id));
drop policy if exists own_sig_insert on public.guest_signatures; create policy own_sig_insert on public.guest_signatures for insert with check (public.guest_owns_stay(stay_id));

create table if not exists public.guest_identity (
  stay_id uuid primary key references public.guest_stays(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','declined','review')),
  provider text, provider_ref text,
  data jsonb not null default '{}'::jsonb,     -- údaje z dokladu pre domovú knihu; nikdy biometria
  checked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.guest_identity enable row level security;
drop policy if exists own_identity_select on public.guest_identity; create policy own_identity_select on public.guest_identity for select using (public.guest_owns_stay(stay_id));

-- ── 7) správy s recepciou ────────────────────────────────────────────────────
create table if not exists public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.guest_stays(id) on delete cascade,
  sender text not null check (sender in ('guest','reception')),
  text text not null check (length(text) between 1 and 2000),
  tr jsonb not null default '{}'::jsonb,       -- preklady {sk, en, <jazyk hosťa>}
  lang text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists guest_messages_stay_idx on public.guest_messages(stay_id, created_at);
alter table public.guest_messages enable row level security;
drop policy if exists own_msg_select on public.guest_messages; create policy own_msg_select on public.guest_messages for select using (public.guest_owns_stay(stay_id));
drop policy if exists own_msg_insert on public.guest_messages; create policy own_msg_insert on public.guest_messages for insert with check (public.guest_owns_stay(stay_id) and sender = 'guest');
drop policy if exists own_msg_read on public.guest_messages;   create policy own_msg_read   on public.guest_messages for update using (public.guest_owns_stay(stay_id)) with check (public.guest_owns_stay(stay_id));
revoke update on public.guest_messages from authenticated;
grant update (read_at) on public.guest_messages to authenticated;   -- hosť smie len označiť prečítané

-- ── 8) pokusy o kód + redeem_code v2 (limit, bez rozšírení) ──────────────────
-- Vracia riadok pobytu; NULL = neplatný kód alebo priezvisko; výnimky: not_authenticated, too_many_attempts.
create table if not exists public.guest_code_attempts (
  id bigserial primary key,
  uid uuid, code_hash text,
  at timestamptz not null default now()
);
create index if not exists guest_code_attempts_uid_idx on public.guest_code_attempts(uid, at);
create index if not exists guest_code_attempts_hash_idx on public.guest_code_attempts(code_hash, at);
alter table public.guest_code_attempts enable row level security;   -- bez politík: klient nečíta ani nezapisuje

create or replace function public.redeem_code(p_code text, p_surname text)
returns public.guest_stays
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_code public.guest_codes;
  v_stay public.guest_stays;
  v_prefix text;
  v_n int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select count(*) into v_n from public.guest_code_attempts where uid = v_uid and at > now() - interval '15 minutes';
  if v_n >= 10 then raise exception 'too_many_attempts'; end if;
  v_hash := encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex');
  select count(*) into v_n from public.guest_code_attempts where code_hash = v_hash and at > now() - interval '1 hour';
  if v_n >= 20 then raise exception 'too_many_attempts'; end if;
  v_prefix := public.guest_norm_surname(p_surname);
  select * into v_code from public.guest_codes where code_hash = v_hash and expires_at > now();
  if v_code.code_hash is not null then
    select * into v_stay from public.guest_stays where id = v_code.stay_id and closed_at is null and anonymized_at is null;
  end if;
  -- Neplatný kód/priezvisko: pokus sa zapíše a funkcia vráti NULL (výnimka by zápis pokusu vrátila späť).
  if v_code.code_hash is null or v_stay.id is null or v_stay.surname_prefix <> v_prefix then
    insert into public.guest_code_attempts(uid, code_hash) values (v_uid, v_hash);
    return null;
  end if;
  insert into public.guest_links(uid, stay_id) values (v_uid, v_stay.id) on conflict do nothing;
  update public.guest_codes set used_at = coalesce(used_at, now()) where code_hash = v_hash;
  delete from public.guest_code_attempts where uid = v_uid;
  return v_stay;
end $$;
revoke all on function public.redeem_code(text, text) from public, anon;
grant execute on function public.redeem_code(text, text) to authenticated;

-- ── 9) office (len service role — TOOLS modul Hostia) ────────────────────────
-- Kód sa ukladá len ako odtlačok; minimálne 6 znakov (IC23-1102 → IC231102).
create or replace function public.office_issue_code(p_stay uuid, p_code text, p_days int default 14, p_by text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if length(v_norm) < 6 then raise exception 'code_too_short'; end if;
  if not exists (select 1 from public.guest_stays where id = p_stay) then raise exception 'stay_not_found'; end if;
  insert into public.guest_codes(code_hash, stay_id, expires_at, created_by)
    values (encode(sha256(convert_to(v_norm, 'UTF8')), 'hex'), p_stay, now() + make_interval(days => greatest(coalesce(p_days, 14), 1)), p_by)
    on conflict (code_hash) do update set stay_id = excluded.stay_id, expires_at = excluded.expires_at, used_at = null, created_by = excluded.created_by;
  return v_norm;
end $$;
revoke all on function public.office_issue_code(uuid, text, int, text) from public, anon, authenticated;

-- Anonymizácia 30 dní po odchode: väzby, kódy, správy, nastavenia preč; meno, e-mail, koordinátor
-- a texty žiadostí vynulované. Súbory v bucketoch maže edge funkcia guest-cleanup cez Storage API.
create or replace function public.guest_cleanup(p_days int default 30)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record;
begin
  for r in
    select id from public.guest_stays
    where anonymized_at is null
      and (closed_at < now() - make_interval(days => p_days) or (check_out is not null and check_out < current_date - p_days))
  loop
    delete from public.guest_push_subscriptions where uid in (select uid from public.guest_links where stay_id = r.id);
    delete from public.guest_prefs where uid in (select uid from public.guest_links where stay_id = r.id);
    delete from public.guest_ann_reads where uid in (select uid from public.guest_links where stay_id = r.id);
    delete from public.guest_code_attempts where code_hash in (select code_hash from public.guest_codes where stay_id = r.id);
    delete from public.guest_codes where stay_id = r.id;
    delete from public.guest_links where stay_id = r.id;
    delete from public.guest_messages where stay_id = r.id;
    delete from public.guest_identity where stay_id = r.id;
    update public.guest_requests set photos = '[]'::jsonb, text = null, text_sk = null, text_en = null where stay_id = r.id;
    update public.guest_stays set display_name = null, email = null, coordinator = null, surname_prefix = '***',
      closed_at = coalesce(closed_at, now()), anonymized_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.guest_cleanup(int) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('guest-cleanup', '30 3 * * *', 'select public.guest_cleanup(30)');
  end if;
end $$;

-- ── 10) storage: privátne buckety, prístup len k vlastnému priečinku <stay_id>/ ──
insert into storage.buckets (id, name, public) values ('guest-photos', 'guest-photos', false), ('guest-docs', 'guest-docs', false)
on conflict (id) do nothing;
drop policy if exists guest_files_select on storage.objects;
create policy guest_files_select on storage.objects for select to authenticated
  using (bucket_id in ('guest-photos', 'guest-docs') and public.guest_owns_stay_text((storage.foldername(name))[1]));
drop policy if exists guest_files_insert on storage.objects;
create policy guest_files_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('guest-photos', 'guest-docs') and public.guest_owns_stay_text((storage.foldername(name))[1]));
