import { ChevronLeft, ChevronRight, Clock3, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

import type { Movie } from '@/types/models'
import { useMovie } from '@/features/movies/moviesQueries'
import { formatRuntime } from '@/utils/formatters'

const BADGE_LIGHT =
  'inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.08] px-3 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-md'

/**
 * Общая сетка проекта:
 *
 * 1920px viewport
 * ├── 60px
 * ├── 1800px content
 * └── 60px
 */
const HERO_CONTAINER =
  'mx-auto flex h-full w-full max-w-[1800px] flex-col justify-between px-5 sm:px-8 lg:px-0'

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [slide, setSlide] = useState(0)

  if (!movies.length) return null

  const activeIndex = Math.min(slide, movies.length - 1)
  const movie = movies[activeIndex]

  const backdrop = movie.backdropUrl ?? movie.posterUrl ?? ''

  /*
   * /movies/featured возвращает Movie,
   * но description/synopsis находится в MovieDetail.
   *
   * Поэтому получаем полные данные активного фильма.
   */
  const detailsQuery = useMovie(movie.slug)
  const description = detailsQuery.data?.synopsis

  return (
    <section className="relative h-[620px] w-full overflow-hidden bg-[#070a11]">
      {/* Фон */}
      <div className="absolute inset-0 z-0">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover object-center brightness-[0.72] contrast-[1.12] transition-all duration-700"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-[#070a11] via-[#070a11]/40 to-transparent" />

        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#070a11] via-[#070a11]/70 to-transparent" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,10,17,0.2)_50%,rgba(7,10,17,0.8)_100%)]" />
      </div>

      {/* Контент */}
      <div className={`${HERO_CONTAINER} relative z-10 pb-10 pt-[136px]`}>
        <div className="max-w-xl space-y-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#e63920]">
            {movie.isFeatured ? 'FEATURED' : 'NOW PLAYING'}
          </span>

          <h1 className="text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
            {movie.title.toUpperCase()}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 py-1">
            <span className="rounded-full border border-[#e63920]/40 bg-[#e63920]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#e63920]">
              {movie.ageRating.code}
            </span>

            <span className={BADGE_LIGHT}>
              <Clock3
                size={12}
                className="text-white/70"
              />

              {formatRuntime(movie.runtimeMinutes)}
            </span>

            {movie.formats.slice(0, 2).map((format) => (
              <span
                key={format.id}
                className={`${BADGE_LIGHT} text-[10px] font-semibold uppercase tracking-wider`}
              >
                {format.name}
              </span>
            ))}
          </div>

          {/* DESCRIPTION */}
          <p className="line-clamp-4 max-w-[560px] pr-4 text-[13.5px] font-normal leading-relaxed text-white/70">
            {description ||
              movie.genres.map((genre) => genre.name).join(' · ')}
          </p>

          <div className="flex items-center gap-3.5 pt-4">
            <Link
              to={`/movies/${movie.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#e63920] px-6 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-[#e63920]/25 transition duration-200 hover:bg-[#ff4d33] active:scale-95"
            >
              <Ticket
                size={16}
                className="fill-white"
              />

              Buy tickets
            </Link>

            <Link
              to="/sessions"
              className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#18202f]/80 px-6 py-2.5 text-[13px] font-semibold text-white/90 backdrop-blur-md transition duration-200 hover:bg-[#202b3e] hover:text-white"
            >
              All sessions
            </Link>
          </div>
        </div>

        {/* Линии + стрелки */}
        <div className="flex w-full items-center">
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            {movies.map((item, index) => (
              <i
                key={item.id}
                className={`block h-[3px] w-[365px] shrink-0 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'bg-[#e63920]'
                    : 'bg-white'
                }`}
              />
            ))}
          </div>

          <div className="ml-6 flex shrink-0 items-center gap-2.5">
            <button
              aria-label="Previous slide"
              type="button"
              onClick={() =>
                setSlide((value) => Math.max(0, value - 1))
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#18202f]/80 text-white/80 backdrop-blur-md transition duration-200 hover:bg-white/[0.15] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              aria-label="Next slide"
              type="button"
              onClick={() =>
                setSlide((value) =>
                  Math.min(movies.length - 1, value + 1),
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#18202f]/80 text-white/80 backdrop-blur-md transition duration-200 hover:bg-white/[0.15] hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
