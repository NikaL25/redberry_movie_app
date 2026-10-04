import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Ticket } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBanner, Spinner } from '@/components/feedback/Status'
import { useMovie, useMovieSessions } from '@/features/movies/moviesQueries'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useAuth } from '@/hooks/useAuth'
import type { Session } from '@/types/models'
import { formatGel } from '@/utils/formatters'
import { parseApiError } from '@/utils/errorHandling'

type SortOption = 'Showtime: earliest first' | 'Showtime: latest first' | 'Price: low to high'

type FlatSession = Session & {
  venueName: string
  venueCity: string
}

const SORT_OPTIONS = ['Showtime: earliest first', 'Showtime: latest first', 'Price: low to high'] as const

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

function getDisplayTime(startsAt: string) {
  const date = new Date(startsAt)
  return Number.isNaN(date.getTime()) ? startsAt : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getDisplayDate(startsAt: string) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return startsAt
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">{children}</h3>
}

function Divider() {
  return <hr className="my-6 border-white/10" />
}

function Filters({
  selected,
  date,
  dates,
  options,
  onToggle,
  onDateChange,
}: {
  selected: Set<string>
  date: string | null
  dates: string[]
  options: {
    venues: Array<{ label: string; hint?: string }>
    formats: Array<{ label: string }>
    languages: Array<{ label: string }>
    timeBands: Array<{ label: string; hint?: string }>
  }
  onToggle: (key: string) => void
  onDateChange: (value: string | null) => void
}) {
  const activeCount = selected.size + (date ? 1 : 0)

  const renderCheckboxGroup = (title: string, items: Array<{ label: string; hint?: string }>) => (
    <fieldset>
      <legend className="contents">
        <SectionTitle>{title}</SectionTitle>
      </legend>
      <div className="space-y-2.5">
        {items.map(({ label, hint }) => {
          const key = `${title}:${label}`
          const checked = selected.has(key)

          return (
            <label key={key} className="group flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(key)} />
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#ef3a22] ${
                  checked ? 'border-[#ef3a22] bg-[#ef3a22]' : 'border-slate-500 group-hover:border-slate-300'
                }`}
              >
                {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className="text-sm font-medium">{label}</span>
              {hint ? <span className="text-xs text-slate-400">· {hint}</span> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )

  return (
    <aside className="w-full shrink-0 self-start rounded-2xl bg-[#1a2036] px-6 py-6 lg:w-[320px]">
      <h2 className="mb-6 text-lg font-bold">Filters</h2>

      {renderCheckboxGroup('Venue', options.venues)}
      <Divider />

      <SectionTitle>Date</SectionTitle>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {dates.map((value) => {
          const match = new Date(value)
          const day = match.toLocaleDateString('en-GB', { weekday: 'short' })
          const dayNumber = match.getDate()

          return (
            <button
              key={value}
              type="button"
              aria-pressed={date === value}
              onClick={() => onDateChange(date === value ? null : value)}
              className={`w-[38px] shrink-0 rounded-md py-2 text-xs font-medium leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
                date === value ? 'bg-[#ef3a22]' : 'bg-[#262d48] hover:bg-[#30385a]'
              }`}
            >
              {day}
              <br />
              {dayNumber}
            </button>
          )
        })}
      </div>
      <Divider />

      {renderCheckboxGroup('Format', options.formats)}
      <Divider />
      {renderCheckboxGroup('Language', options.languages)}
      <Divider />
      {renderCheckboxGroup('Time of day', options.timeBands)}
      <Divider />

      <p className="mt-16 text-center text-xs text-slate-400">{activeCount} filters active</p>
    </aside>
  )
}

function SessionCard({ session }: { session: FlatSession }) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()
  const soldOut = session.isSoldOut || session.seatsLeft === 0
  const low = !soldOut && session.seatsLeft > 0 && session.seatsLeft <= 5
  const tooYoung = user?.age != null && user.age < session.movie.ageRating.minAge
  const disabled = soldOut || tooYoung

  return (
    <button
      type="button"
      disabled={disabled}
      title={tooYoung ? `You must be at least ${session.movie.ageRating.minAge}` : undefined}
      aria-label={`${getDisplayTime(session.startsAt)}, ${session.format.name}, ${soldOut ? 'sold out' : `${session.seatsLeft} seats left`}, ${formatGel(session.price)}`}
      className={`w-[252px] shrink-0 rounded-2xl bg-[#1a2036] px-4 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#232a45]'
      }`}
      onClick={() => startBooking(session.id)}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{getDisplayTime(session.startsAt)}</span>
        <span className="rounded-full bg-[#2a3150] px-2.5 py-1 text-xs font-medium">{session.format.name}</span>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-300">{session.language.name}</span>
        {soldOut ? (
          <span className="text-slate-300">Sold out</span>
        ) : (
          <span className={`flex items-center gap-1 ${low ? 'text-[#ef3a22]' : 'text-[#3ddc84]'}`}>
            <Ticket className="h-3.5 w-3.5 -rotate-45" fill="currentColor" aria-hidden="true" />
            {session.seatsLeft} left
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold">{session.hall.name}</span>
        <span className="text-sm font-bold">{formatGel(session.price)}</span>
      </div>
    </button>
  )
}

function SessionsList({
  sort,
  setSort,
  sessions,
}: {
  sort: SortOption
  setSort: (value: SortOption) => void
  sessions: FlatSession[]
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { venueName: string; venueCity: string; sessions: FlatSession[] }>()

    for (const session of sessions) {
      const key = `${session.venue.id}-${session.venue.name}`
      const current = map.get(key) ?? { venueName: session.venue.name, venueCity: session.venue.city, sessions: [] }
      current.sessions.push(session)
      map.set(key, current)
    }

    return Array.from(map.values())
  }, [sessions])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Showing {sessions.length} sessions</p>
        <label className="relative flex items-center gap-2 text-sm">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="cursor-pointer appearance-none rounded bg-transparent pr-6 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#1a2036]">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4" aria-hidden="true" />
        </label>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#151d32] p-8 text-center text-slate-300">
          No sessions match the current filters.
        </div>
      ) : (
        grouped.map(({ venueName, venueCity, sessions: venueSessions }) => (
          <article key={venueName} className="border-b border-white/10 py-8 first:pt-0 last:border-b-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{venueName}</h2>
                <p className="mt-2 text-sm text-slate-300">{venueCity}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827] px-3 py-1.5 text-[11px] font-medium text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" />
                {getDisplayDate(venueSessions[0]?.startsAt ?? '')}
              </div>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto [scrollbar-width:none]">
              {venueSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  )
}

function Pagination() {
  const [page, setPage] = useState(3)
  const total = 10
  const pages: Array<number | '...'> = [1, 2, 3, '...', total]

  const btn = 'flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]'

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        className={`${btn} bg-[#1c2238] hover:bg-[#262d48]`}
      >
        <span className="text-lg">‹</span>
      </button>

      {pages.map((item, index) =>
        item === '...' ? (
          <span key={`dots-${index}`} className="w-10 text-center text-slate-300">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={page === item ? 'page' : undefined}
            onClick={() => setPage(item)}
            className={`${btn} ${page === item ? 'bg-[#ef3a22] font-semibold' : 'text-slate-200 hover:bg-[#1c2238]'}`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => setPage((current) => Math.min(total, current + 1))}
        className={`${btn} bg-[#1c2238] hover:bg-[#262d48]`}
      >
        <span className="text-lg">›</span>
      </button>
    </nav>
  )
}

export default function MovieDetailsPage() {
  const { slug } = useParams()
  const movieQuery = useMovie(slug ?? '')
  const sessionsQuery = useMovieSessions(slug ?? '')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [date, setDate] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('Showtime: earliest first')

  const movie = movieQuery.data
  const sessions = sessionsQuery.data ?? []

  useEffect(() => {
    if (!movie?.availableDates?.length) return
    if (!date) {
      setDate(movie.availableDates[0])
    }
  }, [date, movie])

  const optionValues = useMemo(() => {
    const venueMap = new Map<string, { label: string; hint?: string }>()
    const formatMap = new Map<string, { label: string }>()
    const languageMap = new Map<string, { label: string }>()
    const timeMap = new Map<string, { label: string; hint?: string }>()

    for (const venueGroup of sessions) {
      const label = venueGroup.venue.name
      if (!venueMap.has(label)) {
        venueMap.set(label, { label, hint: venueGroup.venue.city })
      }

      for (const session of venueGroup.sessions) {
        if (!formatMap.has(session.format.name)) {
          formatMap.set(session.format.name, { label: session.format.name })
        }
        if (!languageMap.has(session.language.name)) {
          languageMap.set(session.language.name, { label: session.language.name })
        }
        const timeLabel = TIME_LABELS[session.timeBand] ?? 'Evening'
        if (!timeMap.has(timeLabel)) {
          timeMap.set(timeLabel, { label: timeLabel, hint: `before ${session.time}` })
        }
      }
    }

    return {
      venues: Array.from(venueMap.values()),
      formats: Array.from(formatMap.values()),
      languages: Array.from(languageMap.values()),
      timeBands: Array.from(timeMap.values()),
    }
  }, [sessions])

  const allSessions = useMemo<FlatSession[]>(() => {
    return sessions.flatMap((group) =>
      group.sessions.map((session) => ({
        ...session,
        venueName: group.venue.name,
        venueCity: group.venue.city,
      })),
    )
  }, [sessions])

  const visibleSessions = useMemo(() => {
    const selectedFormats = new Set<string>()
    const selectedLanguages = new Set<string>()
    const selectedTimes = new Set<string>()
    const selectedVenues = new Set<string>()

    for (const key of selected) {
      const [group, value] = key.split(':')
      if (!value) continue
      const label = value.trim()
      if (group === 'Format') selectedFormats.add(label)
      if (group === 'Language') selectedLanguages.add(label)
      if (group === 'Time of day') selectedTimes.add(label)
      if (group === 'Venue') selectedVenues.add(label)
    }

    const filtered = allSessions.filter((session) => {
      const matchesDate = !date || session.date === date || session.startsAt.startsWith(date)
      const matchesVenue = selectedVenues.size === 0 || selectedVenues.has(session.venue.name)
      const matchesFormat = selectedFormats.size === 0 || selectedFormats.has(session.format.name)
      const matchesLanguage = selectedLanguages.size === 0 || selectedLanguages.has(session.language.name)
      const matchesTime = selectedTimes.size === 0 || selectedTimes.has(TIME_LABELS[session.timeBand] ?? 'Evening')

      return matchesDate && matchesVenue && matchesFormat && matchesLanguage && matchesTime
    })

    const sorted = [...filtered]
    if (sort === 'Showtime: latest first') {
      sorted.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    } else if (sort === 'Price: low to high') {
      sorted.sort((a, b) => a.price - b.price)
    } else {
      sorted.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    }

    return sorted
  }, [allSessions, date, selected, sort])

  const toggleFilter = (key: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    for (const session of allSessions) {
      if (session.date) dates.add(session.date)
    }
    if (movie?.availableDates?.length) {
      for (const value of movie.availableDates) {
        if (value) dates.add(value)
      }
    }
    return Array.from(dates).sort()
  }, [allSessions, movie])

  if (movieQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <AppLayout>
        <div className="container py-12">
          <Spinner label="Loading movie details" />
        </div>
      </AppLayout>
    )
  }

  if (movieQuery.isError || sessionsQuery.isError) {
    return (
      <AppLayout>
        <div className="container py-12">
          <ErrorBanner
            message={parseApiError(movieQuery.error ?? sessionsQuery.error).message}
            onRetry={() => {
              void movieQuery.refetch()
              void sessionsQuery.refetch()
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

  const poster = movie.posterUrl ?? 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80'

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0f1115] px-6 py-6 text-white">
        <div className="mx-auto max-w-[1728px]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#121a2d]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,58,34,0.22),transparent_50%)]" />
            <div className="relative grid gap-8 p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-10">
              <img src={poster} alt={`${movie.title} poster`} className="h-[420px] w-full rounded-[22px] object-cover shadow-2xl shadow-black/30" />

              <div className="flex flex-col justify-between gap-6">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#ef3a22]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ef3a22]">
                      {movie.ageRating.code}
                    </span>
                    <span className="text-sm text-slate-300">{movie.kind}</span>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{movie.title}</h1>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <span>{movie.runtimeMinutes} min</span>
                    <span>•</span>
                    <span>{movie.genres.map((genre) => genre.name).join(' • ') || 'Film'}</span>
                    <span>•</span>
                    <span>From {formatGel(movie.fromPrice)}</span>
                  </div>

                  <p className="mt-6 max-w-[760px] text-base leading-7 text-slate-200">{movie.synopsis || 'No synopsis available for this title yet.'}</p>
                </div>

                <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-[#172033] p-4">
                    <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Director</p>
                    <p className="mt-2 font-semibold">{movie.director || 'TBA'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#172033] p-4">
                    <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Cast</p>
                    <p className="mt-2 font-semibold">{movie.cast || 'TBA'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#172033] p-4">
                    <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Release</p>
                    <p className="mt-2 font-semibold">{movie.releaseDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <main className="mt-8 flex max-w-[1728px] flex-col gap-8 lg:flex-row">
            <Filters
              selected={selected}
              date={date}
              dates={availableDates}
              options={optionValues}
              onToggle={toggleFilter}
              onDateChange={setDate}
            />

            <section className="min-w-0 flex-1">
              <SessionsList sort={sort} setSort={setSort} sessions={visibleSessions} />
              <Pagination />
            </section>
          </main>
        </div>
      </div>
    </AppLayout>
  )
}
