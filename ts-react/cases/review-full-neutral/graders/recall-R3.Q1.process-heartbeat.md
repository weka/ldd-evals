---
# recall: the report names at least one file of this plant by basename.
# ids: R3.Q1.process-heartbeat, R3.Q2.parse-beside-decision, R3.Q3.block-comments, R3.Q4.labeled-continue-dedupe, R3.Q1.nested-blocks, R1.Q1.inline-id-check, R1.Q3.status-string-compare, R1.Q4.minus-one-sentinel, R1.Q5.five-results, R2.Q5.tags-nil-or-slice, R10.Q5.goto-sleep-backoff, R11.Q4.force-flag-in-body, R9.Q4.what-comment-process-heartbeat, R9.critic.provenance-tail, R9.critic.decoder-ring, R9.critic.review-defense, R9.critic.extraction-order, R9.critic.long-private-comment, R2.Q2.validate-device-in-method, R3.Q5.dishonest-names, R3.Q1.normalize-tags, R4.Q6.feature-envy
type: regex
pattern: 'heartbeatFeed\.ts'
match: contains
target: last_message
---
