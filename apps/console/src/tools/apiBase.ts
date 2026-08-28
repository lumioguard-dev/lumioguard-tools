/**
 * One origin PER TOOL, from a variable named after the tool's id so a fourth
 * needs no edit here. Empty in development, where Vite proxies `/<tool>/api` to
 * that Worker's port and a relative path is right.
 */
export function apiBase(id: string): string {
  const configured = import.meta.env[`VITE_${id.toUpperCase()}_API_URL`];
  const trimmed = typeof configured === 'string' ? configured.trim() : '';
  return trimmed === '' ? `/${id}` : trimmed.replace(/\/$/, '');
}
