import { ReportEvent } from './reporter'

/** A device known to the catalog. */
export class CatalogDevice {
  constructor(
    readonly name: string,
    readonly model: string
  ) {}

  /** Returns the catalog event for the device. */
  event(): ReportEvent {
    return new ReportEvent('catalog', this.name + '/' + this.model)
  }
}

/** A catalog of devices. */
export class Catalog {
  private readonly devices: readonly CatalogDevice[]

  /** Creates a Catalog holding its own copy of devices. */
  constructor(devices: readonly CatalogDevice[]) {
    this.devices = [...devices]
  }

  /** Groups the catalog's device names by model. */
  models(): Record<string, string[]> {
    const byModel: Record<string, string[]> = {}
    for (const d of this.devices) {
      const names = byModel[d.model] ?? []
      names.push(d.name)
      byModel[d.model] = names
    }
    return byModel
  }

  /** Finds the device by name. */
  find(name: string): CatalogDevice | undefined {
    return this.devices.find((d) => d.name === name)
  }

  /** Builds a Catalog from catalog text, one `name/model` device per line. */
  static parse(text: string): Catalog {
    const devices: CatalogDevice[] = []
    for (const line of text.split('\n')) {
      const d = parseDevice(line)
      if (d !== null) {
        devices.push(d)
      }
    }
    return new Catalog(devices)
  }
}

/**
 * Parses one catalog line, written as `name/model`.
 *
 * A blank line is not a device; it parses to null so callers can skip it.
 */
export function parseDevice(line: string): CatalogDevice | null {
  const text = line.trim()
  if (!text) {
    return null
  }
  const sep = text.indexOf('/')
  const name = sep < 0 ? '' : text.slice(0, sep)
  const model = sep < 0 ? '' : text.slice(sep + 1)
  if (sep < 0 || !name || !model) {
    return null
  }
  return new CatalogDevice(name, model)
}
