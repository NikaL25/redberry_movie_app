import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        const status =
          typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: number }).status) : 0
        if (status === 401 || status === 403 || status === 404 || status === 422) return false
        return count < 2
      },
    },
    mutations: { retry: false },
  },
})

export const queryKeys = {
  me: ['me'] as const,
  filterOptions: ['filter-options'] as const,
  featured: ['movies', 'featured'] as const,
  nowPlaying: (limit?: number) => ['movies', 'now-playing', limit] as const,
  comingSoon: (limit?: number) => ['movies', 'coming-soon', limit] as const,
  search: (q: string) => ['search', q] as const,
  movie: (slug: string) => ['movies', slug] as const,
  movieSessions: (slug: string, date?: string) => ['movies', slug, 'sessions', date] as const,
  sessions: (params: unknown) => ['sessions', params] as const,
  session: (id: number) => ['session', id] as const,
  seats: (id: number) => ['seats', id] as const,
  hold: (id: string) => ['hold', id] as const,
  tickets: (filter?: string) => ['tickets', filter] as const,
}
