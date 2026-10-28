/** One thing an instance may do. */
export enum Permission {
  Read = 'read',
  Write = 'write',
  Admin = 'admin'
}

/** The permissions an instance holds. */
export class Grants {
  private readonly perms: Permission[]

  constructor(perms: Permission[]) {
    this.perms = perms
  }

  /** Returns all permissions. */
  all(): Permission[] {
    return this.perms
  }

  /** Returns whether the grants have the permission. */
  has(p: Permission): boolean {
    return this.perms.includes(p)
  }
}

/** Number of replicas. */
export class ReplicaCount {
  constructor(private readonly n: number) {}

  /** Returns the count as a plain number. */
  asNumber(): number {
    return this.n
  }
}

/** A name. */
export class Name {
  constructor(private readonly value: string) {}

  toString(): string {
    return this.value
  }
}
