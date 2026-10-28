import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { type Device } from '../../types/device'
import { DeviceTable } from './DeviceTable'

const devices: Device[] = [
  { id: 'a', tenant: 'acme', status: 'READY', version: '1.0', tags: ['gpu'], lastSeen: new Date(0) }
]

describe('DeviceTable', () => {
  it('shows the columns the page asks for', () => {
    renderWithProviders(
      <DeviceTable
        devices={devices}
        showTenant
        compact={false}
        showTags
      />
    )
    expect(screen.getByRole('columnheader', { name: 'Tenant' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'gpu' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'a' })).toHaveAttribute('href', '/devices/acme/a')
  })

  it('drops the version column when compact', () => {
    renderWithProviders(
      <DeviceTable
        devices={devices}
        showTenant={false}
        compact
        showTags={false}
      />
    )
    expect(screen.queryByRole('columnheader', { name: 'Version' })).not.toBeInTheDocument()
  })
})
