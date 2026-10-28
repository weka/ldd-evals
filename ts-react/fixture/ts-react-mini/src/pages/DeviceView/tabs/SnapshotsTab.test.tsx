import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import { SnapshotsTab } from './SnapshotsTab'

describe('SnapshotsTab', () => {
  it('lists snapshots oldest first', async () => {
    renderWithProviders(<SnapshotsTab deviceId='a' />)
    const items = await screen.findAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'a-1709250000 2024-03-01T00:00:00Z',
      'a-1709290000 2024-03-01T11:00:00Z'
    ])
  })

  it('says when there are none', async () => {
    renderWithProviders(<SnapshotsTab deviceId='b' />)
    expect(await screen.findByText('no snapshots yet')).toBeInTheDocument()
  })
})
