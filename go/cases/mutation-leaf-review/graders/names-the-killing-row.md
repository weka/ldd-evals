---
type: regex
pattern: 'deviceid(_test)?\.go:[0-9]+.{0,500}\b(64|maxLen)\b'
flags: s
match: contains
target: last_message
---
# Q7's violation line asks for "the row that would kill it": for deviceid that
# is an input of exactly maxLen (64) characters, named by either spelling.
