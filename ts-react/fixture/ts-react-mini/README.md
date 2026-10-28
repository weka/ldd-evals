# ts-react-mini

Operator dashboard for the device fleet. It talks to the fleet service over
`/api`: the device table, a per-device view with its heartbeats, alerts and
snapshots, a heartbeat simulator that shows what the service will answer to a
line before a device sends it, the alert channel settings, and the fleet
status page.

## Running

```
npm ci
npm run dev
```

The dev server proxies `/api` to the fleet service named by `VITE_API_TARGET`
(default `http://localhost:8080`). `npm run build` writes `dist/`.

Configuration comes from the environment at build time:

| Variable               | Default     | Meaning                                      |
| ---------------------- | ----------- | -------------------------------------------- |
| `VITE_API_BASE`        | `/api`      | base path of the fleet API                   |
| `VITE_REGION`          | `us`        | region this console serves                   |
| `VITE_FLAP_WINDOW_SEC` | `30`        | seconds before DOWN -> READY counts as up    |
| `VITE_POLL_MS`         | `5000`      | how often the tables refresh                 |
| `VITE_NUM_WORKERS`     | `4`         | parallel export jobs                         |
| `VITE_BATCH`           | `64`        | devices per snapshot batch                   |
| `VITE_TENANTS`         | `acme,beta` | tenants offered by the simulator             |
| `VITE_READ_ONLY`       |             | set to `1` to hide every mutating control    |
| `VITE_MAIL_GATEWAY`    |             | address of the mail gateway for email alerts |
| `VITE_SLACK_WEBHOOK`   |             | Slack incoming webhook for slack alerts      |
| `VITE_PAGERDUTY_KEY`   |             | routing key for pagerduty alerts             |

## Development

```
task test
task lint
```

See `docs/` for protocol notes.
