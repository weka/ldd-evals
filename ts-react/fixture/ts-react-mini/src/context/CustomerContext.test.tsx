import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CustomerProvider, useCustomer } from './CustomerContext'

function ShowTenants() {
  const { tenants } = useCustomer()
  return <span>{tenants.join(',')}</span>
}

describe('CustomerContext', () => {
  it('starts with the configured tenants and adds the fleet’s', async () => {
    render(
      <CustomerProvider>
        <ShowTenants />
      </CustomerProvider>
    )
    expect(screen.getByText('acme,beta')).toBeInTheDocument()
    expect(await screen.findByText('acme,beta,gamma')).toBeInTheDocument()
  })
})
