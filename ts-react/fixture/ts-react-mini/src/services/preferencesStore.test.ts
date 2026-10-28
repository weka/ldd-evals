import { beforeEach, describe, expect, it } from 'vitest'

import { LocalStoragePreferences, MemoryPreferences, storageAvailable } from './preferencesStore'

describe('preferences stores', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('local storage preferences round-trip under the prefix', () => {
    const prefs = new LocalStoragePreferences(window.localStorage)
    prefs.set('retention', '30d')
    expect(prefs.get('retention')).toBe('30d')
    expect(window.localStorage.getItem('fleet.retention')).toBe('30d')
  })

  it('memory preferences forget nothing while the page lives', () => {
    const prefs = new MemoryPreferences()
    expect(prefs.get('endpoint')).toBeUndefined()
    prefs.set('endpoint', 'db:5432')
    expect(prefs.get('endpoint')).toBe('db:5432')
  })

  it('reports an absent storage as unavailable', () => {
    expect(storageAvailable(undefined)).toBe(false)
    expect(storageAvailable(window.localStorage)).toBe(true)
  })
})
