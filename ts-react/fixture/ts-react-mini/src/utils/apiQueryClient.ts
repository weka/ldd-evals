import { QueryClient } from '@tanstack/react-query'

let queryClient: QueryClient | undefined

/** Returns the query client the app was started with, so code outside React can invalidate. */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient()
  }
  return queryClient
}

/** Records the client the composition root built. */
export function setQueryClient(client: QueryClient): void {
  queryClient = client
}
