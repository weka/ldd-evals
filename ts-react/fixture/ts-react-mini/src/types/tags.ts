export function normalizeTags(tags: string[]): string[] {
  const out: string[] = []
  for (const raw of tags) {
    const t = raw.trim()
    if (!t || out.includes(t)) {
      continue
    }
    // eslint-disable-next-line no-magic-numbers -- TODO
    if (t.startsWith('region:') && !isRegionCode(t.slice(7))) {
      continue
    }
    out.push(t)
  }
  return out
}

function isRegionCode(code: string): boolean {
  return code === 'eu' || code === 'us' || code === 'ap'
}
