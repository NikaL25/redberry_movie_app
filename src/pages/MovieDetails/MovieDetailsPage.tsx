import { useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Clock, Ticket } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBanner, Spinner } from '@/components/feedback/Status'
import { useMovie, useMovieSessions } from '@/features/movies/moviesQueries'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useAuth } from '@/hooks/useAuth'
import type { MovieDetail, Session } from '@/types/models'
import { formatGel, formatReleaseDate } from '@/utils/formatters'
import { parseApiError } from '@/utils/errorHandling'

type SortOption = 'Showtime: earliest first' | 'Showtime: latest first' | 'Price: low to high'

type FlatSession = Session

const SORT_OPTIONS = ['Showtime: earliest first', 'Showtime: latest first', 'Price: low to high'] as const

const PAGE_CONTAINER = 'mx-auto w-full max-w-[1720px] px-8 lg:px-16'

/**
 * Parse YYYY-MM-DD without UTC timezone conversion.
 *
 * This is important because:
 * new Date('2026-10-05')
 * may be interpreted as UTC and can shift the displayed
 * calendar date depending on the browser timezone.
 */
function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    const fallback = new Date(value)

    return Number.isNaN(fallback.getTime()) ? null : fallback
  }

  const [, year, month, day] = match

  return new Date(Number(year), Number(month) - 1, Number(day))
}

