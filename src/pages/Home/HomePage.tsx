import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBanner, Spinner } from '@/components/feedback/Status'
import { HeroCarousel } from '@/features/movies/HeroCarousel'
import { MovieCard } from '@/features/movies/MovieCard'
import { ComingSoonCard } from '@/features/movies/ComingSoonCard'
import { useComingSoon, useFeaturedMovies, useNowPlaying } from '@/features/movies/moviesQueries'
import { useAuth } from '@/hooks/useAuth'
import { parseApiError } from '@/utils/errorHandling'

export function HomePage() {
  const featured = useFeaturedMovies()
  const nowPlaying = useNowPlaying(6)
  const comingSoon = useComingSoon(6)
  const { user, isAuthenticated } = useAuth()

  return (
    <AppLayout overlayHeader>
      {isAuthenticated && user && !user.profileComplete ? (
        <div className="container">
          <p className="banner banner-warn">
            Your profile is incomplete. <Link to="/profile">Add your details</Link> to buy tickets.
          </p>
        </div>
      ) : null}
      {featured.isLoading ? <Spinner label="Loading premieres" /> : null}
      {featured.isError ? <ErrorBanner message={parseApiError(featured.error).message} onRetry={() => void featured.refetch()} /> : null}
      {featured.data ? <HeroCarousel movies={featured.data} /> : null}

      <section className="section container" id="now-playing">
        <header className="section-heading">
          <h2>NOW PLAYING</h2>
          <Link to="/sessions">See all</Link>
        </header>
        {nowPlaying.isLoading ? <Spinner /> : null}
        {nowPlaying.isError ? (
          <ErrorBanner message={parseApiError(nowPlaying.error).message} onRetry={() => void nowPlaying.refetch()} />
        ) : null}
        {nowPlaying.data?.length ? (
          <div className="film-grid">
            {nowPlaying.data.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : nowPlaying.data ? (
          <p>No films are playing right now.</p>
        ) : null}
      </section>

      <section className="section coming container">
        <header className="section-heading">
          <h2>COMING SOON...</h2>
        </header>
        {comingSoon.isLoading ? <Spinner /> : null}
        {comingSoon.isError ? (
          <ErrorBanner message={parseApiError(comingSoon.error).message} onRetry={() => void comingSoon.refetch()} />
        ) : null}
        {comingSoon.data?.length ? (
          <div className="coming-grid">
            {comingSoon.data.map((movie) => (
              <ComingSoonCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : comingSoon.data ? (
          <p>Nothing announced yet.</p>
        ) : null}
      </section>
    </AppLayout>
  )
}
