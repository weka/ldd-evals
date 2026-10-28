/** Shared string helpers. */

/** Truncates s to at most n characters. */
export function truncate(s: string, n: number): string {
  if (n <= 0) {
    return ''
  }
  if (s.length <= n) {
    return s
  }
  return s.slice(0, n)
}

/** Lowercases s and replaces runs of non-alphanumerics with a dash. */
export function slugify(s: string): string {
  const out: string[] = []
  let dash = false
  for (const c of s.toLowerCase()) {
    if (/[a-z0-9]/.test(c)) {
      out.push(c)
      dash = false
      continue
    }
    if (!dash && out.length > 0) {
      out.push('-')
      dash = true
    }
  }
  return out.join('').replace(/-$/, '')
}

/** Reports whether xs contains x. */
export function contains(xs: string[], x: string): boolean {
  return xs.some((v) => v === x)
}
