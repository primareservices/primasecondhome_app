-- PRIMA SECOND HOME — v1.2 (14. 9. 2026): office prístup (modul „Hostia“ v TOOLS), upratovanie
-- z RE SERVICE na pobyte, zabudnutie hosťa (GDPR). Idempotentné, len pridáva.

-- ── 1) office používatelia: účty v TOMTO projekte (e-mail + heslo), roly a budovy ────
create table if not exists public.office_users (
  uid uuid primary key,
  email text not null,
  name text,
  role text not null default 'reception' check (role in ('reception','manager','admin')),
  property_ids text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.office_users enable row level security;
drop policy if exists office_users_self on public.office_users; create policy office_users_self on public.office_users for select using (uid = auth.uid());

create or replace function public.is_office() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.office_users o where o.uid = auth.uid() and o.active)
$$;
create or replace function public.office_property_ok(p text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.office_users o where o.uid = auth.uid() and o.active and (o.role = 'admin' or p = any(o.property_ids)))
$$;
create or replace function public.office_stay_ok(p_stay uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.guest_stays s join public.office_users o on o.uid = auth.uid() and o.active
                 where s.id = p_stay and (o.role = 'admin' or s.property_id = any(o.property_ids)))
$$;
revoke all on function public.is_office() from public, anon;                 grant execute on function public.is_office() to authenticated;
revoke all on function public.office_property_ok(text) from public, anon;    grant execute on function public.office_property_ok(text) to authenticated;
revoke all on function public.office_stay_ok(uuid) from public, anon;        grant execute on function public.office_stay_ok(uuid) to authenticated;

-- ── 2) politiky office (pridávajú sa k hosťovským — Postgres ich spája cez OR) ────────
drop policy if exists office_stays on public.guest_stays;
create policy office_stays on public.guest_stays for all using (public.office_property_ok(property_id)) with check (public.office_property_ok(property_id));
drop policy if exists office_requests on public.guest_requests;
create policy office_requests on public.guest_requests for all using (public.office_stay_ok(stay_id)) with check (public.office_stay_ok(stay_id));
drop policy if exists office_bookings on public.guest_bookings;
create policy office_bookings on public.guest_bookings for select using (public.office_stay_ok(stay_id));
drop policy if exists office_msg_select on public.guest_messages;
create policy office_msg_select on public.guest_messages for select using (public.office_stay_ok(stay_id));
drop policy if exists office_msg_insert on public.guest_messages;
create policy office_msg_insert on public.guest_messages for insert with check (public.office_stay_ok(stay_id) and sender = 'reception');
drop policy if exists office_msg_update on public.guest_messages;
create policy office_msg_update on public.guest_messages for update using (public.office_stay_ok(stay_id)) with check (public.office_stay_ok(stay_id));
drop policy if exists office_signatures on public.guest_signatures;
create policy office_signatures on public.guest_signatures for select using (public.office_stay_ok(stay_id));
drop policy if exists office_identity on public.guest_identity;
create policy office_identity on public.guest_identity for all using (public.office_stay_ok(stay_id)) with check (public.office_stay_ok(stay_id));
drop policy if exists office_permits on public.guest_permits;
create policy office_permits on public.guest_permits for select using (public.office_stay_ok(stay_id));
drop policy if exists office_feedback on public.guest_feedback;
create policy office_feedback on public.guest_feedback for select using (public.is_office() and (property_id is null or public.office_property_ok(property_id)));
drop policy if exists office_ann on public.guest_announcements;
create policy office_ann on public.guest_announcements for all
  using (public.is_office() and (property_id is null or public.office_property_ok(property_id)))
  with check (public.is_office() and (property_id is null or public.office_property_ok(property_id)));
drop policy if exists office_rules on public.rules;
create policy office_rules on public.rules for all using (public.is_office()) with check (public.is_office());
drop policy if exists office_properties on public.properties;
create policy office_properties on public.properties for update using (public.office_property_ok(id)) with check (public.office_property_ok(id));
drop policy if exists office_house_info on public.house_info;
create policy office_house_info on public.house_info for all using (public.office_property_ok(property_id)) with check (public.office_property_ok(property_id));

