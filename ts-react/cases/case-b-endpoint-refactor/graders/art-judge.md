---
type: llm
criteria: The three values that always travel together (host, port, TLS) became one named thing that owns its own questions, and the client reads as a story of what it does, not how it assembles strings.
focus: { source: files, paths: [src/services/transport] }
---
Glance at the folder as a first-time reader (the concept may now live in its own module). Judge shape and naming; tests and
lint are graded elsewhere.

PASS only if all four hold, quoting the convincing line for each:

1. **One box.** A named type such as `Endpoint`, `Address` or `Target` holds
   host, port and the TLS flag, is built through a constructor that owns the
   port-range rule once (a `parse` function, a static factory or a constructor
   that throws), and answers its own questions: the scheme (`scheme`), the URL
   for a path (`url(path)`), the health URL, the base URL. Module functions
   still taking `(host: string, port: number, tls: boolean)` are FAIL. Folding
   the fields into client methods that still branch on `this.tls` for the
   scheme in each method is a dedupe, not a box: FAIL.
2. **The scheme is decided once.** `'https'` and `'http'` appear together in
   exactly one place, ideally as a small union type or a getter on the
   endpoint. Two `if (tls) scheme = 'https'` blocks anywhere is FAIL.
3. **Names speak intent.** `get`, `ping`, `healthUrl` bodies read as
   sentences — `this.endpoint.url(path)`, `this.endpoint.base` — with no
   template-literal `${scheme}://${host}:${port}` assembly inside them.
4. **No leftover ceremony.** The port-range check appears once (in the
   constructor); nothing re-validates a port that cannot be invalid; JSDoc
   that restated names is gone or now states a contract.
