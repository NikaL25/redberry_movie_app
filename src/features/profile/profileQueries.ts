import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/queryClient'
import { fetchTickets } from './profileApi'

export function useTickets(filter?: 'upcoming' | 'past', enabled = true) {
  return useQuery({
    queryKey: queryKeys.tickets(filter),
    queryFn: () => fetchTickets(filter),
    enabled,
  })
}
