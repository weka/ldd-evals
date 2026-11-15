const SEPARATORS = /[:=]/

/** Reads device tags as key → values; a bare key has the value "". An unreadable tag is left out. */
export function readTags(tags: readonly string[]): ReadonlyMap<string, readonly string[]> {
  const read = new Map<string, string[]>()
  for (const tag of tags) {
    const parsed = splitTag(tag)
    if (parsed) {
      const [key, value] = parsed
      read.set(key, [...(read.get(key) ?? []), value])
    }
  }
  return read
}

/**
 * Reads "key:value", "key=value" or a bare "key". The key is compared without
 * case; a value with a second separator is refused.
 */
function splitTag(tag: string): readonly [string, string] | undefined {
  const text = tag.trim()
  const sep = text.search(SEPARATORS)
  const rawKey = sep < 0 ? text : text.slice(0, sep)
  const value = sep < 0 ? '' : text.slice(sep + 1).trim()
  const key = rawKey.trim().toLowerCase()
  if (key === '' || SEPARATORS.test(value)) {
    return undefined
  }
  return [key, value]
}
