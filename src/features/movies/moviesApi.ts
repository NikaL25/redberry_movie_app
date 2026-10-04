import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { Movie } from '@/types/models'

export async function fetchFeatured() {
  const { data } = await api.get<{ data: Movie[] }>(endpoints.featured)
  return data.data
}

export async function fetchNowPlaying(limit?: number) {
  const { data } = await api.get<{ data: Movie[] }>(endpoints.nowPlaying, { params: limit ? { limit } : undefined })
  return data.data
}

export async function fetchComingSoon(limit?: number) {
  const { data } = await api.get<{ data: Movie[] }>(endpoints.comingSoon, { params: limit ? { limit } : undefined })
  return data.data
}

export async function fetchMovie(slug: string) {
  const { data } = await api.get<{ data: import('@/types/models').MovieDetail }>(endpoints.movie(slug))
  return data.data
}

export async function fetchMovieSessions(slug: string, date?: string) {
  const { data } = await api.get<{ data: import('@/types/models').VenueSessionGroup[] }>(
    endpoints.movieSessions(slug),
    { params: date ? { date } : undefined },
  )
  return data.data
}

export async function searchMovies(q: string) {
  const { data } = await api.get<{ data: Movie[] }>(endpoints.search, { params: { q } })
  return data.data
}

export async function notifyMovie(slug: string) {
  const { data } = await api.post<{ data: { movieId: number; subscribed: boolean } }>(endpoints.notify(slug))
  return data.data
}
