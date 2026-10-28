import { describe, expect, it } from 'vitest'

import { widgets } from './registry'

describe('widgets registry', () => {
  it('returns registered widgets by name in order', () => {
    function Widget() {
      return null
    }
    widgets.register('test-widget', Widget)
    expect(widgets.get('test-widget')).toBe(Widget)
    expect(widgets.names()).toContain('test-widget')
  })
})
