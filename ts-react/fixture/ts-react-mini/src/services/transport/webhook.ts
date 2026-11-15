/** The status code of the POST; checkWebhook returns it only for a 2xx answer. */
export interface WebhookResult {
  readonly status: number
}

type Lookup = (name: string) => string | undefined

const DEFAULT_IF_EMPTY = ':-'

/**
 * Reads the endpoint template from the config URL, expands the environment
 * references in it and POSTs to the result. A non-2xx answer is an error, and so
 * is a template with an unclosed "${".
 */
export async function checkWebhook(configUrl: string, env: Lookup): Promise<WebhookResult> {
  const template = await (await fetch(configUrl)).text()
  const endpoint = trimSlash(EnvTemplate.parse(template.trim()).expand(env))
  const res = await fetch(endpoint, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`transport: post ${endpoint}: status ${res.status}`)
  }
  return { status: res.status }
}

/**
 * A text with references to environment variables: $$, $VAR, ${VAR},
 * ${VAR:-default} and ${VAR-default}. The ":-" form also applies the default
 * when the variable is empty.
 */
class EnvTemplate {
  private readonly text: string

  private constructor(text: string) {
    this.text = text
  }

  /** Refuses a "${" that has no closing "}". */
  static parse(text: string): EnvTemplate {
    let rest = text
    let start = rest.indexOf('${')
    while (start >= 0) {
      const closing = rest.indexOf('}', start)
      if (closing < 0) {
        throw new Error(`unclosed reference ${JSON.stringify(rest.slice(start))}`)
      }
      rest = rest.slice(closing + 1)
      start = rest.indexOf('${')
    }
    return new EnvTemplate(text)
  }

  /** Replaces each reference with its value from env. */
  expand(env: Lookup): string {
    const ref = /\$(?:(\$)|\{(\w+)(?:(:?-)([^}]*))?\}|(\w+))/g
    return this.text.replace(ref, (_match: string, ...groups: (string | undefined)[]) => {
      const [escaped, braced, op, fallback, bare] = groups
      if (escaped) {
        return '$'
      }
      let value = env(braced ?? bare ?? '')
      if (op === DEFAULT_IF_EMPTY && value === '') {
        value = undefined
      }
      if (value === undefined && op) {
        return fallback ?? ''
      }
      return value ?? ''
    })
  }
}

function trimSlash(s: string): string {
  let end = s.length
  while (end > 0 && s[end - 1] === '/') {
    end -= 1
  }
  return s.slice(0, end)
}
