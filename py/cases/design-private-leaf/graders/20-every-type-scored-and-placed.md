---
type: llm
criteria: Every type in the DESIGN PLAN has an R1 score and a rung, or is marked as feature API. Each helper with a score of 4 or more is on rung 2 or 3; the feature's public API types can stay in the feature package. The expansion leaf is in a leaf sub-package folder (with `__init__.py`) nested in the feature package, or on rung 3 in a top-level package when the plan names the existing copy. The reply classification is in such a sub-package, or is the verdict's public constructor beside the verdict. The probe stays in the feature package.
focus: last_message
---
The final message holds a DESIGN PLAN with a placement block. Each line of the block
reads: `- <type> — R1 score N → rung K (<package path>) — reason`. The exact words can differ.
A type of the feature's public API can read `→ feature API (<package path>)` in place of a rung.
Judge the block with these four checks. Score PASS only when all four hold.

1. Every type or helper the plan names has an R1 score and a rung. A type of the
   feature's public API can read `→ feature API (<package path>)` in place of a rung.
   A type with no score, or with neither a rung nor `feature API`, is a FAIL. The
   public entry function needs no line: the spec makes it the feature's API.
2. Each helper or helper type with an R1 score of 4 or more is on rung 2 or rung 3. A
   score of 4 or more on rung 1 is a FAIL, with or without a written reason. The types
   of the feature's public API are not helpers: the public entry, the verdict it
   returns and the verdict's values. They can stay in the feature package at any score.
   A function that builds and returns the verdict from the reply is the verdict's
   constructor. It is part of the API, not a helper. It stays beside the verdict and is
   public. A private constructor with a score of 4 or more is a FAIL.
3. The expansion of environment references and the classification of the reply are each
   in a leaf sub-package folder nested in the feature package (rung 2). The classification of the reply can instead be the verdict's public constructor, beside the verdict (check 2). The feature package is the new package below `transport` named in the
   spec. A leaf sub-package is a folder with `__init__.py` inside it, for example
   `transport/<feature>/expand_env/__init__.py`. A leaf folder outside the feature package,
   for example `transport/expand_env/__init__.py`, is a FAIL on rung 2. A plain module file,
   for example `transport/<feature>/expand_env.py`, is a FAIL. A leaf in the feature's own
   entry module, or in the module that does the I/O (the probe's module, whatever its name),
   is a FAIL. Example: `<feature>/probe.py` holds both the probe and `expand_env`; that is
   a FAIL. Rung 3 also counts for the expansion, but only in a package directly under `internal/`, a sibling of `transport`, and
   only when the plan names the copy of the same logic in the existing
   `internal/transport/webhook.py` and says that `transport` imports the shared leaf. Rung 3 for the classification is a FAIL.
4. The probe, the part that does the HTTP and TLS work, is not a helper. It stays in the
   feature package: in the entry module, or in a role module (a `.py` file) inside the
   feature package (R5 vertical slice). A probe in a leaf sub-package for pure leaves, or
   in a module outside the feature package, is a FAIL.

Quote the line of the block for each check in your answer. Do not reward length.
