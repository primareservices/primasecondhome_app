// Migrácie a RLS nad PGlite (Postgres vo WASM): rovnaké SQL ako v Supabase, stub auth.uid()/auth.role()
// a storage schémy. Beží v `npm run check`. Čo sa tu overí: uplatnenie kódu (limit pokusov),
// izolácia hostí, ochrana stavu žiadostí, konflikt práčovne, správy, storage priečinky, anonymizácia.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const dir = new URL('../supabase/migrations/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const db = new PGlite();
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', X = '33333333-3333-4333-8333-333333333333';

const PREP = `
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create or replace function public.unaccent(t text) returns text language sql immutable as $$ select t $$;
create or replace function public.digest(t text, a text) returns bytea language sql immutable as $$ select sha256(convert_to(t, 'UTF8')) $$;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema public, storage, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
`;
async function as(uid, role, fn) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid || ''}', false); select set_config('request.jwt.claim.role', '${role}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claim.role', '', false);`); }
}
const q = async (sql, params) => (await db.query(sql, params)).rows;
const fails = async (fn, re) => { try { await fn(); } catch (e) { assert.match(String(e.message), re); return; } assert.fail('expected failure ' + re); };

let stayA, stayB;

test('migrácie sa aplikujú (bez rozšírení, idempotentne dvakrát)', async () => {
  await db.exec(PREP);
  for (const round of [1, 2]) {
    for (const f of files) {
      const sql = readFileSync(new URL(f, dir), 'utf8').replace(/^create extension[^\n]*\n/gmi, '');
      try { await db.exec(sql); } catch (e) { throw new Error(`${f} (round ${round}): ${e.message}`); }
    }
  }
  const tables = (await q("select table_name from information_schema.tables where table_schema = 'public' order by 1")).map(r => r.table_name);
  for (const t of ['guest_stays', 'guest_codes', 'guest_links', 'guest_requests', 'guest_bookings', 'guest_permits', 'guest_signatures', 'guest_identity', 'guest_messages', 'guest_code_attempts', 'guest_prefs', 'guest_ann_reads']) assert.ok(tables.includes(t), t);
  assert.equal((await q("select count(*)::int as n from public.properties")).length, 1);
});

test('office (service role) založí pobyty a vydá kódy len ako odtlačok', async () => {
  await as(null, 'service_role', async () => {
    stayA = (await q("insert into public.guest_stays (property_id, room, surname_prefix, display_name, client_company, check_in, check_out, lang) values ('p_ic23', '111/2', 'kov', 'Oleksandr K.', 'Demo Agency', current_date - 10, current_date + 90, 'uk') returning id"))[0].id;
    stayB = (await q("insert into public.guest_stays (property_id, room, surname_prefix, display_name, check_in, check_out, lang) values ('p_ic23', '112/1', 'nov', 'Ján N.', current_date - 5, current_date + 30, 'sk') returning id"))[0].id;
    assert.equal((await q("select public.office_issue_code($1, 'IC23-1102', 14, 'test') as c", [stayA]))[0].c, 'IC231102');
    assert.equal((await q("select public.office_issue_code($1, 'ic23 2001', 14) as c", [stayB]))[0].c, 'IC232001');
    await fails(() => q("select public.office_issue_code($1, 'AB1', 14)", [stayA]), /code_too_short/);
    const codes = await q('select code_hash, used_at from public.guest_codes');
    assert.equal(codes.length, 2); assert.match(codes[0].code_hash, /^[0-9a-f]{64}$/);
  });
});

test('redeem_code: zlý kód/priezvisko zlyhá a počíta sa; správny zviaže hosťa; hostia sa nevidia', async () => {
  await as(A, 'authenticated', async () => {
    assert.equal((await q("select (public.redeem_code('IC23-1102', 'Novák')).id is null as invalid"))[0].invalid, true);
    assert.equal((await q("select (public.redeem_code('IC23-9999', 'Kovalenko')).id is null as invalid"))[0].invalid, true);
    const r = await q("select (public.redeem_code('ic23-1102', 'Kovaľenko')).room as room");
    assert.equal(r[0].room, '111/2');
    assert.equal((await q('select id from public.guest_stays')).length, 1);
    assert.equal((await q('select * from public.guest_code_attempts')).length, 0);   // RLS bez politík: nič
  });
  await as(B, 'authenticated', async () => {
    assert.equal((await q('select id from public.guest_stays')).length, 0);
    const r = await q("select (public.redeem_code('IC23-2001', 'Novák')).room as room");
    assert.equal(r[0].room, '112/1');
  });
  await as(null, 'service_role', async () => {
    assert.equal((await q('select count(*)::int as n from public.guest_links'))[0].n, 2);
    assert.equal((await q('select count(*)::int as n from public.guest_code_attempts'))[0].n, 0);   // úspech zmazal pokusy
    assert.ok((await q('select used_at from public.guest_codes'))[0].used_at);
  });
});

