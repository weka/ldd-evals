/** HTTP status codes the dashboard inspects by name. */
export const HttpStatus = {
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Forbidden: 403,
  NotFound: 404,
  ServiceUnavailable: 503
} as const

/** A response the fleet API answered with a failure status, or a body that did not parse. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestOptions {
  readonly signal?: AbortSignal
  readonly headers?: Readonly<Record<string, string>>
}

type Parse<T> = (raw: unknown) => T

/**
 * The one place the dashboard talks HTTP to the fleet API: every call carries
 * the base path, the JSON headers and the tenant header, and every body goes
 * through the parser its caller names before it is trusted.
 */
export class ApiClient {
  constructor(
    private readonly baseUrl: string = '/api',
    private readonly tenantHeader: string = 'X-Tenant'
  ) {}

  get<T>(path: string, parse: Parse<T>, options: RequestOptions = {}): Promise<T> {
    return this.send('GET', path, undefined, parse, options)
  }

  post<T>(path: string, body: unknown, parse: Parse<T>, options: RequestOptions = {}): Promise<T> {
    return this.send('POST', path, body, parse, options)
  }

  /** Reads a plain-text endpoint (the status line). */
  async text(path: string, options: RequestOptions = {}): Promise<string> {
    const res = await fetch(this.url(path), {
      method: 'GET',
      headers: options.headers,
      signal: options.signal
    })
    if (!res.ok) {
      throw new ApiError(res.status, await res.text())
    }
    return res.text()
  }

  // eslint-disable-next-line max-params -- TODO
  private async send<T>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown,
    parse: Parse<T>,
    options: RequestOptions
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }
    const res = await fetch(this.url(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal
    })
    return parse(await handleApiResponse(res))
  }

  /** The header name a tenant travels under, for callers that build their own requests. */
  tenantHeaderName(): string {
    return this.tenantHeader
  }

  private url(path: string): string {
    return new URL(this.baseUrl + path, window.location.origin).toString()
  }
}

async function handleApiResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  if (res.status === HttpStatus.NoContent) {
    return undefined
  }
  try {
    return (await res.json()) as unknown
  } catch (err) {
    throw new ApiError(res.status, `bad json: ${String(err)}`)
  }
}

export const apiClient = new ApiClient()
