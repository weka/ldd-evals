---
type: llm
criteria: Every type in the DESIGN PLAN has an R1 score and a rung, or is marked as feature API. Each helper with a score of 4 or more is on rung 2 or 3; the feature's public API types can stay in the feature package. The expansion leaf and the reply-classification leaf are in packages nested under the feature package, or the expansion is on rung 3 and the plan names the existing copy. The probe stays in the feature package.
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
   When the classifier is in a nested package, that package defines the verdict and
   the feature package aliases it, or the classifier returns its own type and the
   feature package maps it. A nested classifier that returns a type defined in the
   feature package is a FAIL: Go rejects that import cycle.
3. The expansion of environment references and the classification of the reply are in
   packages nested under the feature package. In this suite a package below the feature
   one counts, for example `internal/transport/webhookcheck/expand`. A leaf in the feature package itself, or in a
   sibling of it, is a FAIL. Rung 3 also counts for the expansion, but only in `internal/pkg/<domain>`, and
   only when the plan names the copy of the same logic in the existing
   `internal/transport/webhook.go` and says that `transport` imports the shared leaf. Rung 3 for the classification is a FAIL.
4. The probe, the part that does the HTTP and TLS work, is not a helper. It stays in
   the feature package.
   A probe in a nested package is a FAIL.

Quote the line of the block for each check in your answer. Do not reward length.
