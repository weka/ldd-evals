import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { defaultServices } from '../test-utils/renderWithProviders'
import { ServicesProvider, useServices } from './ServicesContext'

function ShowRegion() {
  const { grants } = useServices()
  return <span>{grants.all().join(',')}</span>
}

describe('ServicesContext', () => {
  it('hands the services down', () => {
    render(
      <ServicesProvider services={defaultServices()}>
        <ShowRegion />
      </ServicesProvider>
    )
    expect(screen.getByText('read,write')).toBeInTheDocument()
  })

  it('throws outside the provider', () => {
    expect(() => render(<ShowRegion />)).toThrow('outside ServicesProvider')
  })
})