test('redeem_code: po 10 zlých pokusoch za 15 min sa uid zablokuje', async () => {
  await as(X, 'authenticated', async () => {
    for (let i = 0; i < 10; i++) assert.equal((await q("select (public.redeem_code('IC23-0000', 'Nikto')).id is null as invalid"))[0].invalid, true);
    await fails(() => q("select public.redeem_code('IC23-1102', 'Kovalenko')"), /too_many_attempts/);
  });
});

test('žiadosti: vlastné áno, cudzie nie; hosť smie len zrušiť', async () => {
  let id;
  await as(A, 'authenticated', async () => {
    id = (await q("insert into public.guest_requests (id, stay_id, kind, category, place, room, text, lang) values (gen_random_uuid(), $1, 'issue', 'door', 'room', '111/2', 'Dvere', 'uk') returning id, ref", [stayA]))[0].id;
    assert.match((await q('select ref from public.guest_requests where id = $1', [id]))[0].ref, /^H-\d+$/);
    await fails(() => q("insert into public.guest_requests (stay_id, kind, text) values ($1, 'issue', 'cudzí pobyt')", [stayB]), /row-level security/);
    await q("insert into public.guest_requests (stay_id, kind, category, text) values ($1, 'private', 'staff', 'súkromné')", [stayA]);
    await fails(() => q("update public.guest_requests set status = 'resolved' where id = $1", [id]), /guest_may_only_cancel/);
    await fails(() => q("update public.guest_requests set text = 'x' where id = $1", [id]), /permission denied/);
    await q("update public.guest_requests set status = 'cancelled' where id = $1", [id]);
    assert.ok((await q('select cancelled_at from public.guest_requests where id = $1', [id]))[0].cancelled_at);
  });
  await as(B, 'authenticated', async () => {
    assert.equal((await q('select id from public.guest_requests')).length, 0);
  });
  await as(null, 'service_role', async () => {
    await q("update public.guest_requests set status = 'resolved' where stay_id = $1 and kind = 'private'", [stayA]);   // personál smie
  });
});

test('práčovňa: budovu dopĺňa trigger, konflikt = unique, obsadenosť bez mien', async () => {
  const day = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  await as(A, 'authenticated', async () => {
    const b = (await q("insert into public.guest_bookings (stay_id, day, start, machine) values ($1, $2, 18, 2) returning property_id, status", [stayA, day]))[0];
    assert.equal(b.property_id, 'p_ic23');
    await fails(() => q("insert into public.guest_bookings (stay_id, day, start, machine) values ($1, $2, 18, 3)", [stayB, day]), /row-level security/);
  });
  await as(B, 'authenticated', async () => {
    await fails(() => q("insert into public.guest_bookings (stay_id, day, start, machine) values ($1, $2, 18, 2)", [stayB, day]), /duplicate key|unique/i);
    const occ = await q("select * from public.laundry_occupancy('p_ic23', $1::date, $1::date)", [day]);
    assert.deepEqual(occ.map(o => [o.start, o.machine]), [[18, 2]]);
    await q("insert into public.guest_bookings (stay_id, day, start, machine) values ($1, $2, 18, 3)", [stayB, day]);
    assert.equal((await db.query("update public.guest_bookings set status = 'cancelled' where stay_id = $1", [stayA])).affectedRows, 0);   // cudzie riadky RLS skryje
    assert.equal((await q('select id from public.guest_bookings')).length, 1);   // vidí len svoju
  });
  await as(X, 'authenticated', async () => {
    assert.equal((await q("select * from public.laundry_occupancy('p_ic23', $1::date, $1::date)", [day])).length, 0);   // bez väzby nič
  });
  await as(A, 'authenticated', async () => {
    await q("update public.guest_bookings set status = 'cancelled', cancelled_at = now() where stay_id = $1", [stayA]);
    await q("insert into public.guest_bookings (stay_id, day, start, machine) values ($1, $2, 18, 2)", [stayA, day]);   // po zrušení je slot voľný
  });
});

