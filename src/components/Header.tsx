import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { SearchTypeahead } from '@/features/movies/SearchTypeahead'
import { useAuth } from '@/hooks/useAuth'
import { openAuthModal, setReplay } from '@/features/auth/authSlice'

export function Logo({ className = 'text-[19px]' }: { className?: string }) {
  return (
    <span className={`font-black tracking-wider text-white ${className}`}>
      KINO <span className="text-[#e63920]">XII</span>
    </span>
  )
}

export function Header({ overlay = false }: { overlay?: boolean }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const goProfile = () => {
    if (!isAuthenticated) {
      dispatch(setReplay({ type: 'profile' }))
      dispatch(openAuthModal('login'))
      return
    }
    navigate('/profile')
  }

  const goTickets = () => {
    if (!isAuthenticated) {
      dispatch(setReplay({ type: 'tickets' }))
      dispatch(openAuthModal('login'))
      return
    }
    navigate('/profile?tab=tickets')
  }

  return (
    <header
      className={
        overlay
          ? 'absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-[#070a11]/70 to-transparent'
          : 'relative z-50 border-b border-white/[0.04] bg-[#070a11]'
      }
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1720px] items-center justify-between gap-6 px-12">
        {/* Лого + Sessions */}
        <div className="flex items-center gap-9">
          <Link to="/" aria-label="Kino XII home" className="select-none">
            <Logo />
          </Link>
          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              `text-[12px] font-semibold uppercase tracking-[0.14em] transition ${
                isActive ? 'text-white' : 'text-white/70 hover:text-white'
              }`
            }
          >
            SESSIONS
          </NavLink>
        </div>

        {/* Поиск */}
        <div className="mx-4 w-full max-w-[420px] flex-1">
          <SearchTypeahead />
        </div>

        {/* Действия */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={goTickets}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-white/80 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63920]"
              >
                My Tickets
              </button>

              <button
                type="button"
                aria-label="My profile"
                onClick={goProfile}
                className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63920]"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#1f2937] text-[11px] font-bold tracking-tight text-white/90">
                    {(user.fullName ?? user.username).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <i
                  className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-[#070a11] ${
                    user.profileComplete ? 'bg-emerald-500' : 'bg-[#f97316]'
                  }`}
                  aria-label={user.profileComplete ? 'Profile complete' : 'Profile incomplete'}
                />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => dispatch(openAuthModal('register'))}
                className="h-[38px] rounded-full bg-[#ff3b19] px-5 text-[13px] font-semibold text-white shadow-sm transition duration-200 hover:bg-[#ff4e2d] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => dispatch(openAuthModal('login'))}
                className="h-[38px] rounded-full bg-white px-5 text-[13px] font-semibold text-[#0d1017] shadow-sm transition duration-200 hover:bg-[#f1f3f7] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63920]"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}