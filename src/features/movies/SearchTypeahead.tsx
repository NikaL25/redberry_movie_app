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
    <div className="search-wrap" ref={root}>
      <label className="search-box">
        <Search size={16} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search films and live events"
          aria-label="Search films and live events"
        />
      </label>
      {open && query.trim() ? (
        <div className="search-results" role="listbox">
          {isFetching ? <p className="search-empty">Searching…</p> : null}
          {!isFetching && results.length === 0 ? <p className="search-empty">No titles match that search.</p> : null}
          {results.map((movie) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.slug}`}
              className="search-item"
              onClick={() => {
                setOpen(false)
                setQuery('')
              }}
            >
              {movie.posterUrl ? <img src={movie.posterUrl} alt="" /> : <span className="search-poster" />}
              <span>
                <strong>{movie.title}</strong>
                <small>
                  {movie.ageRating.code} · {movie.runtimeMinutes} min · from {formatGel(movie.fromPrice)}
                </small>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
