import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'

/** A wrapper for renderHook: a fresh query client that never retries. */
export function withQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}
