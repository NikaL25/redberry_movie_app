import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/queryClient'
import {
  fetchComingSoon,
  fetchFeatured,
  fetchMovie,
  fetchMovieSessions,
  fetchNowPlaying,
  searchMovies,
} from './moviesApi'

export function useFeaturedMovies() {
  return useQuery({
    queryKey: queryKeys.featured,
    queryFn: fetchFeatured,
  })
}

export function useNowPlaying(limit?: number) {
  return useQuery({
    queryKey: queryKeys.nowPlaying(limit),
    queryFn: () => fetchNowPlaying(limit),
  })
}

export function useComingSoon(limit?: number) {
  return useQuery({
    queryKey: queryKeys.comingSoon(limit),
    queryFn: () => fetchComingSoon(limit),
  })
}

export function useMovie(slug: string) {
  return useQuery({
    queryKey: queryKeys.movie(slug),
    queryFn: () => fetchMovie(slug),
    enabled: Boolean(slug),
  })
}

export function useMovieSessions(slug: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.movieSessions(slug, date),
    queryFn: () => fetchMovieSessions(slug, date),
    enabled: Boolean(slug) && Boolean(date),
    placeholderData: (previousData) => previousData,
  })
}

export function useMovieSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: () => searchMovies(q),
    enabled: q.trim().length > 0,
  })
}
