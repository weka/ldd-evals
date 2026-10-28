/**
 * The hidden top-rung oracle for every refactor case that touches the heartbeat path.
 *
 * It renders the whole app at /heartbeats, drives the simulator the way an operator
 * does — tenant select, force checkbox, the line textbox, Apply — with a fixed
 * sequence of heartbeat lines, and compares the Result region's text and the
 * Status code with a table recorded from the fleet service. Black-box over the
 * page on purpose: it survives any internal API change, so an agent can rename,
 * split or move processHeartbeat freely as long as the page answers the same. It
 * lives outside the fixture so the agent under test never sees it; the postcheck
 * copies it to src/__blackbox__/ for one run and deletes it.
 *
 * The table is go-mini's: expected.tsv is byte-identical to the Go and Python
 * suites', which is what makes the three fixtures the same service. The alert
 * channel answers 500 to its first two POSTs; the service retries twice with a
 * backoff, so the first DOWN transition costs three POSTs and each later one
 * costs one: 6 in all for the recorded sequence.
 */
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { App } from '../App'
import { server } from '../test-utils/mocks/server'
import { renderWithProviders } from '../test-utils/renderWithProviders'

const NO_TENANT = '-'
const WEBHOOK_FAILURES = 2
const WANT_WEBHOOK_POSTS = 6
const STEP_TIMEOUT_MS = 10_000

interface Step {
  readonly n: number
  readonly tenant: string
  readonly force: boolean
  readonly body: string
  readonly wantCode: number
  readonly wantBody: string
}

function parseTsv(text: string): Step[] {
  const steps: Step[] = []
  text
    .replace(/\n$/, '')
    .split('\n')
    .forEach((line, i) => {
      if (line.startsWith('#')) {
        return
      }
      const fields = line.split('\t')
      if (fields.length !== 6) {
        throw new Error(`expected.tsv line ${i + 1}: want 6 tab-separated fields, got ${fields.length}`)
      }
      const [n, tenant, force, body, code, response] = fields as [string, string, string, string, string, string]
      steps.push({ n: Number(n), tenant, force: force === '1', body, wantCode: Number(code), wantBody: response })
    })
  return steps
}

declare const __dirname: string

const EXPECTED = parseTsv(readFileSync(path.join(__dirname, 'expected.tsv'), 'utf8'))

describe('heartbeat contract', () => {
  it(
    'reproduces the recorded exchange through the page, and pages the ops channel 6 times',
    async () => {
      const posts: string[] = []
      server.use(
        http.post('/api/alerts', async ({ request }) => {
          posts.push(await request.text())
          return new HttpResponse(null, { status: posts.length <= WEBHOOK_FAILURES ? 500 : 200 })
        })
      )
      renderWithProviders(<App />, { route: '/heartbeats' })
      const user = userEvent.setup()
      const tenant = await screen.findByRole('combobox', { name: 'Tenant' })
      const force = screen.getByRole('checkbox', { name: 'Force' })
      const line = screen.getByRole('textbox', { name: 'Heartbeat line' })
      const apply = screen.getByRole('button', { name: 'Apply' })
      const result = screen.getByRole('status', { name: 'Result' })
      const code = screen.getByRole('status', { name: 'Status code' })

      const mismatches: string[] = []
      for (const step of EXPECTED) {
        await user.selectOptions(tenant, step.tenant === NO_TENANT ? '' : step.tenant)
        if ((force as HTMLInputElement).checked !== step.force) {
          await user.click(force)
        }
        await user.clear(line)
        if (step.body !== '') {
          await user.type(line, step.body)
        }
        await user.click(apply)
        await waitFor(() => expect(apply).toBeEnabled(), { timeout: STEP_TIMEOUT_MS })
        const gotBody = result.textContent ?? ''
        const gotCode = Number(code.textContent)
        if (gotBody !== step.wantBody || gotCode !== step.wantCode) {
          mismatches.push(
            `line ${step.n}: tenant=${step.tenant} force=${step.force} body=${JSON.stringify(step.body)}\n` +
              `  got  ${gotCode} ${gotBody}\n  want ${step.wantCode} ${step.wantBody}`
          )
        }
      }

      const problems = [...mismatches]
      if (posts.length !== WANT_WEBHOOK_POSTS) {
        problems.push(`webhook received ${posts.length} POSTs, want ${WANT_WEBHOOK_POSTS}`)
      }
      posts.forEach((p, i) => {
        if (!p.includes('"channel":"ops"')) {
          problems.push(`webhook POST ${i + 1} lacks "channel":"ops": ${p}`)
        }
      })
      expect(problems, problems.join('\n')).toEqual([])
    },
    120_000
  )

  it('keeps the Go table: 40 steps, the first one as recorded', () => {
    expect(EXPECTED).toHaveLength(40)
    expect(EXPECTED[0]).toEqual({
      n: 1,
      tenant: 'acme',
      force: false,
      body: 'dev-1|READY|1.0',
      wantCode: 200,
      wantBody: '{"id":"dev-1","score":100,"changed":true,"tags":[]}'
    })
  })
})
