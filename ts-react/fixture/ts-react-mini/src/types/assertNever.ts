/** Closes an exhaustive switch: the compiler rejects a call unless every case was handled. */
export function assertNever(x: never): never {
  throw new Error(`unexpected value ${String(x)}`)
}
