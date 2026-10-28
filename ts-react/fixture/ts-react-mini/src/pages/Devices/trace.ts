/**
 * Attaches the operator's trace id as the X-Trace header; an empty id adds none.
 * The service echoes the id on every response, so its log lines can be joined later.
 * The id is opaque to the dashboard, so it stays a plain string.
 */
export function withTrace(
  headers: Record<string, string>,
  traceId: string
): Record<string, string> {
  if (!traceId) {
    return headers
  }
  return { ...headers, 'X-Trace': traceId }
}

/** Reads the URL's `trace` parameter; '' when the URL has none, which withTrace sends as no header. */
export function traceFromSearch(search: URLSearchParams): string {
  return search.get('trace') ?? ''
}
