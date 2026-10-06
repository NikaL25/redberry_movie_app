import { Bell, Check } from 'lucide-react'
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

  const isNotified = movie.isNotified || mutation.isSuccess

  return (
    <article className="flex w-full max-w-[470px] h-[160px] gap-4 p-3 rounded-2xl bg-[#121926] hover:bg-[#161f30] border border-white/[0.05] transition duration-200">
      {/* Постер 229×136, прижат к левому краю */}
      <button
        type="button"
        onClick={() => navigate(`/movies/${movie.slug}`)}
        className="block w-[229px] h-[136px] shrink-0 rounded-xl overflow-hidden bg-[#0a0f18] p-0 border-0 cursor-pointer"
      >
        {movie.backdropUrl || movie.posterUrl ? (
          <img src={movie.backdropUrl ?? movie.posterUrl ?? ''} alt="" className="w-full h-full object-cover" />
        ) : null}
      </button>

      {/* Контент: 470 − 12 − 229 − 16 − 12 = 201px */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div className="min-w-0">
          <b className="block text-[10px] font-bold tracking-wider text-[#e63920] uppercase truncate">
            {formatInCinemas(movie.releaseDate)}
          </b>
          <h3 className="mt-1 text-[13px] font-bold leading-tight text-white truncate">
            <Link to={`/movies/${movie.slug}`} className="hover:text-white/80 transition">
              {movie.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-[10.5px] text-white/50 truncate">
            {movie.genres[0]?.name ?? movie.kind} · {movie.runtimeMinutes} min
          </p>
        </div>

        <div className="flex items-center gap-2">
          <small className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-[#e63920] bg-[#e63920]/15 border border-[#e63920]/40">
            {movie.ageRating.code}
          </small>
          <button
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap transition disabled:cursor-default ${
              isNotified
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/80 border-white/10 disabled:opacity-60'
            }`}
            type="button"
            onClick={onNotify}
            disabled={mutation.isPending || movie.isNotified}
          >
            {isNotified ? <Check size={12} /> : <Bell size={12} />}
            {isNotified ? 'You’ll be notified' : 'Notify Me'}
          </button>
        </div>
      </div>
    </article>
  )
}