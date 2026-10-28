const MAX_TENANT_LEN = 32
const TENANT_CHARS = /^[a-z0-9-]+$/

/**
 * Identifies the owner of a device fleet.
 *
 * Every Tenant is validated as it is built, so a value in circulation is already
 * non-empty, lowercase and at most 32 characters long; nothing downstream needs
 * to check it again. parseTenant is the boundary spelling.
 */
export type Tenant = string & { readonly __brand: 'Tenant' }

/** Validates a raw tenant identifier once, at the boundary. */
export function parseTenant(raw: string): Tenant {
  if (!raw) {
    throw new Error('tenant: empty')
  }
  if (raw.length > MAX_TENANT_LEN) {
    throw new Error(`tenant "${raw}": longer than ${MAX_TENANT_LEN} characters`)
  }
  if (!TENANT_CHARS.test(raw)) {
    throw new Error(`tenant "${raw}": want lowercase letters, digits, or '-'`)
  }
  return raw as Tenant
}
