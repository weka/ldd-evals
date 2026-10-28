import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LineLog } from './LineLog'

describe('LineLog', () => {
  it('lists every applied line with its tenant', () => {
    render(
      <LineLog
        applied={[
          {
            deviceId: 'dev-1',
            tenant: 'acme',
            status: 'READY',
            version: '1.0',
            tags: [],
            receivedAt: new Date('2024-03-01T12:00:00Z'),
            raw: 'dev-1|READY|1.0'
          }
        ]}
      />
    )
    expect(screen.getByRole('heading', { name: 'Applied 1 lines' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('dev-1|READY|1.0 acme')
  })
})
