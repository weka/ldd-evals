---
type: llm
criteria: The global was pushed up to the composition root and every layer below it now states, in its signature, exactly what it depends on.
focus: { source: files, paths: [src/config, src/export, src/hooks, src] }
---
Glance at the four places top-down, `main.tsx` first. Judge the dependency
story, not lint mechanics (the linter and the git ratchet are graded elsewhere).

PASS only if all four hold, quoting the convincing line for each:

1. **The root reads like a wiring diagram.** `main.tsx` loads configuration
   once into a value (`const config = loadConfig()` or similar), then hands
   each collaborator the specific value it needs: the export workers get a
   concurrency, the snapshot scheduler gets a batch size (or a small config
   object of its own), through props, a provider or a parameter. No `CONFIG.`
   read anywhere outside `src/main.tsx` and the config module.
2. **Islands are clean.** `src/export/workers.ts` and
   `src/hooks/useSnapshotScheduler.ts` import nothing from `config/env`. Their
   functions or hooks name the dependency in the signature:
   `start(jobs, { concurrency })`, `useSnapshotScheduler(batchSize)`. A
   module-level variable that `main.tsx` sets from the outside is a global with
   extra steps: FAIL.
3. **The config module only loads.** No `import.meta.env` read at module
   scope, no exported mutable `CONFIG` or `region` built at import, no `let`
   rebound later. `loadConfig` returns a value (or throws); defaults live next
   to the key they default.
4. **Names carry the meaning the global used to hide.** Parameters are
   `concurrency`, `batchSize`, `flapWindowSec` — not `config` passed whole
   into leaf modules, not `n`, not `opts: unknown`. Branded types that turn a
   bare number into a named quantity (`Workers`, `BatchSize`) are a plus,
   never required.

FAIL outright if any module other than `src/main.tsx` references `CONFIG`
from the config module, or if `env.ts` still reads `import.meta.env` at import
time.
