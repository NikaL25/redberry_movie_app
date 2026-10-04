import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Ticket,
} from 'lucide-react'
import { useParams } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import {
  ErrorBanner,
  Spinner,
} from '@/components/feedback/Status'
import {
  useMovie,
  useMovieSessions,
} from '@/features/movies/moviesQueries'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useAuth } from '@/hooks/useAuth'
import type {
  MovieDetail,
  Session,
} from '@/types/models'
import {
  formatGel,
  formatReleaseDate,
} from '@/utils/formatters'
import { parseApiError } from '@/utils/errorHandling'

type SortOption =
  | 'Showtime: earliest first'
  | 'Showtime: latest first'
  | 'Price: low to high'

type FlatSession = Session

type FilterOption = {
  slug: string
  label: string
  hint?: string
}

const SORT_OPTIONS = [
  'Showtime: earliest first',
  'Showtime: latest first',
  'Price: low to high',
] as const

const TIME_LABELS: Record<
  Session['timeBand'],
  string
> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

/**
 * Parse YYYY-MM-DD without UTC timezone conversion.
 *
 * This is important because:
 * new Date('2026-10-05')
 * may be interpreted as UTC and can shift the displayed
 * calendar date depending on the browser timezone.
 */
function parseDateOnly(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  )

  if (!match) {
    const fallback = new Date(value)

    return Number.isNaN(fallback.getTime())
      ? null
      : fallback
  }

  const [, year, month, day] = match

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  )
}

