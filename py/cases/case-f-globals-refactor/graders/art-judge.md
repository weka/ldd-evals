---
type: llm
criteria: The global was pushed up to the composition root and every layer below it now states, in its signature, exactly what it depends on.
focus: { source: files, paths: [internal/env, internal/pool, internal/jobs, svc] }
---
Glance at the four packages top-down, main first. Judge the dependency story,
not lint mechanics (the linter and the git ratchet are graded elsewhere).

PASS only if all four hold, quoting the convincing line for each:

1. **The root reads like a wiring diagram.** `main` loads configuration once
   into a value (`cfg = env.load()` or similar), then hands each collaborator
   the specific value it needs: the pool gets a worker count, the scheduler
   gets a batch size (or a small config dataclass such as `pool.Config`).
   No `env.CONFIG.` read anywhere outside `svc/__main__.py`.
2. **Islands are clean.** `pool` and `jobs` import nothing from `env`. Their
   constructors or `start` functions name the dependency in the signature:
   `pool.start(jobs, workers: int)` or `pool.Pool(Config(workers=n))`. A
   module-level variable that main sets from the outside is a global with
   extra steps: FAIL.
3. **The env module only loads.** No import-time read of the environment, no
   module-level mutable `CONFIG` or `_region`, no `global` statement. `load`
   returns a `Configuration` value (or raises); defaults live next to the key
   they default (`_int_env("NUM_WORKERS", 4)` is fine).
4. **Names carry the meaning the global used to hide.** Parameters are
   `workers`, `batch_size`, `flap_window: timedelta` — not `cfg` passed whole
   into leaf packages, not `n`, not `opts: Any`. Types that turn a bare int
   into a named quantity (`Workers`, `BatchSize`) are a plus, never required.

FAIL outright if any module other than `svc/__main__.py` references
`env.CONFIG`, or if `env.py` still reads `os.environ` at import time.
