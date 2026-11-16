---
# control CTRL.R4.trivial-private-in-io: the trivial private helper stays where it is. The report
# fails only when it proposes to move or export the helper: a placement rule (R4, R7 Q4) or a move
# word on the same line as the symbol. A test note on the helper, such as a missing boundary row
# (R7 Q7), is a correct finding and passes.
type: regex
pattern: 'trimSlash[^\n]{0,200}(\bR4\b|R7\W{0,3}Q4|\bexport|sub-?package|own (module|package|file)|nested package|\bmove)|(\bR4\b|R7\W{0,3}Q4|\bexport|\bmove)[^\n]{0,200}trimSlash'
flags: i
match: not_contains
target: last_message
---