function normalizeDate(value: string) {
  const parsed = parseDateOnly(value)

  if (!parsed) {
    return value
  }

  const year = parsed.getFullYear()
  const month = String(
    parsed.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    parsed.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDateLabel(value: string) {
  const date = parseDateOnly(value)

  if (!date) {
    return value
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    },
  )
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

  return date.toLocaleDateString(
    'en-GB',
    {
      weekday: 'short',
    },
  )
}

function getDisplayTime(startsAt: string) {
  const date = new Date(startsAt)

  if (Number.isNaN(date.getTime())) {
    return startsAt
  }

  return date.toLocaleTimeString(
    'en-GB',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  )
}

function getSessionDate(
  session: Session,
) {
  if (session.date) {
    return normalizeDate(session.date)
  }

  const date = new Date(
    session.startsAt,
  )

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function SectionTitle({
  children,
}: {
  children: string
}) {
  return (
    <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">
      {children}
    </h3>
  )
}

function Divider() {
  return (
    <hr className="my-6 border-white/10" />
  )
}

function Filters({
  selected,
  date,
  dates,
  options,
  onToggle,
  onDateChange,
  onClear,
}: {
  selected: Set<string>
  date: string | null
  dates: string[]
  options: {
    venues: FilterOption[]
    formats: FilterOption[]
    languages: FilterOption[]
    timeBands: FilterOption[]
  }
  onToggle: (key: string) => void
  onDateChange: (value: string) => void
  onClear: () => void
}) {
  const activeCount = selected.size

  const renderCheckboxGroup = (
    title: string,
    items: FilterOption[],
  ) => (
    <fieldset>
      <legend className="contents">
        <SectionTitle>
          {title}
        </SectionTitle>
      </legend>

      <div className="space-y-2.5">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">
            No options available
          </p>
        ) : (
          items.map((item) => {
            const key = `${title}:${item.slug}`
            const checked =
              selected.has(key)

            return (
              <label
                key={key}
                className="group flex cursor-pointer items-center gap-2.5"
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  onChange={() =>
                    onToggle(key)
                  }
                />

                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#ef3a22] ${
                    checked
                      ? 'border-[#ef3a22] bg-[#ef3a22]'
                      : 'border-slate-500 group-hover:border-slate-300'
                  }`}
                >
                  {checked ? (
                    <Check
                      className="h-3 w-3"
                      strokeWidth={3}
                    />
                  ) : null}
                </span>

                <span className="text-sm font-medium">
                  {item.label}
                </span>

                {item.hint ? (
                  <span className="text-xs text-slate-400">
                    · {item.hint}
                  </span>
                ) : null}
              </label>
            )
          })
        )}
      </div>
    </fieldset>
  )

  return (
    <aside className="h-fit w-full shrink-0 self-start rounded-2xl bg-[#1a2036] px-6 py-6 lg:sticky lg:top-6 lg:w-[320px]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">
          Filters
        </h2>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[#ff735d] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {renderCheckboxGroup(
        'Venue',
        options.venues,
      )}

      <Divider />

      <SectionTitle>
        Date
      </SectionTitle>

      {dates.length === 0 ? (
        <p className="text-xs text-slate-500">
          No dates available.
        </p>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {dates.map((value) => {
            const selectedDate =
              date === value

            return (
              <button
                key={value}
                type="button"
                aria-pressed={
                  selectedDate
                }
                aria-label={formatDateLabel(
                  value,
                )}
                onClick={() =>
                  onDateChange(value)
                }
                className={`w-[46px] shrink-0 rounded-md py-2 text-xs font-medium leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
                  selectedDate
                    ? 'bg-[#ef3a22] text-white'
                    : 'bg-[#262d48] text-slate-200 hover:bg-[#30385a]'
                }`}
              >
                {formatDateWeekday(
                  value,
                )}

                <br />

                <span className="text-sm">
                  {formatDateDay(value)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <Divider />

      {renderCheckboxGroup(
        'Format',
        options.formats,
      )}

      <Divider />

      {renderCheckboxGroup(
        'Language',
        options.languages,
      )}

      <Divider />

      {renderCheckboxGroup(
        'Time of day',
        options.timeBands,
      )}

      <p className="mt-10 text-center text-xs text-slate-400">
        {activeCount}{' '}
        {activeCount === 1
          ? 'filter'
          : 'filters'}{' '}
        active
      </p>
    </aside>
  )
}

function SessionCard({
  session,
  minimumAge = 0,
}: {
  session: FlatSession
  minimumAge?: number
}) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()

  const soldOut =
    session.isSoldOut ||
    session.seatsLeft <= 0

  const lowAvailability =
    !soldOut &&
    session.seatsLeft > 0 &&
    session.seatsLeft <= 5

  const tooYoung =
    user?.age != null &&
    minimumAge > 0 &&
    user.age < minimumAge

  const disabled =
    soldOut ||
    tooYoung

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
        tooYoung
          ? `You must be at least ${minimumAge} years old to book this session.`
          : undefined
      }
      aria-label={[
        getDisplayTime(session.startsAt),
        session.language.name,
        session.format.name,
        soldOut
          ? 'sold out'
          : `${session.seatsLeft} seats left`,
        formatGel(session.price),
        tooYoung
          ? `minimum age ${minimumAge}`
          : undefined,
      ]
        .filter(Boolean)
        .join(', ')}
      onClick={handleBooking}
      className={`w-[252px] shrink-0 rounded-2xl bg-[#1a2036] px-4 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:bg-[#232a45]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold">
          {getDisplayTime(session.startsAt)}
        </span>

        <span className="rounded-full bg-[#2a3150] px-2.5 py-1 text-xs font-medium">
          {session.format.name}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
        <span className="truncate text-slate-300">
          {session.language.name}
        </span>

        {soldOut ? (
          <span className="shrink-0 text-slate-300">
            Sold out
          </span>
        ) : tooYoung ? (
          <span className="shrink-0 text-[#ff735d]">
            Age {minimumAge}+
          </span>
        ) : (
          <span
            className={`flex shrink-0 items-center gap-1 ${
              lowAvailability
                ? 'text-[#ef3a22]'
                : 'text-[#3ddc84]'
            }`}
          >
            <Ticket
              className="h-3.5 w-3.5 -rotate-45"
              fill="currentColor"
              aria-hidden="true"
            />

            {session.seatsLeft} left
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-semibold">
          {session.hall.name}
        </span>

        <span className="shrink-0 text-sm font-bold">
          {formatGel(session.price)}
        </span>
      </div>

      {minimumAge > 0 && !tooYoung ? (
        <div className="mt-3 rounded-lg bg-[#30221c] px-2.5 py-2 text-[11px] leading-4 text-[#ffb15e]">
          {minimumAge}+ age restriction
        </div>
      ) : null}

      {tooYoung ? (
        <div className="mt-3 rounded-lg bg-[#3a2020] px-2.5 py-2 text-[11px] leading-4 text-[#ff8d7c]">
          Your profile age does not meet the minimum age of{' '}
          {minimumAge}.
        </div>
      ) : null}
    </button>
  )
}


function SessionsList({
  sort,
  setSort,
  sessions,
  minimumAge,
}: {
  sort: SortOption
  setSort: (
    value: SortOption,
  ) => void
  sessions: FlatSession[]
  minimumAge: number
}) {
  const grouped = useMemo(() => {
    const map = new Map<
      number,
      {
        venueName: string
        venueCity: string
        venueId: number
        sessions: FlatSession[]
      }
    >()

    for (const session of sessions) {
      const key = session.venue.id

      const current =
        map.get(key) ?? {
          venueName:
            session.venue.name,
          venueCity:
            session.venue.city,
          venueId:
            session.venue.id,
          sessions: [],
        }

      current.sessions.push(session)

      map.set(key, current)
    }

    return Array.from(
      map.values(),
    )
  }, [sessions])

  if (grouped.length === 0) {
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold">
            Showing 0 sessions
          </p>

          <label className="relative flex items-center gap-2 text-sm">
            <span className="text-slate-400">
              Sort:
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value as SortOption,
                )
              }
              className="cursor-pointer appearance-none rounded bg-transparent pr-6 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]"
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                    className="bg-[#1a2036]"
                  >
                    {option}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              className="pointer-events-none absolute right-0 h-4 w-4"
              aria-hidden="true"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-dashed border-white/10 bg-[#151d32] p-8 text-center text-slate-300">
          <p className="font-semibold">
            No sessions available
            for this date.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Try another date or clear
            the current filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold">
          Showing {sessions.length}{' '}
          {sessions.length === 1
            ? 'session'
            : 'sessions'}
        </p>

        <label className="relative flex items-center gap-2 text-sm">
          <span className="text-slate-400">
            Sort:
          </span>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value as SortOption,
              )
            }
            className="cursor-pointer appearance-none rounded bg-transparent pr-6 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]"
          >
            {SORT_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-[#1a2036]"
                >
                  {option}
                </option>
              ),
            )}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-0 h-4 w-4"
            aria-hidden="true"
          />
        </label>
      </div>

      {grouped.map(
        ({
          venueId,
          venueName,
          venueCity,
          sessions: venueSessions,
        }) => (
          <article
            key={venueId}
            className="border-b border-white/10 py-8 first:pt-0 last:border-b-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  {venueName}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  {venueCity}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827] px-3 py-1.5 text-[11px] font-medium text-slate-300">
                <CalendarDays
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />

                {formatDateLabel(
                  getSessionDate(
                    venueSessions[0],
                  ),
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
              {venueSessions.map(
                (session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    minimumAge={minimumAge}
                  />
                ),
              )}
            </div>
          </article>
        ),
      )}
    </div>
  )
}


function MovieHero({
  movie,
}: {
  movie: MovieDetail
}) {
  const poster =
    movie.posterUrl ??
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80'

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#121a2d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,58,34,0.22),transparent_50%)]" />

      <div className="relative grid gap-8 p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-10">
        <img
          src={poster}
          alt={`${movie.title} poster`}
          className="h-[420px] w-full rounded-[22px] object-cover shadow-2xl shadow-black/30"
        />

        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#ef3a22]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ef3a22]">
                {movie.ageRating.code}
              </span>

              <span className="text-sm text-slate-300">
                {movie.kind}
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              {movie.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span>
                {movie.runtimeMinutes} min
              </span>

              <span aria-hidden="true">
                •
              </span>

              <span>
                {movie.genres
                  .map(
                    (genre) =>
                      genre.name,
                  )
                  .join(' • ') ||
                  'Film'}
              </span>

              <span aria-hidden="true">
                •
              </span>

              <span>
                From{' '}
                {formatGel(
                  movie.fromPrice,
                )}
              </span>
            </div>

            <p className="mt-6 max-w-[760px] text-base leading-7 text-slate-200">
              {movie.synopsis ||
                'No synopsis available for this title yet.'}
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#172033] p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Director
              </p>

              <p className="mt-2 font-semibold">
                {movie.director ||
                  'TBA'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#172033] p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Cast
              </p>

              <p className="mt-2 font-semibold">
                {movie.cast ||
                  'TBA'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#172033] p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
                Release
              </p>

              <p className="mt-2 font-semibold">
                {movie.releaseDate
                  ? formatReleaseDate(
                      movie.releaseDate,
                    )
                  : 'TBA'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Build exactly seven consecutive calendar dates.
 *
 * We prefer the earliest movie/session date supplied by the API.
 * If the API doesn't provide any date, we fall back to today.
 */
function getNextSevenDates(
  movieDates: string[],
  sessionDates: string[],
) {
  const sourceDates = [
    ...movieDates,
    ...sessionDates,
  ]
    .filter(Boolean)
    .map(normalizeDate)
    .filter(Boolean)
    .sort()

  const firstDate =
    sourceDates[0] ??
    normalizeDate(
      new Date().toISOString().slice(0, 10),
    )

  const start =
    parseDateOnly(firstDate)

  if (!start) {
    return []
  }

  const dates: string[] = []

  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const date = new Date(start)

    date.setDate(
      start.getDate() + index,
    )

    const year =
      date.getFullYear()

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, '0')

    const day = String(
      date.getDate(),
    ).padStart(2, '0')

    dates.push(
      `${year}-${month}-${day}`,
    )
  }

  return dates
}

export default function MovieDetailsPage() {
  const { slug } = useParams<{
    slug: string
  }>()

  const movieSlug = slug ?? ''

  const movieQuery =
    useMovie(movieSlug)

  /**
   * First request without a date.
   *
   * This gives us sessions and their dates,
   * which allows the page to construct the
   * seven-day selector.
   */
  const initialSessionsQuery =
    useMovieSessions(movieSlug)

  const movie =
    movieQuery.data

  const initialSessions =
    initialSessionsQuery.data ?? []

  const initialSessionDates =
    useMemo(() => {
      return initialSessions.flatMap(
        (group) =>
          group.sessions
            .map(getSessionDate)
            .filter(Boolean),
      )
    }, [initialSessions])

  const availableDates =
    useMemo(() => {
      return getNextSevenDates(
        movie?.availableDates ?? [],
        initialSessionDates,
      )
    }, [
      movie?.availableDates,
      initialSessionDates,
    ])

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<string | null>(
    null,
  )

  /**
   * The selected date must always be one of
   * the currently available seven dates.
   *
   * If API data changes and the old selected date
   * disappears, automatically fall back to the
   * first available date.
   */
  const effectiveDate =
    selectedDate &&
    availableDates.includes(
      selectedDate,
    )
      ? selectedDate
      : availableDates[0] ??
        null

  const [selected, setSelected] =
    useState<Set<string>>(
      new Set(),
    )

  const [sort, setSort] =
    useState<SortOption>(
      'Showtime: earliest first',
    )

  /**
   * Date-specific sessions request.
   */
  const sessionsQuery =
    useMovieSessions(
      movieSlug,
      effectiveDate ??
        undefined,
    )

  const sessions =
    sessionsQuery.data ?? []

  const allSessions =
    useMemo<FlatSession[]>(
      () =>
        sessions.flatMap(
          (group) =>
            group.sessions,
        ),
      [sessions],
    )

  /**
   * Filter options are based on sessions
   * available for the currently selected date.
   */
  const optionValues =
    useMemo(() => {
      const venueMap =
        new Map<
          string,
          FilterOption
        >()

      const formatMap =
        new Map<
          string,
          FilterOption
        >()

      const languageMap =
        new Map<
          string,
          FilterOption
        >()

      const timeMap =
        new Map<
          string,
          FilterOption
        >()

      for (const session of allSessions) {
        const venueSlug =
          session.venue.slug ||
          String(
            session.venue.id,
          )

        if (
          !venueMap.has(
            venueSlug,
          )
        ) {
          venueMap.set(
            venueSlug,
            {
              slug: venueSlug,
              label:
                session.venue
                  .name,
              hint:
                session.venue
                  .city,
            },
          )
        }

        const formatSlug =
          session.format.slug ||
          String(
            session.format.id,
          )

        if (
          !formatMap.has(
            formatSlug,
          )
        ) {
          formatMap.set(
            formatSlug,
            {
              slug:
                formatSlug,
              label:
                session.format
                  .name,
            },
          )
        }

        const languageSlug =
          session.language
            .slug ||
          String(
            session.language
              .id,
          )

        if (
          !languageMap.has(
            languageSlug,
          )
        ) {
          languageMap.set(
            languageSlug,
            {
              slug:
                languageSlug,
              label:
                session
                  .language
                  .name,
            },
          )
        }

        const timeBand =
          session.timeBand

        if (
          !timeMap.has(
            timeBand,
          )
        ) {
          timeMap.set(
            timeBand,
            {
              slug:
                timeBand,
              label:
                TIME_LABELS[
                  timeBand
                ],
            },
          )
        }
      }

      return {
        venues:
          Array.from(
            venueMap.values(),
          ),
        formats:
          Array.from(
            formatMap.values(),
          ),
        languages:
          Array.from(
            languageMap.values(),
          ),
        timeBands:
          Array.from(
            timeMap.values(),
          ),
      }
    }, [allSessions])

  /**
   * If the selected filter no longer exists
   * on the newly selected date, remove it.
   *
   * This prevents a hidden stale filter from
   * making the page show zero sessions unexpectedly.
   */
  const validFilterKeys =
    useMemo(() => {
      const keys = new Set<string>()

      for (const option of optionValues.venues) {
        keys.add(
          `Venue:${option.slug}`,
        )
      }

      for (const option of optionValues.formats) {
        keys.add(
          `Format:${option.slug}`,
        )
      }

      for (const option of optionValues.languages) {
        keys.add(
          `Language:${option.slug}`,
        )
      }

      for (const option of optionValues.timeBands) {
        keys.add(
          `Time of day:${option.slug}`,
        )
      }

      return keys
    }, [optionValues])

  const visibleSessions =
    useMemo(() => {
      const selectedFormats =
        new Set<string>()

      const selectedLanguages =
        new Set<string>()

      const selectedTimes =
        new Set<string>()

      const selectedVenues =
        new Set<string>()

      for (const key of selected) {
        const separatorIndex =
          key.indexOf(':')

        if (
          separatorIndex ===
          -1
        ) {
          continue
        }

        const group =
          key.slice(
            0,
            separatorIndex,
          )

        const value =
          key.slice(
            separatorIndex + 1,
          )

        if (
          group === 'Venue'
        ) {
          selectedVenues.add(
            value,
          )
        }

        if (
          group === 'Format'
        ) {
          selectedFormats.add(
            value,
          )
        }

        if (
          group === 'Language'
        ) {
          selectedLanguages.add(
            value,
          )
        }

        if (
          group ===
          'Time of day'
        ) {
          selectedTimes.add(
            value,
          )
        }
      }

      const filtered =
        allSessions.filter(
          (session) => {
            const matchesDate =
              !effectiveDate ||
              getSessionDate(
                session,
              ) ===
                effectiveDate

            const venueSlug =
              session.venue
                .slug ||
              String(
                session.venue
                  .id,
              )

            const formatSlug =
              session.format
                .slug ||
              String(
                session.format
                  .id,
              )

            const languageSlug =
              session.language
                .slug ||
              String(
                session.language
                  .id,
              )

            const matchesVenue =
              selectedVenues.size ===
                0 ||
              selectedVenues.has(
                venueSlug,
              )

            const matchesFormat =
              selectedFormats.size ===
                0 ||
              selectedFormats.has(
                formatSlug,
              )

            const matchesLanguage =
              selectedLanguages.size ===
                0 ||
              selectedLanguages.has(
                languageSlug,
              )

            const matchesTime =
              selectedTimes.size ===
                0 ||
              selectedTimes.has(
                session.timeBand,
              )

            return (
              matchesDate &&
              matchesVenue &&
              matchesFormat &&
              matchesLanguage &&
              matchesTime
            )
          },
        )

      const sorted =
        [...filtered]

      if (
        sort ===
        'Showtime: latest first'
      ) {
        sorted.sort(
          (a, b) =>
            new Date(
              b.startsAt,
            ).getTime() -
            new Date(
              a.startsAt,
            ).getTime(),
        )
      } else if (
        sort ===
        'Price: low to high'
      ) {
        sorted.sort(
          (a, b) =>
            a.price - b.price,
        )
      } else {
        sorted.sort(
          (a, b) =>
            new Date(
              a.startsAt,
            ).getTime() -
            new Date(
              b.startsAt,
            ).getTime(),
        )
      }

      return sorted
    }, [
      allSessions,
      effectiveDate,
      selected,
      sort,
    ])

  const toggleFilter = (
    key: string,
  ) => {
    setSelected((current) => {
      const next =
        new Set(current)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  const clearFilters = () => {
    setSelected(
      new Set(),
    )
  }

  /**
   * Remove stale filters when switching dates.
   *
   * We deliberately do NOT reset the date here.
   * Date is a separate selector, not a checkbox filter.
   */
  const cleanedSelected =
    useMemo(() => {
      const next =
        new Set<string>()

      for (const key of selected) {
        if (
          validFilterKeys.has(
            key,
          )
        ) {
          next.add(key)
        }
      }

      return next
    }, [
      selected,
      validFilterKeys,
    ])

  /**
   * If some filter disappeared after changing date,
   * synchronize the actual state.
   */
  if (
    cleanedSelected.size !==
      selected.size
  ) {
    const same =
      Array.from(
        cleanedSelected,
      ).every((key) =>
        selected.has(key),
      )

    if (!same) {
      setSelected(
        cleanedSelected,
      )
    }
  }

  const isInitialLoading =
    movieQuery.isLoading ||
    initialSessionsQuery.isLoading

  const isInitialError =
    movieQuery.isError ||
    initialSessionsQuery.isError

  if (isInitialLoading) {
    return (
      <AppLayout>
        <div className="container py-12">
          <Spinner
            label="Loading movie details"
          />
        </div>
      </AppLayout>
    )
  }

  if (isInitialError) {
    return (
      <AppLayout>
        <div className="container py-12">
          <ErrorBanner
            message={parseApiError(
              movieQuery.error ??
                initialSessionsQuery.error,
            ).message}
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
        <div className="container py-12">
          <ErrorBanner message="Movie not found." />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0f1115] px-6 py-6 text-white">
        <div className="mx-auto max-w-[1728px]">
          <MovieHero
            movie={movie}
          />

          <main className="mt-8 flex max-w-[1728px] flex-col gap-8 lg:flex-row">
            <Filters
              selected={selected}
              date={effectiveDate}
              dates={availableDates}
              options={
                optionValues
              }
              onToggle={
                toggleFilter
              }
              onDateChange={
                setSelectedDate
              }
              onClear={
                clearFilters
              }
            />

            <section className="min-w-0 flex-1">
              <div className="mb-6 rounded-2xl border border-white/10 bg-[#121a2d] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#ff735d]">
                      7-day showtimes
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Choose a date
                    </h2>
                  </div>

                  {effectiveDate ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <CalendarDays
                        className="h-4 w-4"
                        aria-hidden="true"
                      />

                      {formatDateLabel(
                        effectiveDate,
                      )}
                    </div>
                  ) : null}
                </div>

                {availableDates.length >
                0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {availableDates.map(
                      (value) => {
                        const active =
                          effectiveDate ===
                          value

                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={
                              active
                            }
                            onClick={() =>
                              setSelectedDate(
                                value,
                              )
                            }
                            className={`rounded-xl border px-2 py-3 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
                              active
                                ? 'border-[#ef3a22] bg-[#ef3a22] text-white'
                                : 'border-white/10 bg-[#1a2036] text-slate-300 hover:border-white/20 hover:bg-[#232a45]'
                            }`}
                          >
                            <span className="block text-[11px] font-semibold uppercase">
                              {formatDateWeekday(
                                value,
                              )}
                            </span>

                            <span className="mt-1 block text-lg font-bold">
                              {formatDateDay(
                                value,
                              )}
                            </span>

                            <span className="mt-1 block text-[10px] text-current/70">
                              {formatDateLabel(
                                value,
                              ).split(
                                ' ',
                              ).slice(
                                1,
                              ).join(
                                ' ',
                              )}
                            </span>
                          </button>
                        )
                      },
                    )}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-[#1a2036] p-5 text-center text-sm text-slate-400">
                    No showtime dates are
                    available for this
                    movie.
                  </div>
                )}
              </div>

              {sessionsQuery.isFetching ? (
                <div className="mb-5">
                  <Spinner
                    label="Loading showtimes"
                  />
                </div>
              ) : null}

              {sessionsQuery.isError ? (
                <ErrorBanner
                  message={parseApiError(
                    sessionsQuery.error,
                  ).message}
                  onRetry={() =>
                    void sessionsQuery.refetch()
                  }
                />
              ) : null}

              {!sessionsQuery.isError &&
              !sessionsQuery.isFetching ? (
                <SessionsList
                  sort={sort}
                  setSort={setSort}
                  sessions={
                    visibleSessions
                  }
                />
              ) : null}
            </section>
          </main>
        </div>
      </div>
    </AppLayout>
  )
}
