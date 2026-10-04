import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FilterOptions, SessionGroup } from '@/types/models'
import type { SessionFilters, SessionsListResponse } from '@/types/api'
import { SessionCard } from './SessionCard'
import { EmptyState } from '@/components/feedback/Status'

type Props = {
  data: SessionsListResponse
  options: FilterOptions
  filters: SessionFilters
  onChange: (patch: Partial<SessionFilters>) => void
}

export function SessionsResults({ data, options, filters, onChange }: Props) {
  if (!data.data.length) {
    return <EmptyState title="No sessions match these filters" text="Try another date, venue or format." />
  }

  return (
    <div>
      <div className="results-bar">
        <p>Showing {data.meta.totalSessions} sessions</p>
        <label className="sort">
          <span>Sort:</span>
          <select value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })}>
            {options.sorts.map((sort) => (
              <option key={sort.id} value={sort.id}>
                {sort.label}
              </option>
            ))}
          </select>
          <ChevronDown className="sort-icon" aria-hidden="true" />
        </label>
      </div>
      {data.data.map((group) => (
        <MovieBlock key={group.movie.id} group={group} />
      ))}
      {data.meta.lastPage > 1 ? (
        <nav className="pager" aria-label="Pagination">
          <button type="button" disabled={data.meta.currentPage <= 1} onClick={() => onChange({ page: data.meta.currentPage - 1 })}>
            Previous
          </button>
          <span>
            Page {data.meta.currentPage} of {data.meta.lastPage}
          </span>
          <button
            type="button"
            disabled={data.meta.currentPage >= data.meta.lastPage}
            onClick={() => onChange({ page: data.meta.currentPage + 1 })}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  )
}

function MovieBlock({ group }: { group: SessionGroup }) {
  return (
    <article className="movie-block">
      <div className="movie-block-head">
        {group.movie.posterUrl ? <img src={group.movie.posterUrl} alt="" /> : null}
        <div>
          <div className="movie-block-title">
            <Link to={`/movies/${group.movie.slug}`}>
              <h2>{group.movie.title}</h2>
            </Link>
            <span>{group.movie.ageRating.code}</span>
          </div>
          <p>{group.movie.runtimeMinutes} min</p>
        </div>
      </div>
      <div className="session-row">
        {group.sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </article>
  )
}
