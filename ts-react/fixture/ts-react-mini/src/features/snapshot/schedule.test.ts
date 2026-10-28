import { describe, expect, it } from 'vitest'

import { Window, WindowPlan } from './schedule'

function at(hour: number, minute: number): Date {
  return new Date(Date.UTC(2024, 2, 1, hour, minute))
}

describe('Window.parse', () => {
  it.each([
    ['09:00', '17:00', at(12, 30), at(17, 0), 8 * 60, '09:00-17:00'],
    ['22:00', '02:00', at(1, 15), at(12, 0), 4 * 60, '22:00-02:00'],
    ['03:15', '03:16', at(3, 15), at(3, 16), 1, '03:15-03:16']
  ])('success: %s-%s', (start, end, inside, outside, duration, text) => {
    const w = Window.parse(start, end)
    expect(w.contains(inside)).toBe(true)
    expect(w.contains(outside)).toBe(false)
    expect(w.duration()).toBe(duration)
    expect(w.toString()).toBe(text)
  })

  it.each([
    ['', '17:00'],
    ['24:00', '17:00'],
    ['9', '17:00'],
    ['09:00', '5pm'],
    ['09:00', '09:00']
  ])('error: %j-%j', (start, end) => {
    expect(() => Window.parse(start, end)).toThrow('window')
  })
})

describe('WindowPlan', () => {
  it('copies the windows it is given', () => {
    const night = Window.parse('22:00', '02:00')
    const noon = Window.parse('12:00', '13:00')
    const windows = [night]
    const plan = new WindowPlan(windows)
    windows[0] = noon
    expect(plan.open(at(23, 0))).toBe(true)
    expect(plan.open(at(12, 30))).toBe(false)
    expect(plan.windows()).toEqual([night])
  })

  it('rejects an empty plan', () => {
    expect(() => new WindowPlan([])).toThrow('no windows')
  })
})
