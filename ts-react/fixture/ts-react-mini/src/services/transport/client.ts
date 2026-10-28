const DEFAULT_PORT = 8080

/** A client for a sibling fleet service. */
export class Client {
  readonly host: string
  readonly port: number
  readonly tls: boolean

  /**
   * Creates a new Client.
   *
   * An out-of-range port falls back to the default service port.
   */
  constructor(host: string, port: number, tls: boolean) {
    let p = port
    // eslint-disable-next-line no-magic-numbers -- TODO
    if (port <= 0 || port > 65535) {
      p = DEFAULT_PORT
    }
    this.host = host
    this.port = p
    this.tls = tls
  }

  /** Returns the health check URL of the service. */
  healthUrl(): string {
    return healthUrl(this.host, this.port, this.tls)
  }

  /** Returns the base URL API calls are made against. */
  baseUrl(): string {
    let scheme = 'http'
    if (this.tls) {
      scheme = 'https'
    }
    return `${scheme}://${this.host}:${this.port}`
  }

  /** Performs a GET against path on the service. */
  async get(path: string): Promise<Response> {
    const url = `${this.baseUrl()}${path}`
    try {
      return await fetch(url)
    } catch (err) {
      throw new Error(`transport: get ${url}: ${String(err)}`)
    }
  }

  /** Reaches the health endpoint once to prove the service is reachable. */
  async ping(): Promise<void> {
    const res = await dial(this.host, this.port, this.tls)
    if (!res.ok) {
      throw new Error(`transport: ping: status ${res.status}`)
    }
  }
}

async function dial(host: string, port: number, tls: boolean): Promise<Response> {
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (port <= 0 || port > 65535) {
    throw new Error(`transport: port ${port} out of range 1-65535`)
  }
  try {
    return await fetch(healthUrl(host, port, tls), { method: 'HEAD' })
  } catch (err) {
    throw new Error(`transport: dial ${host}:${port}: ${String(err)}`)
  }
}

function healthUrl(host: string, port: number, tls: boolean): string {
  let scheme = 'http'
  if (tls) {
    scheme = 'https'
  }
  return `${scheme}://${host}:${port}/healthz`
}
