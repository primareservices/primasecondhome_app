-- PRIMA SECOND HOME — schéma pre hostí (v1.1, návrh). Idempotentné.
-- Prístup hosťa: Supabase anonymous sign-in → RPC redeem_code() → riadok v guest_links.
-- Všetko so stay_id je čitateľné/zapisovateľné LEN cez guest_links.uid = auth.uid().
create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- ── verejný obsah ────────────────────────────────────────────────────────────
create table if not exists public.properties (
  id text primary key,
  name text not null, city text not null, address text not null, map_url text,
  reception_phone text, reception_email text,
  messengers jsonb not null default '{}'::jsonb,
  arrival_tip jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,
  wifi jsonb not null default '{}'::jsonb,
  quiet_hours text,
  updated_at timestamptz not null default now()
);
create table if not exists public.house_info (
  property_id text not null references public.properties(id) on delete cascade,
  key text not null,
  texts jsonb not null default '{}'::jsonb,
  primary key (property_id, key)
);
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete cascade,   -- null = celá sieť
  version text not null,
  texts jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.guides (
  id text primary key,
  ord int not null default 0,
  texts jsonb not null
);
create table if not exists public.guest_announcements (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete cascade,   -- null = všetky budovy
  scope jsonb not null default '{}'::jsonb,                                -- {block, floor}
  severity text not null default 'info' check (severity in ('info','warning','urgent')),
  texts jsonb not null,                                                    -- {sk:{title,body}, en:{…}, …}
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

-- ── pobyty a prístup ─────────────────────────────────────────────────────────
create table if not exists public.guest_stays (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.properties(id),
  room text not null,
  surname_prefix text not null,          -- lower, bez diakritiky, 3 znaky
  display_name text,
  client_company text,
  coordinator jsonb,                     -- {name, phone}
  check_in date not null,
  check_out date,
  registered_at date,                    -- hlásenie pobytu cudzineckej polícii
  lang text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create table if not exists public.guest_codes (
  code_hash text primary key,            -- sha256(kód bez pomlčiek, veľké písmená)
  stay_id uuid not null references public.guest_stays(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by text
);
create table if not exists public.guest_links (
  uid uuid not null,
  stay_id uuid not null references public.guest_stays(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (uid, stay_id)
);
create index if not exists guest_links_stay_idx on public.guest_links(stay_id);

-- ── žiadosti ─────────────────────────────────────────────────────────────────
create sequence if not exists public.guest_ref_seq start 1100;
create table if not exists public.guest_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null default ('H-' || nextval('public.guest_ref_seq')::text),
  stay_id uuid not null references public.guest_stays(id) on delete cascade,
  kind text not null check (kind in ('issue','service','document')),
  category text, service text, room text, place text,
  payload jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,     -- cesty v private bucketi guest-photos
  text text, text_sk text, text_en text, lang text,
  status text not null default 'reported',
  timeline jsonb not null default '[]'::jsonb,   -- [{at, status, note:{sk,en,…}}]
  external_ref text,                             -- id ticketu v RE SERVICE
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guest_requests_stay_idx on public.guest_requests(stay_id, created_at desc);
create table if not exists public.rule_acks (
  uid uuid not null, stay_id uuid not null references public.guest_stays(id) on delete cascade,
  version text not null, at timestamptz not null default now(),
  primary key (uid, stay_id, version)
);
create table if not exists public.guest_feedback (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid references public.guest_stays(id) on delete set null,   -- null = anonymné
  property_id text references public.properties(id),
  ratings jsonb not null, text text, lang text,
  created_at timestamptz not null default now()
);
create table if not exists public.guest_push_subscriptions (
  uid uuid not null, endpoint text not null, keys jsonb not null,
  created_at timestamptz not null default now(),
  primary key (uid, endpoint)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.properties enable row level security;
alter table public.house_info enable row level security;
alter table public.rules enable row level security;
alter table public.guides enable row level security;
alter table public.guest_announcements enable row level security;
alter table public.guest_stays enable row level security;
alter table public.guest_codes enable row level security;
alter table public.guest_links enable row level security;
alter table public.guest_requests enable row level security;
alter table public.rule_acks enable row level security;
alter table public.guest_feedback enable row level security;
alter table public.guest_push_subscriptions enable row level security;

do $$ begin
  -- verejný obsah: číta každý (aj anon), zapisuje len service_role (office cez TOOLS)
  drop policy if exists public_read on public.properties;          create policy public_read on public.properties for select using (true);
  drop policy if exists public_read on public.house_info;          create policy public_read on public.house_info for select using (true);
  drop policy if exists public_read on public.rules;               create policy public_read on public.rules for select using (true);
  drop policy if exists public_read on public.guides;              create policy public_read on public.guides for select using (true);
  drop policy if exists public_read on public.guest_announcements; create policy public_read on public.guest_announcements for select using (valid_from <= now() and (valid_to is null or valid_to >= now()));
  -- väzba hosť ↔ pobyt: vlastné riadky, zápis len cez RPC
  drop policy if exists own_links on public.guest_links;           create policy own_links on public.guest_links for select using (uid = auth.uid());
  drop policy if exists own_stay on public.guest_stays;            create policy own_stay on public.guest_stays for select using (exists (select 1 from public.guest_links l where l.stay_id = guest_stays.id and l.uid = auth.uid()));
  -- kódy nečíta nikto z klienta
  -- žiadosti: vlastné cez väzbu; insert len na vlastný pobyt; update (zrušenie) len vlastné
  drop policy if exists own_requests_select on public.guest_requests; create policy own_requests_select on public.guest_requests for select using (exists (select 1 from public.guest_links l where l.stay_id = guest_requests.stay_id and l.uid = auth.uid()));
  drop policy if exists own_requests_insert on public.guest_requests; create policy own_requests_insert on public.guest_requests for insert with check (exists (select 1 from public.guest_links l where l.stay_id = guest_requests.stay_id and l.uid = auth.uid()));
  drop policy if exists own_requests_update on public.guest_requests; create policy own_requests_update on public.guest_requests for update using (exists (select 1 from public.guest_links l where l.stay_id = guest_requests.stay_id and l.uid = auth.uid()));
  drop policy if exists own_acks on public.rule_acks;              create policy own_acks on public.rule_acks for all using (uid = auth.uid()) with check (uid = auth.uid());
  drop policy if exists own_feedback on public.guest_feedback;     create policy own_feedback on public.guest_feedback for insert with check (stay_id is null or exists (select 1 from public.guest_links l where l.stay_id = guest_feedback.stay_id and l.uid = auth.uid()));
  drop policy if exists own_push on public.guest_push_subscriptions; create policy own_push on public.guest_push_subscriptions for all using (uid = auth.uid()) with check (uid = auth.uid());
end $$;

-- ── RPC: uplatnenie kódu z lístka ────────────────────────────────────────────
create or replace function public.redeem_code(p_code text, p_surname text)
returns public.guest_stays
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_code public.guest_codes;
  v_stay public.guest_stays;
  v_prefix text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hash := encode(digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
  select * into v_code from public.guest_codes where code_hash = v_hash and expires_at > now();
  if not found then raise exception 'invalid'; end if;
  select * into v_stay from public.guest_stays where id = v_code.stay_id and closed_at is null;
  v_prefix := lower(left(regexp_replace(unaccent(coalesce(p_surname, '')), '[^A-Za-z]', '', 'g'), 3));
  if not found or v_stay.surname_prefix <> v_prefix then raise exception 'invalid'; end if;
  insert into public.guest_links(uid, stay_id) values (v_uid, v_stay.id) on conflict do nothing;
  update public.guest_codes set used_at = coalesce(used_at, now()) where code_hash = v_hash;
  return v_stay;
end $$;
revoke all on function public.redeem_code(text, text) from public, anon;
grant execute on function public.redeem_code(text, text) to authenticated;

-- ── údržba ───────────────────────────────────────────────────────────────────
-- Anonymizácia 30 dní po odchode (pg_cron alebo cron Workera): closed stays → zmazať links/codes,
-- vynulovať display_name, texty žiadostí ponechať bez fotiek. Zámerne mimo tejto migrácie.
