/**
 * Where each tool's Worker answers.
 *
 * One app now talks to three origins, where each tool's own page talked to one,
 * so a single `VITE_API_BASE_URL` no longer says enough. Each tool reads its own
 * variable, named from its id so adding a fourth needs no edit here.
 *
 * Empty in development: the console's Vite server proxies `/<tool>/api` to that
 * tool's Worker on the port `ports.json` gives it, so a relative path is right
 * and no origin is baked in. Production sets one variable per tool at build
 * time.
 */
export function apiBase(id: string): string {
  const configured = import.meta.env[`VITE_${id.toUpperCase()}_API_URL`];
  const trimmed = typeof configured === 'string' ? configured.trim() : '';
  return trimmed === '' ? `/${id}` : trimmed.replace(/\/$/, '');
}
