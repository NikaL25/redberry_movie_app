import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'

import type {
  SessionFilters,
  SessionsListResponse,
} from '@/types/api'

import type {
  FilterOptions,
  SeatMap,
  Session,
} from '@/types/models'

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data } = await api.get<{ data: FilterOptions }>(
    endpoints.filterOptions,
  )

  return data.data
}

export function buildSessionParams(
  filters: SessionFilters,
): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.date) {
    params.set('date', filters.date)
  }

  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.sort) {
    params.set('sort', filters.sort)
  }

  if (filters.page > 1) {
    params.set('page', String(filters.page))
  }

  filters.venues.forEach((venue) => {
    params.append('venues[]', venue)
  })

  filters.formats.forEach((format) => {
    params.append('formats[]', format)
  })

  filters.languages.forEach((language) => {
    params.append('languages[]', language)
  })

  filters.bands.forEach((band) => {
    params.append('bands[]', band)
  })

  return params
}

export async function fetchSessions(
  filters: SessionFilters,
): Promise<SessionsListResponse> {
  const { data } = await api.get<SessionsListResponse>(
    endpoints.sessions,
    {
      params: buildSessionParams(filters),
    },
  )

  return data
}

export async function fetchSession(id: number): Promise<Session> {
  const { data } = await api.get<{ data: Session }>(
    endpoints.session(id),
  )

  return data.data
}

export async function fetchSeats(id: number): Promise<SeatMap> {
  const { data } = await api.get<{ data: SeatMap }>(
    endpoints.seats(id),
  )

  return data.data
}
