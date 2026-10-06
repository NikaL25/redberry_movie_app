import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBanner, Spinner } from '@/components/feedback/Status'
import { HeroCarousel } from '@/features/movies/HeroCarousel'
import { MovieCard } from '@/features/movies/MovieCard'
import { ComingSoonCard } from '@/features/movies/ComingSoonCard'
import { useComingSoon, useFeaturedMovies, useNowPlaying } from '@/features/movies/moviesQueries'
import { useAuth } from '@/hooks/useAuth'
import { parseApiError } from '@/utils/errorHandling'

const CONTAINER = 'w-full max-w-[1720px] mx-auto px-12'
const SECTION_TITLE = 'text-[16px] font-bold text-white tracking-widest uppercase'
const SEE_ALL = 'text-[12.5px] font-semibold text-[#e63920] hover:text-[#ff4d33] transition'
const EMPTY_TEXT = 'text-[13px] text-white/50'

export function HomePage() {
  const featured = useFeaturedMovies()
  const nowPlaying = useNowPlaying(6)
  const comingSoon = useComingSoon(6)
  const { user, isAuthenticated } = useAuth()

  return (
    <AppLayout overlayHeader>
      {isAuthenticated && user && !user.profileComplete ? (
        <div className={`${CONTAINER} pt-4`}>
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
            Your profile is incomplete.{' '}
            <Link to="/profile" className="font-semibold text-[#e63920] hover:text-[#ff4d33] underline-offset-2 hover:underline">
              Add your details
            </Link>{' '}
            to buy tickets.
          </p>
        </div>
      ) : null}

      {featured.isLoading ? <Spinner label="Loading premieres" /> : null}
      {featured.isError ? (
        <ErrorBanner message={parseApiError(featured.error).message} onRetry={() => void featured.refetch()} />
      ) : null}
      {featured.data ? <HeroCarousel movies={featured.data} /> : null}

      <section className={`${CONTAINER} pt-4 pb-12`} id="now-playing">
        <header className="flex items-center justify-between mb-5">
          <h2 className={SECTION_TITLE}>NOW PLAYING</h2>
          <Link to="/sessions" className={SEE_ALL}>
            See all
          </Link>
        </header>
        {nowPlaying.isLoading ? <Spinner /> : null}
        {nowPlaying.isError ? (
          <ErrorBanner message={parseApiError(nowPlaying.error).message} onRetry={() => void nowPlaying.refetch()} />
        ) : null}
        {nowPlaying.data?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {nowPlaying.data.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : nowPlaying.data ? (
          <p className={EMPTY_TEXT}>No films are playing right now.</p>
        ) : null}
      </section>

      <section className={`${CONTAINER} pt-2 pb-14 border-t border-white/[0.04]`}>
        <header className="flex items-center justify-between mb-5 pt-4">
          <h2 className={SECTION_TITLE}>COMING SOON...</h2>
        </header>
        {comingSoon.isLoading ? <Spinner /> : null}
        {comingSoon.isError ? (
          <ErrorBanner message={parseApiError(comingSoon.error).message} onRetry={() => void comingSoon.refetch()} />
        ) : null}
        {comingSoon.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {comingSoon.data.map((movie) => (
              <ComingSoonCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : comingSoon.data ? (
          <p className={EMPTY_TEXT}>Nothing announced yet.</p>
        ) : null}
      </section>
    </AppLayout>
  )
}