import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { SearchTypeahead } from '@/features/movies/SearchTypeahead'
import { useAuth } from '@/hooks/useAuth'
import { openAuthModal, setReplay } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/Button'

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
    <header className={overlay ? 'nav container nav-overlay' : 'nav container nav-solid'}>
      <Link className="brand" to="/" aria-label="Kino XII home">
        KINO <span>XII</span>
      </Link>
      <NavLink className="sessions" to="/sessions">
        SESSIONS
      </NavLink>
      <div className="nav-actions">
        <SearchTypeahead />
        {isAuthenticated && user ? (
          <>
            <button type="button" className="nav-text" onClick={goTickets}>
              My Tickets
            </button>
            <button type="button" className="avatar-link" aria-label="My profile" onClick={goProfile}>
              {user.avatar ? (
                <img src={user.avatar} alt="" className="avatar" />
              ) : (
                <span className="avatar avatar-fallback">{(user.fullName ?? user.username).slice(0, 1).toUpperCase()}</span>
              )}
              <i
                className={user.profileComplete ? 'avatar-dot is-complete' : 'avatar-dot'}
                aria-label={user.profileComplete ? 'Profile complete' : 'Profile incomplete'}
              />
            </button>
          </>
        ) : (
          <>
            <Button onClick={() => dispatch(openAuthModal('register'))}>Sign Up</Button>
            <Button variant="light" onClick={() => dispatch(openAuthModal('login'))}>
              Log In
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
