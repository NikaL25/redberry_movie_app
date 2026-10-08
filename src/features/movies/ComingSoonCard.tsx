import { Bell, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Movie } from '@/types/models'
import { formatInCinemas } from '@/utils/formatters'
import { useAuth } from '@/features/auth/useAuth'
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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.comingSoon(6),
      }),
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
    <article className="box-border flex h-[160px] w-[435px] max-w-[435px] shrink-0 gap-4 rounded-2xl border border-white/[0.05] bg-[#121926] p-3 transition duration-200 hover:bg-[#161f30]">
      {/* Постер: ровно 229 × 136 */}
      <button
        type="button"
        onClick={() => navigate(`/movies/${movie.slug}`)}
        className="box-border block h-[136px] w-[220px] min-w-[220px] max-w-[220px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-0 bg-[#0a0f18] p-0"
      >
        {movie.backdropUrl || movie.posterUrl ? (
          <img
            src={movie.backdropUrl ?? movie.posterUrl ?? ''}
            alt=""
            className="block h-[136px] w-[220px] min-w-[220px] max-w-[220px] object-cover"
          />
        ) : null}
      </button>

      {/* Правая часть: оставшиеся 201px */}
      <div className="flex h-[136px] min-w-0 flex-1 flex-col py-0.5">
        {/* Информация о фильме */}
        <div className="min-w-0">
          <b className="block truncate text-[10px] font-bold uppercase tracking-wider text-[#e63920]">
            {formatInCinemas(movie.releaseDate)}
          </b>

          <h3 className="mt-1 truncate text-[13px] font-bold leading-tight text-white">
            <Link
              to={`/movies/${movie.slug}`}
              className="transition hover:text-white/80"
            >
              {movie.title}
            </Link>
          </h3>

          <p className="mt-0.5 truncate text-[10.5px] text-white/50">
            {movie.genres[0]?.name ?? movie.kind} · {movie.runtimeMinutes} min
          </p>
        </div>

        {/* Нижняя часть */}
        <div className="mt-auto flex flex-col items-start gap-7">
          {/* Возраст */}
          <small className="inline-flex h-[18px] items-center rounded-full border border-[#e63920]/40 bg-[#e63920]/15 px-2 text-[9px] font-bold leading-none text-[#e63920]">
            {movie.ageRating.code}
          </small>

          {/* Notify Me */}
          <button
            className={`flex h-[26px] items-center gap-1.5 rounded-full border px-3 text-[10.5px] font-medium leading-none whitespace-nowrap transition disabled:cursor-default ${
              isNotified
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                : 'border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/[0.1] disabled:opacity-60'
            }`}
            type="button"
            onClick={onNotify}
            disabled={mutation.isPending || movie.isNotified}
          >
            {isNotified ? (
              <Check size={12} />
            ) : (
              <Bell size={12} />
            )}

            {isNotified ? 'You’ll be notified' : 'Notify Me'}
          </button>
        </div>
      </div>
    </article>
  )
}
