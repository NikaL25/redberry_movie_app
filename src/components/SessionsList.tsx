import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MOVIES, type Movie } from './data';
import { SessionCard } from './SessionCard';

const SORT_OPTIONS = ['Showtime: earliest first', 'Showtime: latest first', 'Title: A–Z'];

const MovieBlock = ({ movie }: { movie: Movie }) => (
  <article className="border-b border-white/10 py-8 first:pt-0 last:border-b-0">
    <div className="flex items-center gap-4">
      <img src={movie.poster} alt={`${movie.title} poster`} className="w-14 h-20 rounded object-cover" />
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{movie.title}</h2>
          <span className="rounded-full bg-[#ef3a22]/15 px-2 py-0.5 text-[11px] font-medium text-[#ef3a22]">
            {movie.rating}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">{movie.duration} min</p>
      </div>
    </div>

    <div className="mt-4 flex gap-3 overflow-x-auto [scrollbar-width:none]">
      {movie.sessions.map((session) => (
        <SessionCard key={session.time} session={session} />
      ))}
    </div>
  </article>
);

export const SessionsList = () => {
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const total = MOVIES.reduce((n, m) => n + m.sessions.length, 0);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Showing {total} sessions</p>
        <label className="relative flex items-center gap-2 text-sm">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-transparent pr-6 font-semibold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ef3a22] rounded"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#1a2036]">{o}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 w-4 h-4" aria-hidden="true" />
        </label>
      </div>

      {MOVIES.map((movie) => (
        <MovieBlock key={movie.id} movie={movie} />
      ))}
    </div>
  );
};
