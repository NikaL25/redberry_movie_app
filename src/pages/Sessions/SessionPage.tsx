import { useMemo } from 'react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Ticket,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState, ErrorBanner, Spinner } from '@/components/feedback/Status'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useMovie } from '@/features/movies/moviesQueries'
import {
  useFilterOptions,
  useSessions,
} from '@/features/sessions/sessionsQueries'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useUrlFilters } from '@/hooks/useUrlFilters'

import type { SessionFilters } from '@/types/api'
import type {
  FilterOptions,
  Movie,
  MovieDetail,
  Session,
  SessionGroup,
} from '@/types/models'

import {
  dayNumber,
  formatGel,
  formatReleaseDate,
  nextDays,
  weekdayShort,
} from '@/utils/formatters'
import { parseApiError } from '@/utils/errorHandling'

function Hero({
  movie,
  details,
}: {
  movie: Movie | undefined
  details: MovieDetail | undefined
}) {
  const image = movie?.backdropUrl ?? movie?.posterUrl

  const genres = movie?.genres
    .map((genre) => genre.name)
    .join(' · ')

  const formats = movie?.formats
    .map((format) => format.name)
    .join(' · ')

  return (
    <section className="relative isolate min-h-[380px] overflow-hidden bg-[#101827] text-white md:min-h-[500px]">
      {image ? (
        <img
          src={image}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
      ) : null}

      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090d17]/95 via-[#090d17]/75 to-[#090d17]/30" />

      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#090d17] via-transparent to-[#090d17]/30" />

      <div className="container flex min-h-[380px] items-end gap-7 px-6 pb-10 pt-28 md:min-h-[500px] md:gap-10 md:px-12 md:pb-14">
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
                {movie.isComingSoon
                  ? 'Coming soon'
                  : 'Now playing'}
              </span>

              <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-5xl">
                {movie.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85">
                {details?.synopsis ||
                  genres ||
                  'Browse available cinema sessions and choose a showtime.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#ef3a22]/20 px-3 py-1.5 text-xs font-bold text-[#ff735d]">
                  {movie.ageRating.code}
                </span>

                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                  <Clock3
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {movie.runtimeMinutes} min
                </span>

                {formats ? (
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                    {formats}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff735d]">
                Kino XII
              </span>

              <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                Sessions
              </h1>

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
    <label className="group flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
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
        {label}
      </span>

      {hint ? (
        <span className="text-xs text-slate-400">
          · {hint}
        </span>
      ) : null}
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

  const selectedVenues = options.venues.filter((venue) =>
    filters.venues.includes(venue.slug),
  )

  /*
   * Если выбраны кинотеатры:
   *
   * показываем только форматы,
   * реально доступные хотя бы в одном
   * выбранном кинотеатре.
   *
   * Если кинотеатр не выбран:
   * показываем все форматы.
   */
  const formats = selectedVenues.length
    ? options.formats.filter((format) =>
        selectedVenues.some((venue) =>
          venue.formats.some(
            (item) => item.slug === format.slug,
          ),
        ),
      )
    : options.formats

  const activeCount =
    filters.venues.length +
    filters.formats.length +
    filters.languages.length +
    filters.bands.length +
    (filters.search.trim() ? 1 : 0)

  const toggle = (
    key:
      | 'venues'
      | 'formats'
      | 'languages'
      | 'bands',
    slug: string,
  ) => {
    const current = filters[key]

    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]

    const patch: Partial<SessionFilters> = {
      [key]: next,
    }

    /*
     * При изменении Venue необходимо пересчитать
     * выбранные Format.
     *
     * Форматы, которые больше недоступны
     * в выбранных кинотеатрах, автоматически
     * удаляются из активного фильтра.
     */
    if (key === 'venues') {
      const selected = options.venues.filter((venue) =>
        next.includes(venue.slug),
      )

      const allowedFormats = new Set(
        selected.flatMap((venue) =>
          venue.formats.map(
            (format) => format.slug,
          ),
        ),
      )

      patch.formats = selected.length
        ? filters.formats.filter((slug) =>
            allowedFormats.has(slug),
          )
        : filters.formats
    }

    onChange(patch)
  }

  const clearAllFilters = () => {
    /*
     * Date НЕ очищаем.
     *
     * По ТЗ Clear All Filters должен очищать
     * все выбранные фильтры, кроме даты.
     *
     * Search также очищаем, потому что он является
     * фильтром текущего Sessions UI.
     *
     * Sort НЕ очищаем:
     * сортировка — отдельное состояние,
     * а не filter.
     */
    onChange({
      venues: [],
      formats: [],
      languages: [],
      bands: [],
      search: '',
    })
  }

  const checkboxGroup = (
    title: string,
    items: Array<{
      slug: string
      name: string
      hint?: string
    }>,
    key:
      | 'venues'
      | 'formats'
      | 'languages'
      | 'bands',
  ) => (
    <fieldset>
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">
        {title}
      </legend>

      <div className="space-y-2.5">
        {items.map((item) => (
          <FilterCheckbox
            key={item.slug}
            label={item.name}
            hint={item.hint}
            checked={filters[key].includes(item.slug)}
            onChange={() =>
              toggle(key, item.slug)
            }
          />
        ))}
      </div>
    </fieldset>
  )

  return (
    <aside className="h-fit w-full shrink-0 self-start rounded-2xl bg-[#171e30] p-5 text-white lg:sticky lg:top-6 lg:w-[290px]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Filters
        </h2>

        <span className="text-xs text-slate-400">
          {activeCount} active
        </span>
      </div>

      {checkboxGroup(
        'Venue',
        options.venues.map((venue) => ({
          slug: venue.slug,
          name: venue.name,
          hint: venue.city,
        })),
        'venues',
      )}

      <hr className="my-5 border-white/10" />

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-slate-400">
          Date
        </legend>

        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {dates.map((date) => (
            <button
              key={date}
              type="button"
              aria-pressed={
                filters.date === date
              }
              onClick={() =>
                onChange({ date })
              }
              className={`w-9 shrink-0 rounded-md py-2 text-xs font-medium leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
                filters.date === date
                  ? 'bg-[#ef3a22]'
                  : 'bg-[#252d43] hover:bg-[#303a56]'
              }`}
            >
              {weekdayShort(date)}
              <br />
              {dayNumber(date)}
            </button>
          ))}
        </div>
      </fieldset>

      <hr className="my-5 border-white/10" />

      {checkboxGroup(
        'Format',
        formats.map((format) => ({
          slug: format.slug,
          name: format.name,
        })),
        'formats',
      )}

      <hr className="my-5 border-white/10" />

      {checkboxGroup(
        'Language',
        options.languages.map(
          (language) => ({
            slug: language.slug,
            name: language.name,
          }),
        ),
        'languages',
      )}

      <hr className="my-5 border-white/10" />

      {checkboxGroup(
        'Time of day',
        options.timeBands.map((band) => ({
          slug: band.id,
          name: band.label,
        })),
        'bands',
      )}

      <div className="mt-6 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className="w-full rounded-lg border border-white/10 bg-[#252d43] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#303a56] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear All Filters
        </button>

        <p className="mt-3 text-center text-xs text-slate-400">
          {activeCount}{' '}
          {activeCount === 1
            ? 'filter'
            : 'filters'}{' '}
          active
        </p>
      </div>
    </aside>
  )
}


function SessionTicket({
  session,
}: {
  session: Session
}) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()

  const soldOut =
    session.isSoldOut ||
    session.seatsLeft <= 0

  const tooYoung =
    user?.age != null &&
    user.age < session.movie.ageRating.minAge

  const disabled =
    soldOut || tooYoung

  const lowAvailability =
    session.seatsLeft > 0 &&
    session.seatsLeft <= 5

  return (
    <button
      type="button"
      disabled={disabled}
      title={
        tooYoung
          ? `You must be at least ${session.movie.ageRating.minAge}`
          : undefined
      }
      aria-label={`${session.time}, ${session.language.name}, ${session.format.name}, ${
        soldOut
          ? 'sold out'
          : `${session.seatsLeft} seats left`
      }, ${formatGel(session.price)}`}
      onClick={() =>
        startBooking(session.id)
      }
      className={`group flex h-[82px] w-[224px] shrink-0 overflow-hidden rounded-xl text-left transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22] ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:opacity-85'
      }`}
    >
      <span className="flex w-[138px] flex-col items-center justify-center bg-[#0c1220] px-2 text-white">
        <span className="text-xl font-bold">
          {session.time}
        </span>

        <span className="mt-1 flex max-w-full items-center gap-1.5 text-[11px] text-white/65">
          <span className="truncate">
            {session.language.name}
          </span>

          <span className="shrink-0 rounded-full bg-[#262d3f] px-2 py-0.5 font-semibold text-white/80">
            {session.format.name}
          </span>
        </span>
      </span>

      <span className="relative flex flex-1 flex-col items-center justify-center bg-[#0c1220] text-white">
        <span className="absolute -left-[5px] top-[-5px] h-[10px] w-[10px] rounded-full bg-[#171e30]" />

        <span className="absolute -left-[5px] bottom-[-5px] h-[10px] w-[10px] rounded-full bg-[#171e30]" />

        <span className="absolute inset-y-2 left-0 border-l-2 border-dashed border-white/20" />

        <span className="text-lg font-extrabold text-[#ff6046]">
          {formatGel(session.price)}
        </span>

        <span
          className={`mt-0.5 flex items-center gap-1 text-[11px] ${
            lowAvailability
              ? 'text-[#ff6046]'
              : 'text-white/60'
          }`}
        >
          {soldOut ? (
            'Sold out'
          ) : (
            <>
              <Ticket
                className="h-3 w-3 -rotate-45"
                fill="currentColor"
                aria-hidden="true"
              />
              {session.seatsLeft} left
            </>
          )}
        </span>
      </span>
    </button>
  )
}

function SessionsSkeleton() {
  return (
    <section
      aria-label="Loading sessions"
      aria-busy="true"
      className="min-w-0 flex-1 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 animate-pulse rounded bg-white/10" />

        <div className="h-8 w-36 animate-pulse rounded bg-white/10" />
      </div>

      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className="rounded-xl bg-[#171e30] p-5"
          >
            <div className="mb-5 flex items-center gap-4">
              <div className="h-[76px] w-[54px] animate-pulse rounded bg-white/10" />

              <div className="flex-1 space-y-2">
                <div className="h-5 w-56 animate-pulse rounded bg-white/10" />

                <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
              </div>
            </div>

            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 4 }).map(
                (__, ticketIndex) => (
                  <div
                    key={ticketIndex}
                    className="h-[82px] w-[224px] shrink-0 animate-pulse rounded-xl bg-white/10"
                  />
                ),
              )}
            </div>
          </div>
        ),
      )}
    </section>
  )
}

