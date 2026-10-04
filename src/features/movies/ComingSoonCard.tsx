import { Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Movie } from '@/types/models'
import { formatInCinemas } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { openAuthModal, setReplay } from '@/features/auth/authSlice'
import { notifyMovie } from './moviesApi'
import { queryKeys } from '@/app/queryClient'

export function ComingSoonCard({ movie }: { movie: Movie }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const mutation = useMutation({
    mutationFn: () => notifyMovie(movie.slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comingSoon(6) }),
  })

  const onNotify = () => {
    if (!isAuthenticated) {
      dispatch(setReplay({ type: 'notify', slug: movie.slug }))
      dispatch(openAuthModal('login'))
      return
    }
    mutation.mutate()
  }

  return (
    <article className="coming-card">
      <button type="button" className="coming-media" onClick={() => navigate(`/movies/${movie.slug}`)}>
        {movie.backdropUrl || movie.posterUrl ? (
          <img src={movie.backdropUrl ?? movie.posterUrl ?? ''} alt="" />
        ) : null}
      </button>
      <div>
        <b>{formatInCinemas(movie.releaseDate)}</b>
        <h3>
          <Link to={`/movies/${movie.slug}`}>{movie.title}</Link>
        </h3>
        <p>
          {movie.genres[0]?.name ?? movie.kind} · {movie.runtimeMinutes} min
        </p>
        <small>{movie.ageRating.code}</small>
        <button className="notify" type="button" onClick={onNotify} disabled={mutation.isPending || movie.isNotified}>
          <Bell size={14} /> {movie.isNotified || mutation.isSuccess ? 'You’ll be notified' : 'Notify Me'}
        </button>
      </div>
    </article>
  )
}
