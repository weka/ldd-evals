---
type: llm
criteria: Every type in the DESIGN PLAN has an R1 score and a rung. Each type with a score of 4 or more is on rung 2 or 3. The expansion leaf and the reply-classification leaf are in packages nested under the feature package. The probe stays in the feature package.
focus: last_message
---
The final message holds a DESIGN PLAN with a placement block. Each line of the block
reads: `- <type> — R1 score N → rung K (<package path>) — reason`. The exact words can differ.
Judge the block with these four checks. Score PASS only when all four hold.

1. Every type or helper the plan names has an R1 score and a rung. A type with no score
   or no rung is a FAIL.
2. Each type with an R1 score of 4 or more is on rung 2 or rung 3. A score of 4 or more
   on rung 1 is a FAIL, with or without a written reason.
3. The expansion of environment references and the classification of the reply are in
   packages nested under the feature package. In this suite a package below the feature
   one counts, for example `internal/transport/webhookcheck/expand`. A leaf in the feature package itself, or in a
   sibling of it, is a FAIL.
4. The probe, the part that does the HTTP and TLS work, stays in the feature package.
   A probe in a nested package is a FAIL.

Quote the line of the block for each check in your answer. Do not reward length.