function getPageNumbers(
  currentPage: number,
  lastPage: number,
): Array<number | 'ellipsis'> {
  if (lastPage <= 7) {
    return Array.from(
      { length: lastPage },
      (_, index) => index + 1,
    )
  }

  const pages: Array<number | 'ellipsis'> = []

  pages.push(1)

  if (currentPage > 4) {
    pages.push('ellipsis')
  }

  const start = Math.max(
    2,
    currentPage - 1,
  )

  const end = Math.min(
    lastPage - 1,
    currentPage + 1,
  )

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(page)
  }

  if (
    currentPage <
    lastPage - 3
  ) {
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
  onChange: (
    patch: Partial<SessionFilters>,
  ) => void
  meta: {
    totalSessions: number
    currentPage: number
    lastPage: number
  }
}) {
  return (
    <section className="min-w-0 flex-1 text-white">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold">
          {meta.totalSessions > 0
            ? `Showing ${meta.totalSessions} sessions`
            : 'No sessions found'}
        </p>

        <label className="relative flex items-center gap-2 text-sm">
          <span className="text-slate-400">
            Sort:
          </span>

          <select
            value={filters.sort}
            onChange={(event) =>
              onChange({
                sort: event.target.value,
              })
            }
            className="cursor-pointer appearance-none rounded bg-transparent pr-6 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#ef3a22]"
          >
            {options.sorts.map(
              (sort) => (
                <option
                  key={sort.id}
                  value={sort.id}
                  className="bg-[#171e30]"
                >
                  {sort.label}
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

      {groups.length === 0 ? (
        <EmptyState
          title="No sessions match these filters"
          text="Try another date, venue or format."
        />
      ) : (
        <>
          {groups.map((group) => (
            <article
              key={group.movie.id}
              className="border-b border-white/10 py-7 first:pt-0 last:border-b-0"
            >
              <div className="mb-4 flex items-center gap-4">
                {group.movie.posterUrl ? (
                  <Link
                    to={`/movies/${group.movie.slug}`}
                    aria-label={`View ${group.movie.title}`}
                  >
                    <img
                      src={group.movie.posterUrl}
                      alt={`${group.movie.title} poster`}
                      className="h-[76px] w-[54px] rounded object-cover"
                    />
                  </Link>
                ) : null}

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/movies/${group.movie.slug}`}
                      className="text-lg font-bold hover:text-[#ff735d]"
                    >
                      {group.movie.title}
                    </Link>

                    <span className="rounded-full bg-[#ef3a22]/15 px-2 py-0.5 text-[11px] font-medium text-[#ff735d]">
                      {group.movie.ageRating.code}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">
                    {group.movie.runtimeMinutes} min · From{' '}
                    {formatGel(
                      group.movie.fromPrice,
                    )}
                  </p>
                </div>
              </div>

              {Array.from(
                group.sessions.reduce(
                  (
                    venues,
                    session,
                  ) => {
                    const key = `${session.venue.id}:${session.hall.id}`

                    const existing =
                      venues.get(key)

                    if (existing) {
                      existing.push(
                        session,
                      )
                    } else {
                      venues.set(
                        key,
                        [session],
                      )
                    }

                    return venues
                  },
                  new Map<
                    string,
                    Session[]
                  >(),
                ),
              ).map(
                ([key, venueSessions]) => {
                  const firstSession =
                    venueSessions[0]

                  return (
                    <div
                      key={key}
                      className="mb-4 rounded-xl bg-[#171e30] p-4 last:mb-0"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold">
                          {
                            firstSession
                              .venue.name
                          }{' '}
                          <span className="font-normal text-slate-400">
                            ·{' '}
                            {
                              firstSession
                                .venue
                                .city
                            }
                          </span>
                        </h3>

                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {firstSession.date} · Hall{' '}
                          {
                            firstSession
                              .hall.name
                          }
                        </span>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                        {venueSessions.map(
                          (session) => (
                            <SessionTicket
                              key={
                                session.id
                              }
                              session={
                                session
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )
                },
              )}
            </article>
          ))}

          {meta.lastPage > 1 ? (
            <nav
              aria-label="Sessions pagination"
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              <button
                type="button"
                aria-label="Previous page"
                disabled={
                  meta.currentPage <=
                  1
                }
                onClick={() =>
                  onChange({
                    page:
                      meta.currentPage -
                      1,
                  })
                }
                className="rounded-lg bg-[#171e30] p-2 text-white transition-colors hover:bg-[#252d43] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>

              {getPageNumbers(
                meta.currentPage,
                meta.lastPage,
              ).map(
                (
                  page,
                  index,
                ) =>
                  page ===
                  'ellipsis' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-sm text-slate-500"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      aria-current={
                        page ===
                        meta.currentPage
                          ? 'page'
                          : undefined
                      }
                      onClick={() =>
                        onChange({
                          page,
                        })
                      }
                      className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        page ===
                        meta.currentPage
                          ? 'bg-[#ef3a22] text-white'
                          : 'bg-[#171e30] text-slate-300 hover:bg-[#252d43] hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ),
              )}

              <button
                type="button"
                aria-label="Next page"
                disabled={
                  meta.currentPage >=
                  meta.lastPage
                }
                onClick={() =>
                  onChange({
                    page:
                      meta.currentPage +
                      1,
                  })
                }
                className="rounded-lg bg-[#171e30] p-2 text-white transition-colors hover:bg-[#252d43] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>

              <span className="ml-2 text-sm text-slate-400">
                Page{' '}
                {meta.currentPage} of{' '}
                {meta.lastPage}
              </span>
            </nav>
          ) : null}
        </>
      )}
    </section>
  )
}

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
    [
      'DIRECTOR',
      details?.director ||
        'Not announced',
    ],
    [
      'MAIN CAST',
      details?.cast ||
        'Not announced',
    ],
    [
      'DURATION',
      `${movie.runtimeMinutes} minutes`,
    ],
    [
      'RELEASE DATE',
      movie.releaseDate
        ? formatReleaseDate(
            movie.releaseDate,
          )
        : 'Not announced',
    ],
    [
      'FORMATS',
      movie.formats
        .map(
          (format) =>
            format.name,
        )
        .join(', ') ||
        'Not announced',
    ],
    [
      'FROM',
      formatGel(
        movie.fromPrice,
      ),
    ],
    [
      'VENUE',
      group?.sessions[0]
        ?.venue.name ??
        'See available sessions',
    ],
  ]

  return (
    <aside className="h-fit rounded-2xl bg-[#171e30] p-5 text-white">
      <h2 className="text-lg font-bold">
        Details
      </h2>

      <dl className="mt-5 space-y-4">
        {rows.map(
          ([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-medium tracking-wide text-slate-400">
                {label}
              </dt>

              <dd className="mt-1 text-sm font-semibold leading-5">
                {value}
              </dd>
            </div>
          ),
        )}
      </dl>

      <div className="mt-5 rounded-lg bg-[#30221c] px-3 py-3 text-[#ffb15e]">
        <p className="text-xs font-semibold">
          RATING NOTE
        </p>

        <p className="mt-1 text-xs leading-5">
          <strong>
            {movie.ageRating.code}
          </strong>{' '}
          {movie.ageRating
            .description ||
            `Tickets are restricted to viewers aged ${movie.ageRating.minAge} and over.`}
        </p>
      </div>
    </aside>
  )
}

export function SessionPage() {
  const [filters, setFilters] =
    useUrlFilters()

  /*
   * Search is debounced only for the API request.
   *
   * The actual search value remains in the URL immediately,
   * so refresh / copy-paste / browser Back preserve exactly
   * what the user entered.
   */
  const debouncedSearch = useDebounce(
    filters.search,
    300,
  )

  const requestFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch],
  )

  const options = useFilterOptions()

  const sessions =
    useSessions(requestFilters)

  const firstGroup =
    sessions.data?.data[0]

  const featuredMovie =
    firstGroup?.movie

  const detailsQuery =
    useMovie(
      featuredMovie?.slug ?? '',
    )

  return (
    <AppLayout overlayHeader>
      <Hero
        movie={featuredMovie}
        details={detailsQuery.data}
      />

      <main className="container px-5 pb-20 pt-8 md:px-8">
        <div className="mb-7 flex flex-col gap-4 border-b border-white/10 pb-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff735d]">
              All venues · Live availability
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Sessions
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Browse showtimes and book seats directly.
            </p>
          </div>

          <label className="flex h-11 w-full items-center gap-2 rounded-full border border-white/10 bg-[#171e30] px-4 text-slate-300 sm:max-w-sm">
            <span className="sr-only">
              Search sessions
            </span>

            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters({
                  search:
                    event.target.value,
                })
              }
              placeholder="Search films and live events"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        {options.isLoading ? (
          <Spinner label="Loading session filters" />
        ) : null}

        {options.isError ? (
          <ErrorBanner
            message={
              parseApiError(
                options.error,
              ).message
            }
            onRetry={() =>
              void options.refetch()
            }
          />
        ) : null}

        {sessions.isLoading ? (
          <SessionsSkeleton />
        ) : null}

        {sessions.isError ? (
          <ErrorBanner
            message={
              parseApiError(
                sessions.error,
              ).message
            }
            onRetry={() =>
              void sessions.refetch()
            }
          />
        ) : null}

        {options.data &&
        sessions.data ? (
          <div className="grid items-start gap-7 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)_280px]">
            <Filters
              options={options.data}
              filters={filters}
              onChange={setFilters}
            />

            <SessionResults
              groups={
                sessions.data.data
              }
              options={options.data}
              filters={filters}
              onChange={setFilters}
              meta={sessions.data.meta}
            />

            <div className="lg:col-span-2 xl:col-span-1">
              <MovieDetails
                movie={featuredMovie}
                details={
                  detailsQuery.data
                }
                group={firstGroup}
              />
            </div>
          </div>
        ) : null}
      </main>
    </AppLayout>
  )
}
