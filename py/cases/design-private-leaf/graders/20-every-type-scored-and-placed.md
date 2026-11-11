---
type: llm
criteria: Every type in the DESIGN PLAN has an R1 score and a rung. Each type with a score of 4 or more is on rung 2 or 3. The expansion of environment references and the classification of the reply are each
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
