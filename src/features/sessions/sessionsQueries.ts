import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/app/queryClient'
import type { SessionFilters } from '@/types/api'

import {
  fetchFilterOptions,
  fetchSeats,
  fetchSession,
  fetchSessions,
} from './sessionsApi'

export function useFilterOptions() {
  return useQuery({
    queryKey: queryKeys.filterOptions,
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60_000,
  })
}

export function useSessions(filters: SessionFilters) {
  return useQuery({
    queryKey: queryKeys.sessions(filters),
    queryFn: () => fetchSessions(filters),
    placeholderData: (previousData) => previousData,
  })
}

export function useSession(id: number | null) {
  return useQuery({
    queryKey: queryKeys.session(id ?? 0),
    queryFn: () => fetchSession(id as number),
    enabled: Boolean(id),
  })
}

export function useSeatMap(id: number | null) {
  return useQuery({
    queryKey: queryKeys.seats(id ?? 0),
    queryFn: () => fetchSeats(id as number),
    enabled: Boolean(id),
  })
}
