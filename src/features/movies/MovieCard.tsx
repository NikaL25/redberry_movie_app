import { Link } from 'react-router-dom'
import type { Movie } from '@/types/models'
import { formatGel } from '@/utils/formatters'

export function MovieCard({ movie }: { movie: Movie }) {
  const genre = movie.genres[0]?.name ?? movie.kind
  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-white/[0.05] bg-[#111723] p-2.5 shadow-md transition duration-200 hover:border-white/[0.12] hover:bg-[#141c2b]">
      <Link to={`/movies/${movie.slug}`} className="block">
        {/* Постер 4:5 */}
        <div className="relative mb-3 aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#0a0f18]">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1b2332] to-[#0a0f18]" />
          )}
        </div>

        <div className="px-1">
          <h3 className="truncate text-[14px] font-bold tracking-tight text-white">{movie.title}</h3>
          <p className="mt-0.5 truncate text-[11px] font-normal text-white/50">
            {genre} · {movie.runtimeMinutes} min
          </p>
          <small className="mb-3 mt-2 inline-block rounded-full border border-[#e63920]/40 bg-[#e63920]/15 px-2 py-0.5 text-[10px] font-semibold text-[#e63920]">
            {movie.ageRating.code}
          </small>
        </div>
      </Link>

      <footer className="mx-1 flex items-center justify-between gap-2 border-t border-white/[0.04] pt-2">
        <strong className="whitespace-nowrap text-[12px] font-normal text-white/70">
          From {formatGel(movie.fromPrice)}
        </strong>
        <Link
          to={`/movies/${movie.slug}`}
          className="whitespace-nowrap rounded-full bg-[#e63920] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#ff4d33]"
        >
          Buy Ticket
        </Link>
      </footer>
    </article>
  )
}