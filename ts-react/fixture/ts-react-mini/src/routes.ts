/** The page paths, in one place so links and routes cannot drift apart. */
export const ROUTES = {
  home: '/',
  devices: '/devices',
  device: '/devices/:tenant/:id',
  heartbeats: '/heartbeats',
  status: '/status',
  settings: '/settings'
} as const satisfies Record<string, `/${string}`>
