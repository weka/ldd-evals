import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { Notifier } from '../../services/notify'
import { server } from '../../test-utils/mocks/server'
import { AuditLog, FeedStore, ScratchFleet } from './heartbeatFeed'
import { simulateRequest } from './simulateRequest'

// The exchange recorded against the fleet service: tenant ("-" sends no header),
// force, the body line, the status and the exact body the service answered.
// The simulator must reproduce every row in sequence, byte for byte.
const RECORDED = `
1	acme		dev-1|READY|1.0	200	{"id":"dev-1","score":100,"changed":true,"tags":[]}
2	acme		dev-1|READY|1.0	200	{"id":"dev-1","score":100,"changed":false,"tags":[]}
3	acme		dev-1|ready|1.0	200	{"id":"dev-1","score":100,"changed":false,"tags":[]}
4	acme		dev-1|READY|1.1	200	{"id":"dev-1","score":100,"changed":true,"tags":[]}
5	acme		dev-1|DEGRADED|1.1	200	{"id":"dev-1","score":50,"changed":true,"tags":[]}
6	acme		dev-1|BOOTING|1.1	200	{"id":"dev-1","score":0,"changed":true,"tags":[]}
7	acme		dev-1|DOWN|1.1	200	{"id":"dev-1","score":0,"changed":true,"tags":[]}
8	acme		dev-1|READY|1.1	200	{"id":"dev-1","score":50,"changed":true,"tags":[]}
9	acme		dev-1|DOWN|1.1	200	{"id":"dev-1","score":0,"changed":true,"tags":[]}
10	acme	1	dev-1|READY|1.1	200	{"id":"dev-1","score":100,"changed":true,"tags":[]}
11	acme		dev-1|SLEEPY|1.1	400	{"error":"unknown status \\"SLEEPY\\""}
12	acme	1	dev-1|SLEEPY|1.1	200	{"id":"dev-1","score":50,"changed":true,"tags":[]}
13	acme		dev-1|sleepy|1.1	400	{"error":"unknown status \\"SLEEPY\\""}
14	acme		dev-1|READY	400	{"error":"bad heartbeat"}
15	acme		dev-1	400	{"error":"bad heartbeat"}
16	acme			400	{"error":"bad heartbeat"}
17	acme		|READY|1.0	400	{"error":"bad id"}
18	acme		   |READY|1.0	400	{"error":"bad id"}
19	acme		xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx|READY|1.0	400	{"error":"bad id"}
20	acme		xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx|READY|1.0	200	{"id":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","score":100,"changed":true,"tags":[]}
21	acme		dev-2|READY|2.0|gpu,ssd	200	{"id":"dev-2","score":120,"changed":true,"tags":["gpu","ssd"]}
22	acme		dev-2|READY|2.0|gpu,ssd	200	{"id":"dev-2","score":120,"changed":true,"tags":["gpu","ssd"]}
23	acme		dev-2|READY|2.0|gpu, gpu ,ssd,,  ,ssd	200	{"id":"dev-2","score":120,"changed":true,"tags":["gpu","ssd"]}
24	acme		dev-2|READY|2.0|region:eu,region:us,region:ap,region:xx,region:,region	200	{"id":"dev-2","score":140,"changed":true,"tags":["region:eu","region:us","region:ap","region"]}
25	acme		dev-2|DEGRADED|2.0|gpu,region:mars	200	{"id":"dev-2","score":60,"changed":true,"tags":["gpu"]}
26	acme		dev-2|DOWN|2.0|gpu	200	{"id":"dev-2","score":0,"changed":true,"tags":["gpu"]}
27	acme		dev-2|READY|2.0|gpu	200	{"id":"dev-2","score":60,"changed":true,"tags":["gpu"]}
28	acme	1	dev-2|READY|2.0|gpu	200	{"id":"dev-2","score":110,"changed":true,"tags":["gpu"]}
29	acme		dev-2|BOOTING|2.0|a,b,c	200	{"id":"dev-2","score":30,"changed":true,"tags":["a","b","c"]}
30	-		dev-1|READY|1.0	200	{"id":"dev-1","score":100,"changed":true,"tags":[]}
31	-		dev-1|READY|1.0	200	{"id":"dev-1","score":100,"changed":false,"tags":[]}
32	beta		dev-1|DOWN|3.0	200	{"id":"dev-1","score":0,"changed":true,"tags":[]}
33	beta		dev-1|DOWN|3.0	200	{"id":"dev-1","score":0,"changed":false,"tags":[]}
34	beta		dev-1|down|3.1	200	{"id":"dev-1","score":0,"changed":true,"tags":[]}
35	beta		dev-1|ready|3.1	200	{"id":"dev-1","score":50,"changed":true,"tags":[]}
36	beta		dev-1|READY|3.1	200	{"id":"dev-1","score":100,"changed":true,"tags":[]}
37	acme		dev-3|BOOTING|0.1	200	{"id":"dev-3","score":0,"changed":true,"tags":[]}
38	acme		dev-4|BOOTING|	200	{"id":"dev-4","score":0,"changed":false,"tags":[]}
39	acme		dev-4|BOOTING||x,y	200	{"id":"dev-4","score":20,"changed":true,"tags":["x","y"]}
40	acme	1	dev-4|READY|0.2|x	200	{"id":"dev-4","score":110,"changed":true,"tags":["x"]}
`

interface Step {
  readonly n: number
  readonly tenant: string
  readonly force: boolean
  readonly body: string
  readonly wantStatus: number
  readonly wantBody: string
}

function steps(): Step[] {
  return RECORDED.trim()
    .split('\n')
    .map((line) => {
      const [n, tenant, force, body, status, response] = line.split('\t')
      return {
        n: Number(n),
        tenant: tenant === '-' ? '' : (tenant ?? ''),
        force: force === '1',
        body: body ?? '',
        wantStatus: Number(status),
        wantBody: response ?? ''
      }
    })
}

describe('simulateRequest', () => {
  it('reproduces the recorded exchange line by line', async () => {
    const posts: unknown[] = []
    server.use(
      http.post('/api/alerts', async ({ request }) => {
        posts.push(await request.json())
        return new HttpResponse(null, { status: 202 })
      })
    )
    const feed = new FeedStore(
      new ScratchFleet(),
      new Notifier('/api/alerts'),
      new AuditLog(undefined)
    )
    for (const step of steps()) {
      const got = await simulateRequest(feed, {
        line: step.body,
        tenant: step.tenant,
        force: step.force
      })
      expect(got, `line ${step.n}: ${step.body}`).toEqual({
        status: step.wantStatus,
        body: step.wantBody
      })
    }
    // one webhook POST per DOWN transition: lines 7, 9, 26 and 32
    expect(posts).toHaveLength(4)
    expect(posts.every((p) => (p as { channel: string }).channel === 'ops')).toBe(true)
  })

  it('refuses a body longer than the service reads', async () => {
    const feed = new FeedStore(new ScratchFleet(), new Notifier(''), new AuditLog(undefined))
    const got = await simulateRequest(feed, {
      line: 'x'.repeat(5000),
      tenant: 'acme',
      force: false
    })
    expect(got).toEqual({ status: 400, body: '{"error":"unreadable body"}' })
  })
})
