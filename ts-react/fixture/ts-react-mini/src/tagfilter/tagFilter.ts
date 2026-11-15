import { readTags } from './tagText'

const TERM_SEPARATOR = ':'

/**
 * Reports whether tags satisfy expr. expr is a comma-separated list of terms,
 * and every term must hold: "key:value" needs a tag with that key and value,
 * "key" needs a tag with that key and any value, and a leading "!" needs no
 * such tag. A key may appear in one term only. An empty expr matches every tag
 * list. A bad filter throws.
 */
export function matchTags(tags: readonly string[], expr: string): boolean {
  if (expr.trim() === '') {
    return true
  }
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
      const trimmed = raw.trim()
      const negated = trimmed.startsWith('!')
      const term = negated ? trimmed.slice(1) : trimmed
      const sep = term.indexOf(TERM_SEPARATOR)
      const key = (sep < 0 ? term : term.slice(0, sep)).trim().toLowerCase()
      const value = sep < 0 ? '' : term.slice(sep + 1).trim()
      if (key === '' || value.includes(TERM_SEPARATOR)) {
        throw new Error(`tag filter: bad term ${JSON.stringify(raw)}`)
      }
      if (want.has(key) || deny.has(key)) {
        throw new Error(`tag filter: key ${JSON.stringify(key)} twice`)
      }
      ;(negated ? deny : want).set(key, value)
    }
    return new TagFilter(want, deny)
  }

  /** tags is key → values. */
  matches(tags: ReadonlyMap<string, readonly string[]>): boolean {
    for (const [key, value] of this.want) {
      if (!hasValue(tags.get(key), value)) {
        return false
      }
    }
    for (const [key, value] of this.deny) {
      if (hasValue(tags.get(key), value)) {
        return false
      }
    }
    return true
  }
}

function hasValue(values: readonly string[] | undefined, value: string): boolean {
  if (values === undefined) {
    return false
  }
  return value === '' || values.includes(value)
}
