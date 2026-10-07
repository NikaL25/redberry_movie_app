import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useMovieSearch } from '@/features/movies/moviesQueries'
import { formatGel } from '@/utils/formatters'

export function SearchTypeahead() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(query, 300)
  const { data, isFetching } = useMovieSearch(debounced.trim())
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onClick)

    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const results = data ?? []

  return (
    <div
      ref={root}
      className="search-wrap relative h-[41px] w-[390px]"
    >
      <label
        className="search-box flex h-[41px] w-[390px] items-center rounded-full border border-white/[0.08] bg-[#111923]/90 px-4 text-white/45 transition-colors focus-within:border-white/[0.14] focus-within:bg-[#141d29]"
      >
        <Search
          size={16}
          aria-hidden="true"
          className="mr-2.5 shrink-0 text-white/45"
        />

        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search films and live events"
          aria-label="Search films and live events"
          className="min-w-0 flex-1 bg-transparent text-[11px] font-medium tracking-tight text-white outline-none placeholder:text-white/40"
        />
      </label>

      {open && query.trim() ? (
        <div
          className="search-results absolute left-0 top-[calc(100%+8px)] z-[60] w-[390px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d15] shadow-2xl"
          role="listbox"
        >
          {isFetching ? (
            <p className="search-empty px-4 py-3 text-[13px] text-white/50">
              Searching…
            </p>
          ) : null}

          {!isFetching && results.length === 0 ? (
            <p className="search-empty px-4 py-3 text-[13px] text-white/50">
              No titles match that search.
            </p>
          ) : null}

          {results.map((movie) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.slug}`}
              className="search-item flex items-center gap-3 border-b border-white/[0.05] px-3 py-2.5 transition-colors last:border-b-0 hover:bg-white/[0.04]"
              onClick={() => {
                setOpen(false)
                setQuery('')
              }}
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt=""
                  className="h-12 w-8 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="search-poster h-12 w-8 shrink-0 rounded-md bg-white/[0.06]" />
              )}

              <span className="min-w-0">
                <strong className="block truncate text-[13px] font-semibold text-white">
                  {movie.title}
                </strong>

                <small className="mt-1 block text-[11px] text-white/40">
                  {movie.ageRating.code} · {movie.runtimeMinutes} min · from{' '}
                  {formatGel(movie.fromPrice)}
                </small>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