-- Stav žiadosti smie meniť personál (office) aj server; hosť naďalej len zrušiť.
create or replace function public.guest_requests_guard() returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'authenticated' and not public.is_office() then
    if new.status is distinct from old.status and new.status <> 'cancelled' then raise exception 'guest_may_only_cancel' using errcode = '42501'; end if;
    if new.status = 'cancelled' and old.status not in ('reported','assigned','forwarded','received') then raise exception 'cannot_cancel_now' using errcode = '42501'; end if;
    new.cancelled_at := case when new.status = 'cancelled' then coalesce(new.cancelled_at, now()) else old.cancelled_at end;
  end if;
  return new;
end $$;

-- Kód smie vydať office (svoje budovy) alebo server.
create or replace function public.office_issue_code(p_stay uuid, p_code text, p_days int default 14, p_by text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if not (public.office_stay_ok(p_stay) or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role') then raise exception 'forbidden' using errcode = '42501'; end if;
  if length(v_norm) < 6 then raise exception 'code_too_short'; end if;
  if not exists (select 1 from public.guest_stays where id = p_stay) then raise exception 'stay_not_found'; end if;
  insert into public.guest_codes(code_hash, stay_id, expires_at, created_by)
    values (encode(sha256(convert_to(v_norm, 'UTF8')), 'hex'), p_stay, now() + make_interval(days => greatest(coalesce(p_days, 14), 1)), coalesce(p_by, current_setting('request.jwt.claim.email', true), 'office'))
    on conflict (code_hash) do update set stay_id = excluded.stay_id, expires_at = excluded.expires_at, used_at = null, created_by = excluded.created_by;
  return v_norm;
end $$;
revoke all on function public.office_issue_code(uuid, text, int, text) from public, anon;
grant execute on function public.office_issue_code(uuid, text, int, text) to authenticated;

-- Založenie pobytu + kódu jedným volaním (TOOLS „Hostia“ pri check-ine). Vracia {id, code}.
create or replace function public.office_create_stay(p_property text, p_room text, p_surname text, p_display_name text, p_company text,
  p_check_in date, p_check_out date, p_lang text, p_email text, p_coordinator jsonb, p_code text, p_code_days int default 14)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if not (public.office_property_ok(p_property) or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role') then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.guest_stays (property_id, room, surname_prefix, display_name, client_company, check_in, check_out, lang, email, coordinator)
    values (p_property, p_room, public.guest_norm_surname(p_surname), p_display_name, p_company, coalesce(p_check_in, current_date), p_check_out, p_lang, p_email, p_coordinator)
    returning id into v_id;
  v_code := public.office_issue_code(v_id, p_code, p_code_days, null);
  return jsonb_build_object('id', v_id, 'code', v_code);
end $$;
revoke all on function public.office_create_stay(text, text, text, text, text, date, date, text, text, jsonb, text, int) from public, anon;
grant execute on function public.office_create_stay(text, text, text, text, text, date, date, text, text, jsonb, text, int) to authenticated;

-- ── 3) upratovanie z RE SERVICE (edge funkcia sync-cleaning) ─────────────────────────
alter table public.guest_stays add column if not exists next_cleaning date;
alter table public.guest_stays add column if not exists last_cleaning date;
alter table public.guest_stays add column if not exists room_state text;
alter table public.guest_stays add column if not exists cleaning_synced_at timestamptz;

-- ── 4) zabudnutie hosťa: správy, notifikácie, nastavenia a väzba telefónu preč ──────────
-- Hlásenia a podpísané dokumenty ostávajú v evidencii ubytovateľa; anonymizuje ich guest_cleanup 30 dní po odchode.
create or replace function public.guest_forget_me() returns int language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); n int := 0;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  delete from public.guest_messages where stay_id in (select stay_id from public.guest_links where uid = v_uid);
  get diagnostics n = row_count;
  delete from public.guest_push_subscriptions where uid = v_uid;
  delete from public.guest_prefs where uid = v_uid;
  delete from public.guest_ann_reads where uid = v_uid;
  delete from public.guest_code_attempts where uid = v_uid;
  delete from public.guest_links where uid = v_uid;
  return n;
end $$;
revoke all on function public.guest_forget_me() from public, anon;
grant execute on function public.guest_forget_me() to authenticated;
