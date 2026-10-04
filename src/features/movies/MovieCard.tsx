import { Link } from 'react-router-dom'
import type { Movie } from '@/types/models'
import { formatGel } from '@/utils/formatters'

export function MovieCard({ movie }: { movie: Movie }) {
  const genre = movie.genres[0]?.name ?? movie.kind
  return (
    <article className="film-card">
      <Link to={`/movies/${movie.slug}`}>
        {movie.posterUrl ? <img src={movie.posterUrl} alt={`${movie.title} poster`} /> : <div className="poster-fallback" />}
        <h3>{movie.title}</h3>
        <p>
          {genre} · {movie.runtimeMinutes} min
        </p>
        <small>{movie.ageRating.code}</small>
      </Link>
      <footer>
        <strong>From {formatGel(movie.fromPrice)}</strong>
        <Link className="button button-red" to={`/movies/${movie.slug}`}>
          Buy Ticket
        </Link>
      </footer>
    </article>
  )
}