function normalizeDate(value: string) {
  const parsed = parseDateOnly(value)

  if (!parsed) {
    return value
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
  const date = parseDateOnly(value)

  if (!date) {
    return value
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatDateDay(value: string) {
  const date = parseDateOnly(value)

  if (!date) {
    return value
  }

  return date.getDate()
}

function formatDateWeekday(value: string) {
  const date = parseDateOnly(value)

  if (!date) {
    return value
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
  })
}

function getSessionDate(session: Session) {
  if (session.date) {
    return normalizeDate(session.date)
  }

  const date = new Date(session.startsAt)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/* ------------------------------------------------------------------ */
/* Date selector                                                       */
/* ------------------------------------------------------------------ */

function DateSelector({
  date,
  dates,
  onDateChange,
}: {
  date: string | null
  dates: string[]
  onDateChange: (value: string) => void
}) {
  if (dates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-[#101726]/80 p-5 text-center text-sm text-slate-400">
        No showtime dates are available for this movie.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
      {dates.map((value) => {
        const isSelected = date === value

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            aria-label={formatDateLabel(value)}
            onClick={() => onDateChange(value)}
            className={`flex h-[78px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f93c24] ${
              isSelected
                ? 'border-slate-500/60 bg-[#1e2a44] text-white shadow-lg'
                : 'border-slate-800/80 bg-[#101726]/80 text-slate-400 hover:bg-[#151f33] hover:text-slate-200'
            }`}
          >
            <span className="text-[11px] font-medium tracking-wide text-slate-400">
              {formatDateWeekday(value)}
            </span>
            <span className="mt-0.5 text-lg font-bold text-white">{formatDateDay(value)}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Session ticket                                                      */
/* ------------------------------------------------------------------ */

function SessionCard({
  session,
  minimumAge = 0,
}: {
  session: FlatSession
  minimumAge?: number
}) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()

  const soldOut = session.isSoldOut || session.seatsLeft <= 0

  const lowAvailability = !soldOut && session.seatsLeft > 0 && session.seatsLeft <= 5

  const tooYoung = user?.age != null && minimumAge > 0 && user.age < minimumAge

  const disabled = soldOut || tooYoung

  const handleBooking = () => {
    if (disabled) {
      return
    }

    startBooking(session.id)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title={
        tooYoung ? `You must be at least ${minimumAge} years old to book this session.` : undefined
      }
      aria-label={[
        session.time,
        session.language.name,
        session.format.name,
        soldOut ? 'sold out' : `${session.seatsLeft} seats left`,
        formatGel(session.price),
        tooYoung ? `minimum age ${minimumAge}` : undefined,
      ]
        .filter(Boolean)
        .join(', ')}
      onClick={handleBooking}
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-700/40 bg-[#1b263b] text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f93c24] ${
        disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-[#202d45]'
      }`}
    >
      <span className="flex items-stretch">
        {/* Время, язык, формат */}
        <span className="flex flex-col justify-center px-3.5 py-2.5">
          <span className="text-sm font-bold tracking-tight text-white">{session.time}</span>
          <span className="mt-1 flex items-center gap-1">
            <span className="max-w-[90px] truncate text-[9px] font-medium uppercase text-slate-400">
              {session.language.code ?? session.language.name}
            </span>
            <span className="rounded bg-[#101726] px-1.5 py-px text-[9px] font-semibold uppercase text-slate-300">
              {session.format.name}
            </span>
          </span>
        </span>

        {/* Перфорация */}
        <span className="my-1.5 border-l border-dashed border-slate-700/80" aria-hidden="true" />

        {/* Цена и места */}
        <span className="flex flex-col justify-center px-3.5 py-2.5">
          <span className="text-sm font-bold text-white">{formatGel(session.price)}</span>

          <span className="mt-1 flex items-center gap-1 text-[10px]">
            {soldOut ? (
              <span className="text-slate-400">Sold out</span>
            ) : tooYoung ? (
              <span className="text-[#f94f38]">Age {minimumAge}+</span>
            ) : (
              <span
                className={`flex items-center gap-1 font-semibold ${
                  lowAvailability ? 'text-[#f93c24]' : 'text-[#3ddc84]'
                }`}
              >
                <Ticket className="h-2.5 w-2.5 -rotate-45" fill="currentColor" aria-hidden="true" />
                {session.seatsLeft} left
              </span>
            )}
          </span>
        </span>
      </span>

      {minimumAge > 0 && !tooYoung ? (
        <span className="block bg-[#261d15]/60 px-3.5 py-1.5 text-[10px] leading-4 text-[#f59e0b]">
          {minimumAge}+ age restriction
        </span>
      ) : null}

      {tooYoung ? (
        <span className="block bg-[#3a2020] px-3.5 py-1.5 text-[10px] leading-4 text-[#ff8d7c]">
          Your profile age does not meet the minimum age of {minimumAge}.
        </span>
      ) : null}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Sessions list                                                       */
/* ------------------------------------------------------------------ */

function SessionsToolbar({
  count,
  sort,
  setSort,
}: {
  count: number
  sort: SortOption
  setSort: (value: SortOption) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-[13px] text-slate-400">
        Showing {count} {count === 1 ? 'session' : 'sessions'}
      </p>

      <label className="group relative flex items-center gap-1.5 text-[13px]">
        <span className="text-slate-400">Sort:</span>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOption)}
          className="cursor-pointer appearance-none rounded bg-transparent pr-6 font-semibold text-white outline-none transition-colors group-hover:text-[#f93c24] focus-visible:ring-2 focus-visible:ring-[#f93c24]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-[#111927] text-white">
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-0 h-4 w-4 text-slate-400 transition-colors group-hover:text-[#f93c24]"
          aria-hidden="true"
        />
      </label>
    </div>
  )
}
type HallGroup = {
  hallId: string
  hallName: string
  sessions: FlatSession[]
}

type VenueGroup = {
  venueId: number
  venueName: string
  venueCity: string
  sessions: FlatSession[]
  halls: Map<string, HallGroup>
}

function SessionsList({
  sort,
  setSort,
  sessions,
  minimumAge,
}: {
  sort: SortOption
  setSort: (value: SortOption) => void
  sessions: FlatSession[]
  minimumAge: number
}) {
const grouped = useMemo(() => {
  const map = new Map<number, VenueGroup>()

  for (const session of sessions) {
    const key = session.venue.id

    const current: VenueGroup = map.get(key) ?? {
      venueName: session.venue.name,
      venueCity: session.venue.city,
      venueId: session.venue.id,
      sessions: [],
      halls: new Map<string, HallGroup>(),
    }

    current.sessions.push(session)

    const hallKey = String(session.hall.id)
    const hall: HallGroup = current.halls.get(hallKey) ?? {
      hallId: hallKey,
      hallName: session.hall.name,
      sessions: [],
    }

    hall.sessions.push(session)
    current.halls.set(hallKey, hall)

    map.set(key, current)
  }

  return Array.from(map.values()).map((venue) => ({
    ...venue,
    halls: Array.from(venue.halls.values()),
  }))
}, [sessions])

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <SessionsToolbar count={0} sort={sort} setSort={setSort} />

        <div className="rounded-2xl border border-dashed border-slate-800 bg-[#101726]/80 p-8 text-center text-slate-300">
          <p className="font-semibold">No sessions available for this date.</p>

          <p className="mt-2 text-sm text-slate-500">Try another date.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <SessionsToolbar count={sessions.length} sort={sort} setSort={setSort} />

      {grouped.map(({ venueId, venueName, venueCity, sessions: venueSessions, halls }) => (
        <article key={venueId} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-200">
              {venueName} <span className="font-normal text-slate-500">· {venueCity}</span>
            </h3>

            <div className="flex items-center gap-2 rounded-full border border-slate-700/40 bg-[#162133]/90 px-3 py-1 text-[11px] font-medium text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {formatDateLabel(getSessionDate(venueSessions[0]))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {halls.map((hall) => (
              <div
                key={hall.hallId}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-[#101726]/80 p-5"
              >
                <span className="text-sm font-semibold text-slate-200">Hall {hall.hallName}</span>

                <div className="flex flex-nowrap items-stretch gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {hall.sessions.map((session) => (
                    <SessionCard key={session.id} session={session} minimumAge={minimumAge} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function MovieHero({ movie }: { movie: MovieDetail }) {
  const poster =
    movie.posterUrl ??
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80'

  const backdrop = movie.backdropUrl ?? poster

  const genres = movie.genres.map((genre) => genre.name).join(' · ')
  const formats = movie.formats.slice(0, 3)

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#112338] via-[#0b1726] to-[#050811]">
      {/* Размытый фон */}
      <div
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-40 blur-[65px]"
        style={{ backgroundImage: `url('${backdrop}')` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070e1c]/90 via-[#0a182c]/70 to-[#061120]/95" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#050811]" />

      {/* Верхний отступ компенсирует шапку при overlayHeader */}
      <div className={`relative z-10 pb-16 pt-[132px] ${PAGE_CONTAINER}`}>
        <div className="flex flex-col items-start gap-10 pt-4 md:flex-row md:items-center">
          {/* Постер */}
          <div className="group relative shrink-0">
            <div className="relative h-[375px] w-[280px] overflow-hidden rounded-2xl border border-slate-700/30 shadow-2xl shadow-black/80">
              <img
                src={poster}
                alt={`${movie.title} poster`}
                className="h-full w-full transform object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5">
                <p className="truncate text-center text-sm font-bold uppercase tracking-[0.25em] text-slate-200 drop-shadow-md">
                  {movie.title}
                </p>
              </div>
            </div>
          </div>

          {/* Информация */}
          <div className="flex max-w-2xl flex-col items-start gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[#f93c24]/30 bg-[#3d1816]/70 px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f94f38]">
                  {movie.isComingSoon ? 'Coming soon' : 'Now playing'}
                </span>
              </div>

              <span className="text-xs text-slate-400">
                {[movie.kind, genres].filter(Boolean).join(' · ')}
              </span>
            </div>

            <h1 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              {movie.title}
            </h1>

            <p className="max-w-xl text-sm font-normal leading-relaxed text-slate-300/90 md:text-base">
              {movie.synopsis || 'No synopsis available for this title yet.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="rounded border border-[#f93c24]/40 bg-[#381a17]/80 px-2.5 py-1 text-[11px] font-bold text-[#f94f38]">
                {movie.ageRating.code}
              </span>

              <div className="flex items-center gap-1.5 rounded-full border border-slate-700/40 bg-[#162133]/90 px-3 py-1 text-xs font-medium text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{movie.runtimeMinutes} Min</span>
              </div>

              {formats.map((format) => (
                <span
                  key={format.id}
                  className="rounded-full border border-slate-700/40 bg-[#162133]/90 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  {format.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Details sidebar                                                     */
/* ------------------------------------------------------------------ */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-sm font-semibold leading-relaxed text-slate-100">{children}</div>
    </div>
  )
}

function MovieDetailsSidebar({ movie }: { movie: MovieDetail }) {
  const formats = movie.formats.map((format) => format.name).join(', ')

  return (
    <aside className="flex flex-col gap-6 lg:col-span-4 lg:pl-6">
      <h2 className="text-2xl font-bold tracking-tight text-white">Details</h2>

      <div className="flex flex-col gap-5 text-xs">
        <DetailRow label="Director">{movie.director || 'TBA'}</DetailRow>

        <DetailRow label="Main cast">{movie.cast || 'TBA'}</DetailRow>

        <DetailRow label="Duration">{movie.runtimeMinutes} minutes</DetailRow>

        <DetailRow label="Release date">
          {movie.releaseDate ? formatReleaseDate(movie.releaseDate) : 'TBA'}
        </DetailRow>

        <DetailRow label="Formats">{formats || 'Not announced'}</DetailRow>

        <DetailRow label="From">
          <span className="text-base font-bold text-white">{formatGel(movie.fromPrice)}</span>
        </DetailRow>

        <div className="mt-2 rounded-xl border border-[#8a531e]/30 bg-[#261d15]/60 p-4">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
            Rating note
          </div>
          <div className="text-xs font-normal leading-relaxed text-[#d97706]/90">
            <span className="font-semibold text-[#f59e0b]">{movie.ageRating.code}</span>{' '}
            {movie.ageRating.description ||
              `Tickets are restricted to viewers aged ${movie.ageRating.minAge} and over.`}
          </div>
        </div>
      </div>
    </aside>
  )
}

/**
 * Build exactly seven consecutive calendar dates.
 *
 * We prefer the earliest movie/session date supplied by the API.
 * If the API doesn't provide any date, we fall back to today.
 */
function getNextSevenDates(movieDates: string[], sessionDates: string[]) {
  const sourceDates = [...movieDates, ...sessionDates]
    .filter(Boolean)
    .map(normalizeDate)
    .filter(Boolean)
    .sort()

  const firstDate = sourceDates[0] ?? normalizeDate(new Date().toISOString().slice(0, 10))

  const start = parseDateOnly(firstDate)

  if (!start) {
    return []
  }

  const dates: string[] = []

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(start)

    date.setDate(start.getDate() + index)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    dates.push(`${year}-${month}-${day}`)
  }

  return dates
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MovieDetailsPage() {
  const { slug } = useParams<{ slug: string }>()

  const movieSlug = slug ?? ''

  const movieQuery = useMovie(movieSlug)

  /**
   * First request without a date.
   *
   * This gives us sessions and their dates,
   * which allows the page to construct the
   * seven-day selector.
   */
  const initialSessionsQuery = useMovieSessions(movieSlug)

  const movie = movieQuery.data

  const initialSessions = initialSessionsQuery.data ?? []

  const initialSessionDates = useMemo(() => {
    return initialSessions.flatMap((group) => group.sessions.map(getSessionDate).filter(Boolean))
  }, [initialSessions])

  const availableDates = useMemo(() => {
    return getNextSevenDates(movie?.availableDates ?? [], initialSessionDates)
  }, [movie?.availableDates, initialSessionDates])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  /**
   * The selected date must always be one of
   * the currently available seven dates.
   *
   * If API data changes and the old selected date
   * disappears, automatically fall back to the
   * first available date.
   */
  const effectiveDate =
    selectedDate && availableDates.includes(selectedDate) ? selectedDate : (availableDates[0] ?? null)

  const [sort, setSort] = useState<SortOption>('Showtime: earliest first')

  /**
   * Date-specific sessions request.
   */
  const sessionsQuery = useMovieSessions(movieSlug, effectiveDate ?? undefined)

  const sessions = sessionsQuery.data ?? []

  const allSessions = useMemo<FlatSession[]>(
    () => sessions.flatMap((group) => group.sessions),
    [sessions],
  )

  const visibleSessions = useMemo(() => {
    const filtered = allSessions.filter(
      (session) => !effectiveDate || getSessionDate(session) === effectiveDate,
    )

    const sorted = [...filtered]

    if (sort === 'Showtime: latest first') {
      sorted.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    } else if (sort === 'Price: low to high') {
      sorted.sort((a, b) => a.price - b.price)
    } else {
      sorted.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    }

    return sorted
  }, [allSessions, effectiveDate, sort])

  const isInitialLoading = movieQuery.isLoading || initialSessionsQuery.isLoading

  const isInitialError = movieQuery.isError || initialSessionsQuery.isError

  if (isInitialLoading) {
    return (
      <AppLayout>
        <div className={`py-12 ${PAGE_CONTAINER}`}>
          <Spinner label="Loading movie details" />
        </div>
      </AppLayout>
    )
  }

  if (isInitialError) {
    return (
      <AppLayout>
        <div className={`py-12 ${PAGE_CONTAINER}`}>
          <ErrorBanner
            message={parseApiError(movieQuery.error ?? initialSessionsQuery.error).message}
            onRetry={() => {
              void movieQuery.refetch()
              void initialSessionsQuery.refetch()
            }}
          />
        </div>
      </AppLayout>
    )
  }

  if (!movie) {
    return (
      <AppLayout>
        <div className={`py-12 ${PAGE_CONTAINER}`}>
          <ErrorBanner message="Movie not found." />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout overlayHeader>
      <div className="w-full bg-[#050811] text-white">
        <MovieHero movie={movie} />

        <main className={`grid grid-cols-1 gap-12 py-10 lg:grid-cols-12 ${PAGE_CONTAINER}`}>
          {/* Левая колонка: сеансы */}
          <div className="flex min-w-0 flex-col gap-8 lg:col-span-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Sessions</h2>
              <p className="mt-1 text-xs font-normal text-slate-400">
                {effectiveDate
                  ? `${visibleSessions.length} ${
                      visibleSessions.length === 1 ? 'session' : 'sessions'
                    } on ${formatDateLabel(effectiveDate)}`
                  : 'Choose a date to see showtimes'}
              </p>
            </div>

            <DateSelector date={effectiveDate} dates={availableDates} onDateChange={setSelectedDate} />

            {sessionsQuery.isFetching ? <Spinner label="Loading showtimes" /> : null}

            {sessionsQuery.isError ? (
              <ErrorBanner
                message={parseApiError(sessionsQuery.error).message}
                onRetry={() => void sessionsQuery.refetch()}
              />
            ) : null}

            {!sessionsQuery.isError && !sessionsQuery.isFetching ? (
              <SessionsList sort={sort} setSort={setSort} sessions={visibleSessions} minimumAge={0} />
            ) : null}
          </div>

          {/* Правая колонка: детали */}
          <MovieDetailsSidebar movie={movie} />
        </main>
      </div>
    </AppLayout>
  )
}
