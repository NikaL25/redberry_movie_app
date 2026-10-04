import { ChevronLeft, ChevronRight, Clock3, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { Movie } from '@/types/models'
import { formatRuntime } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [slide, setSlide] = useState(0)
  if (!movies.length) return null
  const movie = movies[Math.min(slide, movies.length - 1)]
  const backdrop = movie.backdropUrl ?? movie.posterUrl ?? ''

  return (
    <section className="hero" style={backdrop ? { backgroundImage: `url('${backdrop}')` } : undefined}>
      <div className="hero-overlay" />
      <div className="hero-content container">
        <div className="eyebrow">{movie.isFeatured ? 'FEATURED' : 'NOW PLAYING'}</div>
        <h1>{movie.title.toUpperCase()}</h1>
        <div className="meta">
          <span>{movie.ageRating.code}</span>
          <span>
            <Clock3 size={14} /> {formatRuntime(movie.runtimeMinutes)}
          </span>
          {movie.formats.slice(0, 2).map((format) => (
            <span key={format.id}>{format.name}</span>
          ))}
        </div>
        <p>
          {movie.genres.map((genre) => genre.name).join(' · ')}
        </p>
        <div className="hero-buttons">
          <Link to={`/movies/${movie.slug}`}>
            <Button>
              <Ticket size={16} /> Buy tickets
            </Button>
          </Link>
          <Link to="/sessions">
            <Button variant="dark">All sessions</Button>
          </Link>
        </div>
      </div>
      <div className="slider container">
        <div className="progress">
          {movies.map((item, index) => (
            <i key={item.id} className={index === slide ? 'active' : ''} />
          ))}
        </div>
        <button aria-label="Previous slide" type="button" onClick={() => setSlide((value) => Math.max(0, value - 1))}>
          <ChevronLeft />
        </button>
        <button
          aria-label="Next slide"
          type="button"
          onClick={() => setSlide((value) => Math.min(movies.length - 1, value + 1))}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  )
}
