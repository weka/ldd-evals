/** A storage node. */
export interface Node {
  id: string
  zone: string
  capacity: number
}

/** Picks the nodes that hold a snapshot's replicas. */
export class Placer {
  private readonly log: (msg: string) => void

  /** Creates a new Placer. */
  constructor(log: (msg: string) => void = console.info) {
    this.log = log
  }

  /** Picks a primary node in zone and a secondary node outside it. */
  pick(nodes: Node[], zone: string): [Node | undefined, Node | undefined, string | undefined] {
    const [primary, secondary, err] = pickReplicas(nodes, zone)
    if (err !== undefined) {
      this.log(`placement: ${err}`)
      return [undefined, undefined, err]
    }
    return [primary, secondary, undefined]
  }
}

function pickReplicas(
  nodes: Node[],
  zone: string
): [Node | undefined, Node | undefined, string | undefined] {
  let primary: Node | undefined = undefined
  let secondary: Node | undefined = undefined
  let primaryFound = false
  let secondaryFound = false
  for (const n of nodes) {
    if (!n.zone || n.capacity <= 0) {
      continue
    }
    if (n.zone === zone) {
      if (primaryFound) {
        continue
      }
      primary = n
      primaryFound = true
      continue
    }
    if (secondaryFound) {
      continue
    }
    secondary = n
    secondaryFound = true
  }
  if (!primaryFound || !secondaryFound) {
    return [undefined, undefined, `no placement for zone "${zone}"`]
  }
  return [primary, secondary, undefined]
}
