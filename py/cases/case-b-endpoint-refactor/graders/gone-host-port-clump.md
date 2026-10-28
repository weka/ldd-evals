---
# The plant: module functions (_dial, _health_url) that each take the host/port/TLS trio and hand back a socket or a URL. After the fix the trio travels as one value, so no function outside a constructor takes the three primitives and returns a socket or a string. A constructor accepting the primitives at the package boundary (Client.__init__, Endpoint.parse) is the legitimate remaining site.
type: regex
pattern: '^def _?[a-z][a-z_]*\(host: str, port: int, (\*, )?tls: bool\) -> (socket\.socket|str)'
flags: m
match: count:0
target: files
---
