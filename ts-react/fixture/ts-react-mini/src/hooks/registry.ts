import { type ComponentType } from 'react'

import { type Device } from '../types/device'

/** A status-page widget: a component that renders one view of the fleet. */
export type WidgetRenderer = ComponentType<{ readonly devices: readonly Device[] }>

const HANDLERS = new Map<string, WidgetRenderer>()

/** The widgets the status page knows, in registration order. */
export const widgets = {
  register(name: string, render: WidgetRenderer): void {
    HANDLERS.set(name, render)
  },
  get(name: string): WidgetRenderer | undefined {
    return HANDLERS.get(name)
  },
  names(): string[] {
    return [...HANDLERS.keys()]
  }
}
