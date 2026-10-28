---
type: llm
criteria: src/main.tsx is the only reader of configuration and reads as load → construct leaves → construct providers → render, with no business logic (R3 altitude at the composition root; R8 dependency rejection completed).
focus: { source: file, path: src/main.tsx }
---
PASS only if ALL hold in the FOCUS file:
1. Configuration is obtained once at the top of the module (a call such as
   `const config = loadConfig()`) and then individual values are handed to
   constructors, providers or props — no module reads a global elsewhere from
   this file's point of view (no `CONFIG.x` anywhere).
2. The body reads as a story at one altitude: load config → build leaf values
   (concurrency, batch size, flap window, the API client) → build the query
   client / providers / router that take them → render. Every step is a named
   call or an assignment of one.
3. No business logic or parsing lives in the file (no string splitting, no
   status comparisons, no retry loops); small wiring helpers (the root
   element, the preferences store choice) are fine.
FAIL if the file still reads `CONFIG`, or threads the whole configuration
object into feature modules instead of the values they need.
