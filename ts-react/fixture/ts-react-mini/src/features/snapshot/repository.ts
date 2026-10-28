import { type Snapshot } from '../../types/snapshot'
import { isRecord } from '../../types/typeGuards'

/** Stores one record per snapshot under a key prefix in a Storage. */
export class SnapshotRepository {
  private readonly prefix: string

  /** Opens the store under prefix in storage. */
  constructor(
    private readonly storage: Storage,
    prefix: string
  ) {
    if (!prefix) {
      throw new Error('snapshot repository: empty prefix')
    }
    this.prefix = prefix.endsWith('/') ? prefix : prefix + '/'
  }

  /** Writes the snapshot, replacing any earlier record with the same id. */
  put(sn: Snapshot): void {
    const data = { id: sn.id, created_at: sn.createdAt.toISOString(), device_id: sn.deviceId }
    try {
      this.storage.setItem(this.key(sn.id), JSON.stringify(data))
    } catch (err) {
      throw new Error(`snapshot repository: write ${sn.id}: ${String(err)}`)
    }
  }

  /**
   * Removes the snapshot with the given id.
   *
   * Deleting an unknown id is not an error: a prune that races a manual cleanup
   * should still succeed.
   */
  delete(snapshotId: string): void {
    this.storage.removeItem(this.key(snapshotId))
  }

  /** Returns the snapshots of deviceId, oldest first. */
  listFor(deviceId: string): Snapshot[] {
    const names: string[] = []
    for (let i = 0; i < this.storage.length; i += 1) {
      const name = this.storage.key(i)
      if (name !== null && name.startsWith(this.prefix)) {
        names.push(name)
      }
    }
    if (names.length === 0) {
      return []
    }
    const out: Snapshot[] = []
    for (const name of names) {
      const sn = this.read(name)
      if (sn.deviceId === deviceId) {
        out.push(sn)
      }
    }
    out.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    return out
  }

  private read(name: string): Snapshot {
    const text = this.storage.getItem(name)
    let data: unknown
    try {
      data = JSON.parse(text ?? '')
    } catch (err) {
      throw new Error(`snapshot repository: decode ${name}: ${String(err)}`)
    }
    if (
      !isRecord(data) ||
      typeof data['id'] !== 'string' ||
      typeof data['created_at'] !== 'string' ||
      typeof data['device_id'] !== 'string'
    ) {
      throw new Error(`snapshot repository: decode ${name}: not a snapshot`)
    }
    return { id: data['id'], createdAt: new Date(data['created_at']), deviceId: data['device_id'] }
  }

  private key(snapshotId: string): string {
    return this.prefix + encodeURIComponent(snapshotId)
  }
}
