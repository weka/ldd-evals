import { cacheKey } from '../pages/Heartbeats/heartbeatFeed'
import { type Device } from '../types/device'

const OVERHEAD_FACTOR = 10

/** Cache is a cache of devices. */
export class Cache {
  private readonly items = new Map<string, Device>()
  private readonly ttl = new Map<string, number>()
  private readonly inFlight = new Set<string>()

  /** Creates a Cache whose entries expire after spanMs milliseconds. */
  constructor(private readonly spanMs: number) {}

  /** Stores the device under its tenant and id. */
  put(d: Device): void {
    const key = cacheKey(d.tenant, d.id)
    this.items.set(key, d)
    this.ttl.set(key, performance.now() + this.spanMs)
  }

  /**
   * Returns the cached device and refreshes its expiry.
   *
   * Entries that have expired are dropped on the way.
   */
  get(key: string): Device | undefined {
    const now = performance.now()
    for (const [k, exp] of [...this.ttl]) {
      if (exp < now) {
        this.items.delete(k)
        this.ttl.delete(k)
      }
    }
    const d = this.items.get(key)
    if (d !== undefined) {
      this.ttl.set(key, now + this.spanMs)
    }
    return d
  }

  /**
   * Loads the device behind key once, even when two callers ask at the same time.
   */
  async refresh(key: string, load: () => Promise<Device>): Promise<void> {
    if (this.inFlight.has(key)) {
      return
    }
    const d = await load()
    this.inFlight.add(key)
    this.put(d)
    this.inFlight.delete(key)
  }

  /** Returns every cached device. */
  all(): Map<string, Device> {
    return this.items
  }

  /** Returns the number of cached devices. */
  count(): number {
    return this.items.size
  }

  /** Estimates the memory the cache holds, in bytes. */
  footprint(): number {
    let size = this.items.size
    for (const d of this.items.values()) {
      size += d.id.length + d.tenant.length + d.version.length
    }
    size = size * OVERHEAD_FACTOR // rough per-entry overhead
    // eslint-disable-next-line no-magic-numbers -- TODO
    size += this.ttl.size * 24
    return size
  }

  toString(): string {
    return describe(this.items, this.ttl)
  }
}

function describe(items: Map<string, Device>, ttl: Map<string, number>): string {
  return `cache: ${items.size} items, ${ttl.size} expiring`
}
