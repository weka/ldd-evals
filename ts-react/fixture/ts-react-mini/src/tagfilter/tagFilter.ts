import { readTags } from './tagText'

/**
 * Reports whether tags satisfy expr. expr is a comma-separated list of terms,
 * and every term must hold: "key:value" needs a tag with that key and value,
 * "key" needs a tag with that key and any value, and a leading "!" needs no
 * such tag. A key may appear in one term only. A bad filter throws.
 */
export function matchTags(tags: readonly string[], expr: string): boolean {
  return TagFilter.parse(expr).matches(readTags(tags))
}

/** The parsed terms. A value of "" matches any value. */
class TagFilter {
  private readonly want: ReadonlyMap<string, string>
  private readonly deny: ReadonlyMap<string, string>

  private constructor(want: ReadonlyMap<string, string>, deny: ReadonlyMap<string, string>) {
    this.want = want
    this.deny = deny
  }

  static parse(expr: string): TagFilter {
    const want = new Map<string, string>()
    const deny = new Map<string, string>()
    for (const raw of expr.split(',')) {
      const negated = raw.trim().startsWith('!')
      const term = negated ? raw.trim().slice(1) : raw
      const [entry] = readTags([term])
      if (entry === undefined) {
        throw new Error(`tag filter: bad term ${JSON.stringify(raw)}`)
      }
      const [key, value] = entry
      if (want.has(key) || deny.has(key)) {
        throw new Error(`tag filter: key ${JSON.stringify(key)} twice`)
      }
      ;(negated ? deny : want).set(key, value)
    }
    return new TagFilter(want, deny)
  }

  matches(tags: ReadonlyMap<string, string>): boolean {
    for (const [key, value] of this.want) {
      if (!TagFilter.has(tags, key, value)) {
        return false
      }
    }
    for (const [key, value] of this.deny) {
      if (TagFilter.has(tags, key, value)) {
        return false
      }
    }
    return true
  }

  private static has(tags: ReadonlyMap<string, string>, key: string, value: string): boolean {
    const found = tags.get(key)
    return found !== undefined && (value === '' || found === value)
  }
}
