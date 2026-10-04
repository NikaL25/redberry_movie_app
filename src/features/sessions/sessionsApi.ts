import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { SessionFilters } from '@/types/api'
import type { FilterOptions, SeatMap, Session } from '@/types/models'

export async function fetchFilterOptions() {
  const { data } = await api.get<{ data: FilterOptions }>(endpoints.filterOptions)
  return data.data
}

export function buildSessionParams(filters: SessionFilters) {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.page > 1) params.set('page', String(filters.page))
  filters.venues.forEach((value) => params.append('venues[]', value))
  filters.formats.forEach((value) => params.append('formats[]', value))
  filters.languages.forEach((value) => params.append('languages[]', value))
  filters.bands.forEach((value) => params.append('bands[]', value))
  return params
}

export async function fetchSessions(filters: SessionFilters) {
  const { data } = await api.get(endpoints.sessions, { params: buildSessionParams(filters) })
  return data as import('@/types/api').SessionsListResponse
}

export async function fetchSession(id: number) {
  const { data } = await api.get<{ data: Session }>(endpoints.session(id))
  return data.data
}

export async function fetchSeats(id: number) {
  const { data } = await api.get<{ data: SeatMap }>(endpoints.seats(id))
  return data.data
}
