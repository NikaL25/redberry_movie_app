import type { SessionFilters } from '@/types/api'
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
  featured: ['movies', 'featured'] as const,


  nowPlaying: (limit?: number) =>
    ['movies', 'now-playing', limit] as const,

  comingSoon: (limit?: number) =>
    ['movies', 'coming-soon', limit] as const,

  movie: (slug: string) =>
    ['movie', slug] as const,

  movieSessions: (slug: string, date?: string) =>
    ['movie', slug, 'sessions', date] as const,
  
  tickets: (filter?: 'upcoming' | 'past') =>
    ['profile', 'tickets', filter] as const,
  search: (q: string) =>
    ['movies', 'search', q] as const,

  filterOptions: ['sessions', 'filter-options'] as const,

  sessions: (filters: SessionFilters) =>
    ['sessions', filters] as const,

  session: (id: number) =>
    ['session', id] as const,

  seats: (id: number) =>
    ['session', id, 'seats'] as const,

  me: ['auth', 'me'] as const,
}

