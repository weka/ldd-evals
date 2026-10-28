import { describe, expect, it } from 'vitest'

import { Catalog, CatalogDevice } from './catalog'
import { Reporter, ReportEvent, Sink } from './reporter'
import { announce, summarize } from './wire'

function fixedClock(): Date {
  return new Date('2024-03-01T12:00:00Z')
}

function buffer(): [string[], (line: string) => void] {
  const lines: string[] = []
  return [lines, (line) => lines.push(line)]
}

describe('Reporter', () => {
  it('stamps with the clock', () => {
    const [lines, write] = buffer()
    const rep = new Reporter(new Sink(write), fixedClock, { flushEveryMs: 60_000 })
    rep.record(new ReportEvent('boot', 'dev-1'))
    expect(lines).toEqual(['2024-03-01T12:00:00Z boot dev-1\n'])
    expect(rep.flushInterval()).toBe(60_000)
  })

  it('defaults when unset', () => {
    const [lines, write] = buffer()
    const rep = new Reporter(new Sink(write), undefined, undefined)
    rep.record(new ReportEvent('boot', 'dev-1'))
    expect(lines).toHaveLength(1)
    expect(rep.flushInterval()).toBe(0)
  })

  it('drops events without a sink', () => {
    const rep = new Reporter(undefined, fixedClock, undefined)
    rep.record(new ReportEvent('boot', 'dev-1'))
    expect(rep.sink).toBeUndefined()
  })

  it('stamps an event', () => {
    expect(new ReportEvent('boot', '').at(fixedClock()).time()).toEqual(fixedClock())
  })
})

describe('Catalog', () => {
  it('finds a known device', () => {
    const cat = new Catalog([new CatalogDevice('dev-1', 'm1'), new CatalogDevice('dev-2', 'm2')])
    expect(cat.find('dev-2')?.model).toBe('m2')
  })

  it('does not find an unknown device', () => {
    expect(new Catalog([new CatalogDevice('dev-1', 'm1')]).find('dev-9')).toBeUndefined()
  })

  it('parses text, skipping blank lines', () => {
    expect(Catalog.parse('dev-1/m1\n\ndev-2/m2\n').find('dev-2')).toEqual(
      new CatalogDevice('dev-2', 'm2')
    )
  })
})

describe('wire', () => {
  it('summarize counts devices per model', () => {
    const [lines, write] = buffer()
    summarize(write, 'dev-1/m2\ndev-2/m1\ndev-3/m2\n')
    expect(lines.join('')).toBe('m1: 1\nm2: 2\n')
  })

  it('announce writes known devices only', () => {
    const [lines, write] = buffer()
    const text = 'dev-1/m1\n'
    announce(write, text, 'dev-1')
    announce(write, text, 'dev-9')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/ catalog dev-1\/m1\n$/)
  })
})
