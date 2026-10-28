/**
 * Where operator preferences are kept.
 *
 * Two production stores implement it: LocalStoragePreferences keeps them across
 * sessions, and MemoryPreferences backs a browser that refuses storage (private
 * mode, a locked-down kiosk) so the dashboard still opens.
 */
export interface PreferencesStore {
  get(key: string): string | undefined
  set(key: string, value: string): void
}

/** Preferences persisted in the browser's local storage under one prefix. */
export class LocalStoragePreferences implements PreferencesStore {
  // The prefix keeps the keys apart from whatever else is served on the origin:
  // the ingress hosts the docs site under the same host name.
  constructor(
    private readonly storage: Storage,
    private readonly prefix: string = 'fleet.'
  ) {}

  get(key: string): string | undefined {
    return this.storage.getItem(this.prefix + key) ?? undefined
  }

  set(key: string, value: string): void {
    this.storage.setItem(this.prefix + key, value)
  }
}

/** Preferences that live as long as the page. */
export class MemoryPreferences implements PreferencesStore {
  private readonly values = new Map<string, string>()

  get(key: string): string | undefined {
    return this.values.get(key)
  }

  set(key: string, value: string): void {
    this.values.set(key, value)
  }
}

/** Reports whether local storage can be used; private windows and kiosks refuse it. */
export function storageAvailable(storage: Storage | undefined): storage is Storage {
  if (storage === undefined) {
    return false
  }
  try {
    storage.setItem('fleet.probe', '1')
    storage.removeItem('fleet.probe')
    return true
  } catch {
    return false
  }
}
