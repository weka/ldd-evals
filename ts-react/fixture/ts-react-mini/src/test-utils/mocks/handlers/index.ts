import { alertHandlers } from './alerts'
import { deviceHandlers } from './devices'
import { snapshotHandlers } from './snapshots'
import { statusHandlers } from './status'

export const handlers = [
  ...deviceHandlers,
  ...alertHandlers,
  ...snapshotHandlers,
  ...statusHandlers
]
