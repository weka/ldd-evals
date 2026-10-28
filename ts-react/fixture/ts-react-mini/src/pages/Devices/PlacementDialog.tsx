import { useState } from 'react'

import { type Device } from '../../types/device'
import { type Node, Placer } from './placement/picker'
import styles from './PlacementDialog.module.scss'

interface Props {
  readonly device: Device
  readonly nodes: readonly Node[]
  readonly onClose: () => void
}

/** Shows where a device's snapshot replicas would land, given the zone its region tag names. */
export function PlacementDialog({ device, nodes, onClose }: Readonly<Props>) {
  const [zone, setZone] = useState(zoneOfDevice(device))
  const [primary, secondary, err] = new Placer(() => undefined).pick([...nodes], zone)
  return (
    <dialog
      open
      className={styles.dialog}
      aria-labelledby='placement-title'
    >
      <h2 id='placement-title'>Place replicas for {device.id}</h2>
      <label htmlFor='placement-zone'>Zone</label>
      <input
        id='placement-zone'
        value={zone}
        onChange={(e) => setZone(e.target.value)}
      />
      {err === undefined ? (
        <p>
          primary <strong>{primary?.id}</strong>, secondary <strong>{secondary?.id}</strong>
        </p>
      ) : (
        <p
          role='alert'
          className={styles.error}
        >
          {err}
        </p>
      )}
      <button
        type='button'
        onClick={onClose}
      >
        Close
      </button>
    </dialog>
  )
}

function zoneOfDevice(d: Device): string {
  const tag = d.tags.find((t) => t.startsWith('region:'))
  return tag === undefined ? '' : tag.slice('region:'.length)
}
