---
type: llm
criteria: The module reads like art — process_heartbeat tells the story in domain sentences, each concept it used to inline now has its own well-named box, and the names make the old comments unnecessary.
focus: { source: files, paths: [internal/services] }
---
Glance at the whole package as a first-time reader (helpers may live in new modules). The single-altitude grader
checks the process_heartbeat body mechanically; you judge whether the result is
something a reviewer would call beautiful rather than merely split up.

PASS only if all five hold, quoting the convincing line for each:

1. **The story.** `process_heartbeat` reads top-down as five or six named
   chapters — parse the heartbeat, find or register the device, apply the
   status transition, notify if it went down, score, persist — and a reader
   can predict each helper's job from its name alone.
2. **Concepts have boxes.** The wire line became a value (`Heartbeat`,
   `HeartbeatLine`) with its own parser; status is a type with named members
   and behavior (`Status`, `is_down`, `score()` or `weight()`), not string
   literals compared inline; the retry/backoff and the tenant/region rules
   live in named helpers or types rather than in the body.
3. **Names are domain words, not mechanics.** No `helper`, `process2`,
   `handle_rest`, `do_tags`, `step3`, `tmp`, `parts`. Method names read as
   verbs on nouns the operator would recognize (`mark_down`, `notify_down`,
   `transition`, `persist`).
4. **Comments earned their place.** The `# parse the line`,
   `# look up or create device`, `# transitions` block markers are gone
   because the calls now say it. Comments that remain state a why or a
   contract, not a what.
5. **Nothing ugly hid elsewhere.** The `while True` retry with its counter,
   the for/else dedupe, the five-tuple return with the error as a value and the
   `time.sleep` backoff did not just move into a helper unchanged. Skim every
   function: a helper that is the old body with a new name is FAIL.

FAIL outright if `while True` with a hand counter, a `# noqa: C901` on
`process_heartbeat`, or a helper named with a number or `helper` survives.
