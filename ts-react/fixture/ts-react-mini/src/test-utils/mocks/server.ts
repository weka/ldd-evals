import { setupServer } from 'msw/node'

import { handlers } from './handlers'

/** The fleet API as the tests see it: every domain's handlers, started once in setup. */
export const server = setupServer(...handlers)
