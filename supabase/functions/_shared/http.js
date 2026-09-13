import { env } from './env.js';
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-webhook-secret' } });
}
export function cors(req) { return req.method === 'OPTIONS' ? new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-webhook-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } }) : null; }
// Webhooky z DB a cron volajú funkciu s hlavičkou x-webhook-secret = WEBHOOK_SECRET (funkcia beží bez overenia JWT).
export function checkWebhookSecret(req) {
  const want = env('WEBHOOK_SECRET');
  if (!want) return false;
  const got = req.headers.get('x-webhook-secret') || '';
  if (got.length !== want.length) return false;
  let diff = 0; for (let i = 0; i < want.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}
export async function readJson(req) { try { return await req.json(); } catch { return null; } }
