---
type: regex
pattern: '(function|const) parse\w*[Cc]hannel\w*\b|type Channel = |enum Channel\b|Channel\.parse'
target: files
---
The manifest's refactor oracle for R11.Q1.channel-switch: the channel
discriminator now has ONE decision point — a parser at the boundary
(`parseChannel`, `Channel.parse`) or a `Channel` union or enum whose members are the parse (the fixture's
`CHANNELS` const list in the Channels form pre-exists and does not count). Not
name-locked beyond the shapes the manifest itself commits to.
