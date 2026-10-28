---
type: file_exists
path: 'internal/*/*[sS][mM][sS]*.py'
---
The sms behavior landed in its own module one level under internal/ — a feature
slice (`internal/sms/sms.py`, Option A) or a module in an existing package
(`internal/alerting/sms_channel.py`). The glob tolerates the package name but
not depth: filepath.Glob has no `**`, so `internal/alerting/sms/sms.py` would
fail here while postcheck.sh's `find`-based NOTE still reports it. The plan
asked for "file_exists for the new type in the expected package"; the obvious
`internal/*/channel*.py` is useless because models/channel.py pre-exists, so the
sms module is the assertable new-type file. This is the grader most likely to
produce a false failure — read it together with postcheck's placement NOTE.
