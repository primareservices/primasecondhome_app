// Premenné prostredia v Deno (edge) aj v Node (testy).
export function env(name, fallback = '') {
  try { if (globalThis.Deno && Deno.env) return Deno.env.get(name) ?? fallback; } catch {}
  try { if (globalThis.process && process.env) return process.env[name] ?? fallback; } catch {}
  return fallback;
}