test('správy: hosť píše ako guest, cudzie/recepčné nevloží, upraví len read_at', async () => {
  await as(A, 'authenticated', async () => {
    await q("insert into public.guest_messages (stay_id, sender, text, lang) values ($1, 'guest', 'Dobrý deň', 'uk')", [stayA]);
    await fails(() => q("insert into public.guest_messages (stay_id, sender, text) values ($1, 'reception', 'x')", [stayA]), /row-level security/);
    await fails(() => q("insert into public.guest_messages (stay_id, sender, text) values ($1, 'guest', 'x')", [stayB]), /row-level security/);
  });
  await as(null, 'service_role', async () => { await q("insert into public.guest_messages (stay_id, sender, text, tr) values ($1, 'reception', 'Dobrý deň, hneď to riešime.', '{\"uk\":\"Добрий день, вже вирішуємо.\"}')", [stayA]); });
  await as(A, 'authenticated', async () => {
    assert.equal((await q('select id from public.guest_messages')).length, 2);
    await fails(() => q("update public.guest_messages set text = 'zmenené' where sender = 'reception'"), /permission denied/);
    await q("update public.guest_messages set read_at = now() where sender = 'reception'");
    assert.equal((await q("select count(*)::int as n from public.guest_messages where read_at is not null"))[0].n, 1);
  });
});

test('podpis, povolenie, nastavenia: vlastné riadky; identitu hosť len číta', async () => {
  await as(A, 'authenticated', async () => {
    await q("insert into public.guest_signatures (stay_id, version, name, lang, signature_path) values ($1, '2026-09', 'Oleksandr Kovalenko', 'uk', $2)", [stayA, stayA + '/signature-1.png']);
    await fails(() => q("insert into public.guest_signatures (stay_id, version) values ($1, '2026-09')", [stayB]), /row-level security/);
    await q("insert into public.guest_permits (stay_id, expiry) values ($1, current_date + 42) on conflict (stay_id) do update set expiry = excluded.expiry", [stayA]);
    await q("insert into public.guest_prefs (uid, notifications, lang) values (auth.uid(), false, 'uk')");
    await fails(() => q("insert into public.guest_identity (stay_id, status) values ($1, 'approved')", [stayA]), /row-level security/);
  });
  await as(null, 'service_role', async () => { await q("insert into public.guest_identity (stay_id, status, provider) values ($1, 'approved', 'test')", [stayA]); });
  await as(A, 'authenticated', async () => { assert.equal((await q('select status from public.guest_identity'))[0].status, 'approved'); });
  await as(B, 'authenticated', async () => { assert.equal((await q('select * from public.guest_identity')).length, 0); assert.equal((await q('select * from public.guest_signatures')).length, 0); });
});

test('storage: zápis a čítanie len vo vlastnom priečinku <stay_id>/', async () => {
  await as(A, 'authenticated', async () => {
    await q("insert into storage.objects (bucket_id, name) values ('guest-photos', $1)", [stayA + '/r1/photo.jpg']);
    await fails(() => q("insert into storage.objects (bucket_id, name) values ('guest-photos', $1)", [stayB + '/x.jpg']), /row-level security/);
    await fails(() => q("insert into storage.objects (bucket_id, name) values ('guest-photos', 'nie-uuid/x.jpg')"), /row-level security/);
    await fails(() => q("insert into storage.objects (bucket_id, name) values ('other', $1)", [stayA + '/x.jpg']), /row-level security/);
    assert.equal((await q('select name from storage.objects')).length, 1);
  });
  await as(B, 'authenticated', async () => { assert.equal((await q('select name from storage.objects')).length, 0); });
});

test('guest_cleanup: 30 dní po odchode zmizne väzba, kód, správy; meno sa vynuluje', async () => {
  await as(null, 'service_role', async () => {
    await q("update public.guest_stays set check_out = current_date - 45 where id = $1", [stayA]);
    assert.equal((await q('select public.guest_cleanup(30) as n'))[0].n, 1);
    const s = (await q('select display_name, email, surname_prefix, anonymized_at from public.guest_stays where id = $1', [stayA]))[0];
    assert.equal(s.display_name, null); assert.equal(s.surname_prefix, '***'); assert.ok(s.anonymized_at);
    assert.equal((await q('select * from public.guest_links where stay_id = $1', [stayA])).length, 0);
    assert.equal((await q('select * from public.guest_messages where stay_id = $1', [stayA])).length, 0);
    assert.equal((await q('select text from public.guest_requests where stay_id = $1', [stayA]))[0].text, null);
    assert.equal((await q('select * from public.guest_links where stay_id = $1', [stayB])).length, 1);   // aktívny pobyt nedotknutý
  });
  await as(A, 'authenticated', async () => { assert.equal((await q('select id from public.guest_stays')).length, 0); });
});
