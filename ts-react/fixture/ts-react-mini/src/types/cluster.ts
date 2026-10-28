/** The cluster a device is enrolled in, as its cluster: tag names it. */
export interface Cluster {
  readonly id: string
  readonly name: string
}

const CLUSTER_TAG = 'cluster:'

/** Reads the cluster from a device's tags; a device without a cluster: tag is unenrolled. */
export function clusterFromTags(tags: readonly string[]): Cluster | null {
  const tag = tags.find((t) => t.startsWith(CLUSTER_TAG))
  if (tag === undefined) {
    return null
  }
  const id = tag.slice(CLUSTER_TAG.length)
  return { id, name: id.replace(/-/g, ' ') }
}
