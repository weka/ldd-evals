import { Catalog } from './catalog'
import { Reporter, Sink } from './reporter'

/** Writes the catalog event for name through write, if the catalog text lists the device. */
export function announce(write: (line: string) => void, catalogText: string, name: string): void {
  const sink = new Sink(write)
  const rep = new Reporter(sink, undefined, undefined)
  const d = Catalog.parse(catalogText).find(name)
  if (d !== undefined) {
    rep.record(d.event())
  }
}

/** Writes one line per model: the model and how many devices the catalog lists for it. */
export function summarize(write: (line: string) => void, catalogText: string): void {
  const byModel = Catalog.parse(catalogText).models()
  for (const model of Object.keys(byModel).sort((a, b) => a.localeCompare(b))) {
    write(`${model}: ${byModel[model]?.length ?? 0}\n`)
  }
}
