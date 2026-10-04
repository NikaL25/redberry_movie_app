import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProfileForm } from '@/features/profile/ProfileForm'
import { TicketsPanel } from '@/features/profile/TicketsPanel'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const tab = params.get('tab') === 'tickets' ? 'tickets' : 'profile'

  return (
    <AppLayout>
      <main className="container profile-page">
        <div className="profile-shell">
          <header className="profile-header">
            <div className="profile-summary">
              <div className="profile-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName ?? user.username} />
                ) : (
                  <span>{(user?.fullName ?? user?.username ?? 'U').slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="eyebrow">My account</p>
                <h1>{user?.fullName || user?.username || 'Profile'}</h1>
              </div>
            </div>
            <p className="profile-meta">{user?.email}</p>
          </header>

          <nav className="profile-tabs" aria-label="Profile sections">
            <button type="button" className={tab === 'profile' ? 'is-active' : ''} onClick={() => setParams({})}>
              Personal information
            </button>
            <button
              type="button"
              className={tab === 'tickets' ? 'is-active' : ''}
              onClick={() => setParams({ tab: 'tickets' })}
            >
              My Tickets
            </button>
          </nav>

          {tab === 'tickets' ? <TicketsPanel /> : <ProfileForm />}
        </div>
      </main>
    </AppLayout>
  )
}