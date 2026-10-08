import { useMemo } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState, ErrorBanner, Spinner } from '@/components/feedback/Status'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useMovie } from '@/features/movies/moviesQueries'
import { useFilterOptions, useSessions } from '@/features/sessions/sessionsQueries'
import { useAuth } from '@/features/auth/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useUrlFilters } from '@/features/sessions/useUrlFilters'

import type { SessionFilters } from '@/types/api'
import type { FilterOptions, Movie, MovieDetail, Session, SessionGroup } from '@/types/models'

import { dayNumber, formatGel, formatReleaseDate, nextDays, weekdayShort } from '@/utils/formatters'
import { parseApiError } from '@/utils/errorHandling'

/**
 * Референс-дизайн не содержит большого hero-блока и панели Details.
 * Код этих блоков сохранён: поставьте true, чтобы вернуть их на страницу.
 */
const SHOW_FEATURED_MOVIE = false

const ACCENT = '#ff3b19'

/* ------------------------------------------------------------------ */
/* Hero (опционально, см. SHOW_FEATURED_MOVIE)                         */
/* ------------------------------------------------------------------ */

function Hero({ movie, details }: { movie: Movie | undefined; details: MovieDetail | undefined }) {
  const image = movie?.backdropUrl ?? movie?.posterUrl
  const genres = movie?.genres.map((genre) => genre.name).join(' · ')
  const formats = movie?.formats.map((format) => format.name).join(' · ')

  return (
    <section className="relative isolate min-h-[380px] overflow-hidden bg-[#101827] text-white md:min-h-[500px]">
      {image ? <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" /> : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090d17]/95 via-[#090d17]/75 to-[#090d17]/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#090d17] via-transparent to-[#090d17]/30" />

      <div className="mx-auto flex min-h-[380px] w-full max-w-[1980px] items-end gap-7 px-8 pb-10 pt-28 md:min-h-[500px] md:gap-10 md:pb-14">
        {movie?.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="hidden h-[310px] w-[210px] shrink-0 rounded-xl object-cover shadow-2xl shadow-black/40 md:block"
          />
        ) : null}

        <div className="max-w-3xl">
          {movie ? (
            <>
              <span className="inline-flex rounded bg-[#ef3a22]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff735d]">
                {movie.isComingSoon ? 'Coming soon' : 'Now playing'}
              </span>
              <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-5xl">{movie.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85">
                {details?.synopsis || genres || 'Browse available cinema sessions and choose a showtime.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#ef3a22]/20 px-3 py-1.5 text-xs font-bold text-[#ff735d]">
                  {movie.ageRating.code}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {movie.runtimeMinutes} min
                </span>
                {formats ? (
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">{formats}</span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff735d]">Kino XII</span>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">Sessions</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">
                Browse current showtimes and book seats at a cinema near you.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

const LEGEND_CLASS = 'mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#5c6880]'

function FilterCheckbox({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="group flex cursor-pointer select-none items-center gap-2.5">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />

      <span
        className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded border text-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[${ACCENT}] ${
          checked ? 'border-[#ff3b19] bg-[#ff3b19]' : 'border-[#2d364f] bg-transparent group-hover:border-[#424e70]'
        }`}
      >
        {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>

      <span className="text-[12.5px] font-medium text-white">
        {label}
        {hint ? <span className="font-normal text-[#647189]"> · {hint}</span> : null}
      </span>
    </label>
  )
}

function Filters({
  options,
  filters,
  onChange,
}: {
  options: FilterOptions
  filters: SessionFilters
  onChange: (patch: Partial<SessionFilters>) => void
}) {
  const hasActiveFilters =
    filters.venues.length > 0 ||
    filters.formats.length > 0 ||
    filters.languages.length > 0 ||
    filters.bands.length > 0 ||
    Boolean(filters.search.trim())

  const dates = nextDays(7)

  const selectedVenues = options.venues.filter((venue) => filters.venues.includes(venue.slug))

  // Если выбраны кинотеатры, показываем только форматы, доступные хотя бы в одном из них.
  const formats = selectedVenues.length
    ? options.formats.filter((format) =>
        selectedVenues.some((venue) => venue.formats.some((item) => item.slug === format.slug)),
      )
    : options.formats

  const activeCount =
    filters.venues.length +
    filters.formats.length +
    filters.languages.length +
    filters.bands.length +
    (filters.search.trim() ? 1 : 0)

  const toggle = (key: 'venues' | 'formats' | 'languages' | 'bands', slug: string) => {
    const current = filters[key]
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]

    const patch: Partial<SessionFilters> = { [key]: next }

    // При смене Venue удаляем форматы, которые больше недоступны в выбранных кинотеатрах.
    if (key === 'venues') {
      const selected = options.venues.filter((venue) => next.includes(venue.slug))
      const allowedFormats = new Set(selected.flatMap((venue) => venue.formats.map((format) => format.slug)))

      patch.formats = selected.length ? filters.formats.filter((slug) => allowedFormats.has(slug)) : filters.formats
    }

    onChange(patch)
  }

  // Date и Sort не очищаем. Search очищаем, так как он фильтр текущего UI.
  const clearAllFilters = () => {
    onChange({ venues: [], formats: [], languages: [], bands: [], search: '' })
  }

  const checkboxGroup = (
    title: string,
    items: Array<{ slug: string; name: string; hint?: string }>,
    key: 'venues' | 'formats' | 'languages' | 'bands',
  ) => (
    <fieldset>
      <legend className={LEGEND_CLASS}>{title}</legend>
      <div className="space-y-2">
        {items.map((item) => (
          <FilterCheckbox
            key={item.slug}
            label={item.name}
            hint={item.hint}
            checked={filters[key].includes(item.slug)}
            onChange={() => toggle(key, item.slug)}
          />
        ))}
      </div>
    </fieldset>
  )

  return (
    <aside className="h-fit w-full shrink-0 self-start rounded-2xl border border-[#1b2032] bg-[#111420] p-5 text-white shadow-xl lg:sticky lg:top-6">
      <h2 className="mb-6 text-[15px] font-bold tracking-wide">Filters</h2>

      <div className="space-y-6">
        {checkboxGroup(
          'Venue',
          options.venues.map((venue) => ({ slug: venue.slug, name: venue.name, hint: venue.city })),
          'venues',
        )}

        <fieldset>
          <legend className={LEGEND_CLASS}>Date</legend>
          <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
            {dates.map((date) => {
              const isSelected = filters.date === date
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ date })}
                  className={`flex h-[48px] min-w-8 shrink-0 flex-col items-center justify-center rounded-lg border text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b19] ${
                    isSelected
                      ? 'border-[#303a55] bg-[#1e2538] text-white'
                      : 'border-transparent bg-transparent text-[#6d7b95] hover:bg-[#151928] hover:text-[#9bb0d1]'
                  }`}
                >
                  <span className="text-[9px] font-medium leading-none">{weekdayShort(date)}</span>
                  <span className="mt-1 text-[13px] font-bold leading-none">{dayNumber(date)}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {checkboxGroup('Format', formats.map((format) => ({ slug: format.slug, name: format.name })), 'formats')}

        {checkboxGroup(
          'Language',
          options.languages.map((language) => ({ slug: language.slug, name: language.name })),
          'languages',
        )}

        {checkboxGroup(
          'Time of day',
          options.timeBands.map((band) => ({ slug: band.id, name: band.label })),
          'bands',
        )}
      </div>

      <div className="mt-6 border-t border-[#181d2e] pt-5">
        <button
          type="button"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className="w-full rounded-lg border border-white/10 bg-[#1e2538] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#283048] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b19] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear All Filters
        </button>

        <p className="mt-3 text-center text-[11px] text-[#556178]">
          {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
        </p>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Session card                                                        */
/* ------------------------------------------------------------------ */

function SessionTicket({ session }: { session: Session }) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()

  const soldOut = session.isSoldOut || session.seatsLeft <= 0
  const tooYoung = user?.age != null && user.age < session.movie.ageRating.minAge
  const disabled = soldOut || tooYoung
  const lowAvailability = session.seatsLeft > 0 && session.seatsLeft <= 5

  return (
    <button
      type="button"
      disabled={disabled}
      title={tooYoung ? `You must be at least ${session.movie.ageRating.minAge}` : undefined}
      aria-label={`${session.time}, ${session.language.name}, ${session.format.name}, ${
        soldOut ? 'sold out' : `${session.seatsLeft} seats left`
      }, ${formatGel(session.price)}`}
      onClick={() => startBooking(session.id)}
      className={`flex w-full flex-col justify-between rounded-xl border bg-[#111421] p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b19] ${
        disabled
          ? 'cursor-not-allowed border-[#191e2e] opacity-40'
          : 'border-[#1b2134] shadow-sm hover:border-[#2b3552] hover:bg-[#151928]'
      }`}
    >
      {/* Время + формат */}
      <span className="flex items-center justify-between gap-2">
        <span className="text-[17px] font-bold tracking-tight text-white">{session.time}</span>
        <span className="rounded-full border border-[#232a3e] bg-[#181d2c] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#8694af]">
          {session.format.name}
        </span>
      </span>

      {/* Язык + доступность */}
      <span className="mb-3 mt-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="min-w-0 flex-1 truncate text-[#64728d]">{session.language.name}</span>

        {soldOut ? (
          <span className="shrink-0 font-medium text-[#62708a]">Sold out</span>
        ) : (
          <span
            className={`flex shrink-0 items-center gap-1 text-[10.5px] font-semibold ${
              lowAvailability ? 'text-[#ff4b2b]' : 'text-[#10b981]'
            }`}
          >
            <Ticket className="h-3 w-3" fill="currentColor" aria-hidden="true" />
            {session.seatsLeft} left
          </span>
        )}
      </span>

      {/* Зал + цена */}
      <span className="flex items-center justify-between gap-2 border-t border-[#181d2e] pt-2 text-[11.5px]">
        <span className="min-w-0 flex-1 truncate font-medium text-[#8492ab]">
          {session.venue.name} · Hall {session.hall.name}
        </span>
        <span className="shrink-0 font-bold tracking-tight text-white">{formatGel(session.price)}</span>
      </span>
    </button>
  )
}

function SessionsSkeleton() {
  return (
    <section aria-label="Loading sessions" aria-busy="true" className="min-w-0 flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
        <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3.5">
          <div className="flex items-center gap-3.5">
            <div className="h-[48px] w-[36px] animate-pulse rounded-md bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((__, ticketIndex) => (
              <div key={ticketIndex} className="h-[112px] animate-pulse rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Results + pagination                                                */
/* ------------------------------------------------------------------ */

function getPageNumbers(currentPage: number, lastPage: number): Array<number | 'ellipsis'> {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = []

  pages.push(1)

  if (currentPage > 4) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(lastPage - 1, currentPage + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (currentPage < lastPage - 3) {
    pages.push('ellipsis')
  }

  pages.push(lastPage)

  return pages
}

function SessionResults({
  groups,
  options,
  filters,
  onChange,
  meta,
}: {
  groups: SessionGroup[]
  options: FilterOptions
  filters: SessionFilters
  onChange: (patch: Partial<SessionFilters>) => void
  meta: { totalSessions: number; currentPage: number; lastPage: number }
}) {
  return (
    <section className="min-w-0 flex-1 text-white">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[13px] text-[#939fb5]">
          {meta.totalSessions > 0 ? `Showing ${meta.totalSessions} sessions` : 'No sessions found'}
        </p>

        <label className="group relative flex items-center gap-1.5 text-[13px]">
          <span className="text-[#8492ab]">Sort:</span>
          <select
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
            className="cursor-pointer appearance-none rounded bg-transparent pr-6 font-semibold text-white outline-none transition-colors group-hover:text-[#ff3c14] focus-visible:ring-2 focus-visible:ring-[#ff3b19]"
          >
            {options.sorts.map((sort) => (
              <option key={sort.id} value={sort.id} className="bg-[#111420] text-white">
                {sort.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-0 h-4 w-4 text-[#8492ab] transition-colors group-hover:text-[#ff3c14]"
            aria-hidden="true"
          />
        </label>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No sessions match these filters" text="Try another date, venue or format." />
      ) : (
        <>
          <div className="space-y-8">
            {groups.map((group) => (
              <article key={group.movie.id} className="space-y-3.5">
                {/* Заголовок фильма */}
                <div className="flex items-center gap-3.5">
                  {group.movie.posterUrl ? (
                    <Link to={`/movies/${group.movie.slug}`} aria-label={`View ${group.movie.title}`} className="shrink-0">
                      <img
                        src={group.movie.posterUrl}
                        alt={`${group.movie.title} poster`}
                        className="h-[48px] w-[36px] rounded-md border border-[#1e2437] object-cover shadow"
                      />
                    </Link>
                  ) : null}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/movies/${group.movie.slug}`}
                        className="text-[15px] font-bold tracking-tight text-white transition-colors hover:text-[#ff735d]"
                      >
                        {group.movie.title}
                      </Link>
                      <span className="rounded border border-[#46181b] bg-[#241517] px-1.5 py-[1px] text-[10px] font-bold text-[#ff4328]">
                        {group.movie.ageRating.code}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-[#69768f]">
                      {group.movie.runtimeMinutes} min · From {formatGel(group.movie.fromPrice)}
                    </p>
                  </div>
                </div>

                {/* Сетка сеансов */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                  {group.sessions.map((session) => (
                    <SessionTicket key={session.id} session={session} />
                  ))}
                </div>
              </article>
            ))}
          </div>

          {meta.lastPage > 1 ? (
            <nav
              aria-label="Sessions pagination"
              className="flex flex-wrap items-center justify-center gap-2 pb-4 pt-12"
            >
              <button
                type="button"
                aria-label="Previous page"
                disabled={meta.currentPage <= 1}
                onClick={() => onChange({ page: meta.currentPage - 1 })}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141825] text-[#818ea7] transition-colors hover:bg-[#1b2134] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              {getPageNumbers(meta.currentPage, meta.lastPage).map((page, index) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-[12px] text-[#556178]" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    aria-current={page === meta.currentPage ? 'page' : undefined}
                    onClick={() => onChange({ page })}
                    className={`h-8 min-w-8 rounded-full px-2 text-[12px] font-semibold transition-colors ${
                      page === meta.currentPage
                        ? 'bg-[#ff3b19] text-white'
                        : 'text-[#818ea7] hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                aria-label="Next page"
                disabled={meta.currentPage >= meta.lastPage}
                onClick={() => onChange({ page: meta.currentPage + 1 })}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141825] text-[#818ea7] transition-colors hover:bg-[#1b2134] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Movie details (опционально, см. SHOW_FEATURED_MOVIE)                */
/* ------------------------------------------------------------------ */

function MovieDetails({
  movie,
  details,
  group,
}: {
  movie: Movie | undefined
  details: MovieDetail | undefined
  group: SessionGroup | undefined
}) {
  if (!movie) {
    return null
  }

  const rows = [
    ['DIRECTOR', details?.director || 'Not announced'],
    ['MAIN CAST', details?.cast || 'Not announced'],
    ['DURATION', `${movie.runtimeMinutes} minutes`],
    ['RELEASE DATE', movie.releaseDate ? formatReleaseDate(movie.releaseDate) : 'Not announced'],
    ['FORMATS', movie.formats.map((format) => format.name).join(', ') || 'Not announced'],
    ['FROM', formatGel(movie.fromPrice)],
    ['VENUE', group?.sessions[0]?.venue.name ?? 'See available sessions'],
  ]

  return (
    <aside className="h-fit rounded-2xl border border-[#1b2032] bg-[#111420] p-5 text-white shadow-xl">
      <h2 className="text-[15px] font-bold">Details</h2>

      <dl className="mt-5 space-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold tracking-widest text-[#5c6880]">{label}</dt>
            <dd className="mt-1 text-[13px] font-semibold leading-5">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 rounded-lg bg-[#30221c] px-3 py-3 text-[#ffb15e]">
        <p className="text-xs font-semibold">RATING NOTE</p>
        <p className="mt-1 text-xs leading-5">
          <strong>{movie.ageRating.code}</strong>{' '}
          {movie.ageRating.description ||
            `Tickets are restricted to viewers aged ${movie.ageRating.minAge} and over.`}
        </p>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function SessionPage() {
  const [filters, setFilters] = useUrlFilters()

  // Search дебаунсится только для API-запроса, в URL значение попадает сразу.
  const debouncedSearch = useDebounce(filters.search, 300)

  const requestFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch])

  const options = useFilterOptions()
  const sessions = useSessions(requestFilters)

  const firstGroup = sessions.data?.data[0]
  const featuredMovie = firstGroup?.movie

  // Если hero и Details скрыты, лишний запрос деталей фильма не отправляем.
  const detailsQuery = useMovie(SHOW_FEATURED_MOVIE ? (featuredMovie?.slug ?? '') : '')

  const gridClass = SHOW_FEATURED_MOVIE
    ? 'grid items-start gap-7 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_280px]'
    : 'grid items-start gap-7 lg:grid-cols-[290px_minmax(0,1fr)]'

  return (
    <AppLayout overlayHeader={SHOW_FEATURED_MOVIE}>
      {SHOW_FEATURED_MOVIE ? <Hero movie={featuredMovie} details={detailsQuery.data} /> : null}

    <main className="mx-auto w-full max-w-[1800px] px-0 pb-16 pt-8">
        {/* Заголовок страницы + поиск */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-white">Sessions</h1>
            <p className="mt-0.5 text-[13px] text-[#717d96]">Browse showtimes across all venues</p>
          </div>

     
        </div>

        {options.isLoading ? <Spinner label="Loading session filters" /> : null}

        {options.isError ? (
          <ErrorBanner message={parseApiError(options.error).message} onRetry={() => void options.refetch()} />
        ) : null}

        {sessions.isLoading ? <SessionsSkeleton /> : null}

        {sessions.isError ? (
          <ErrorBanner message={parseApiError(sessions.error).message} onRetry={() => void sessions.refetch()} />
        ) : null}

        {options.data && sessions.data ? (
          <div className={gridClass}>
            <Filters options={options.data} filters={filters} onChange={setFilters} />

            <SessionResults
              groups={sessions.data.data}
              options={options.data}
              filters={filters}
              onChange={setFilters}
              meta={sessions.data.meta}
            />

            {SHOW_FEATURED_MOVIE ? (
              <div className="lg:col-span-2 xl:col-span-1">
                <MovieDetails movie={featuredMovie} details={detailsQuery.data} group={firstGroup} />
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </AppLayout>
  )
}