---
type: file_exists
path: 'src/*/*[sS][mM][sS]*'
---
The sms behavior landed in its own module or folder one level under src/ — a
feature slice (`src/features/sms/`, Option A) or a module in an existing folder
(`src/services/smsChannel.ts`). The glob tolerates the folder name but not
depth: filepath.Glob has no `**`, so `src/features/alerts/sms/sms.ts` would fail
here while postcheck.sh's `find`-based NOTE still reports it. The obvious
`src/*/channel*.ts` is useless when a channel module pre-exists, so the sms
module is the assertable new-type file. This is the grader most likely to
produce a false failure — read it together with postcheck's placement NOTE.
