import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DeviceIdentity } from './DeviceIdentity'

describe('DeviceIdentity', () => {
  it('shows a dash for an unenrolled device', () => {
    render(
      <DeviceIdentity
        deviceId='a'
        tenantId='acme'
        clusterId=''
      />
    )
    expect(screen.getAllByRole('definition')).toHaveLength(3)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
