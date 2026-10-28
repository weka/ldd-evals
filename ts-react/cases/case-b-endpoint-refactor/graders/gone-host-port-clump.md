---
# The plant: module functions that each take the host/port/TLS trio and hand back a URL string. After the fix the trio travels as one value, so no function outside a constructor takes the three primitives and returns a string or a URL. A constructor accepting the primitives at the module boundary (the client's constructor, Endpoint.parse) is the legitimate remaining site.
type: regex
pattern: '^(export )?function [a-z][A-Za-z]*\(host: string, port: number, tls: boolean\): (string|URL)'
flags: m
match: count:0
target: files
---
