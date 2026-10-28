---
type: regex
pattern: 'def parse\w*channel\w*\(|class Channel\((str, )?Enum\)|class Channel\(StrEnum\)'
target: files
---
The manifest's refactor oracle for R11.Q1.channel-switch: the channel
discriminator now has ONE decision point — a parser at the boundary
(`parse_channel`, `Channel.parse`) or a `Channel` enum whose constructor is the
parse. Not name-locked beyond the shapes the manifest itself commits to.
