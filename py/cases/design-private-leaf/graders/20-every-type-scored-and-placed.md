---
type: llm
criteria: Every type in the DESIGN PLAN has an R1 score and a rung. Each type with a score of 4 or more is on rung 2 or 3. The expansion leaf and the reply-classification leaf are each in a leaf sub-package folder (with `__init__.py`) nested in the feature package, or on rung 3 in a top-level package. The probe stays in the feature package.
focus: last_message
---
The final message holds a DESIGN PLAN with a placement block. Each line of the block
reads: `- <type> — R1 score N → rung K (<package path>) — reason`. The exact words can differ.
Judge the block with these four checks. Score PASS only when all four hold.

1. Every type or helper the plan names has an R1 score and a rung. A type with no score
   or no rung is a FAIL.
2. Each type with an R1 score of 4 or more is on rung 2 or rung 3. A score of 4 or more
   on rung 1 is a FAIL, with or without a written reason.
3. The expansion of environment references and the classification of the reply are each
   in a leaf sub-package folder nested in the feature package (rung 2), or on rung 3 in a
   top-level package. The feature package is the new package below `transport` named in the
   spec. A leaf sub-package is a folder with `__init__.py` inside it, for example
   `transport/<feature>/expand_env/__init__.py`. A leaf folder outside the feature package,
   for example `transport/expand_env/__init__.py`, is a FAIL on rung 2. A plain module file,
   for example `transport/<feature>/expand_env.py`, is a FAIL. A leaf in the feature's own
   entry module, or in the module that does the I/O (the probe's module, whatever its name),
   is a FAIL. Example: `<feature>/probe.py` holds both the probe and `expand_env`; that is
   a FAIL.
4. The probe, the part that does the HTTP and TLS work, is not a helper. It stays in the
   feature package: in the entry module, or in a role module (a `.py` file) inside the
   feature package (R5 vertical slice). A probe in a leaf sub-package for pure leaves, or
   in a module outside the feature package, is a FAIL.

Quote the line of the block for each check in your answer. Do not reward length.
