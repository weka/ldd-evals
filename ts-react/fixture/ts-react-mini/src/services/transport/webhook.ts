/** The status code of the POST; checkWebhook returns it only for a 2xx answer. */
export interface WebhookResult {
  readonly status: number
}

type Lookup = (name: string) => string | undefined

const DEFAULT_IF_EMPTY = ':-'

/**
 * Reads the endpoint template from the config URL, expands the environment
 * references in it and POSTs to the result. A non-2xx answer is an error.
 */
export async function checkWebhook(configUrl: string, env: Lookup): Promise<WebhookResult> {
  const template = await (await fetch(configUrl)).text()
  const expanded = expandEnv(template.trim(), env)
  const endpoint = trimSlash(expanded)
  const res = await fetch(endpoint, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`transport: post ${endpoint}: status ${res.status}`)
  }
  return { status: res.status }
}

/**
 * Replaces $$, $VAR, ${VAR}, ${VAR:-default} and ${VAR-default}.
 * The ":-" form also applies the default when the variable is empty.
 */
function expandEnv(text: string, env: Lookup): string {
  const ref = /\$(?:(\$)|\{(\w+)(?:(:?-)([^}]*))?\}|(\w+))/g
  return text.replace(ref, (_match: string, ...groups: (string | undefined)[]) => {
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

function trimSlash(s: string): string {
  let end = s.length
  while (end > 0 && s[end - 1] === '/') {
    end -= 1
  }
  return s.slice(0, end)
}
