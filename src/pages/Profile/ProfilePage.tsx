import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProfileForm } from '@/features/profile/ProfileForm'
import { TicketsPanel } from '@/features/profile/TicketsPanel'

/**
 * ВАЖНО: подключите здесь реальное количество купленных билетов.
 * Я не видел хук, который загружает билеты (его использует TicketsPanel),
 * поэтому пока возвращается undefined и бейдж скрыт.
 * Пример после подключения:
 *   const tickets = useTickets('upcoming')   // ваш реальный хук
 *   return tickets.data?.length
 */
function useTicketsCount(): number | undefined {
  return undefined
}

const TAB_BASE =
  'relative pb-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b1d]'

function Underline() {
  return <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b1d]" />
}

export default function ProfilePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'tickets' ? 'tickets' : 'profile'
  const ticketsCount = useTicketsCount()

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1800px] px-0 pb-16 pt-8">

        <h1 className="mb-6 text-[26px] font-bold tracking-tight text-white">My Profile</h1>

        <nav
          role="tablist"
          aria-label="Profile sections"
          className="relative flex items-center gap-8 border-b border-[#141a29]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'profile'}
            onClick={() => setParams({})}
            className={`${TAB_BASE} ${tab === 'profile' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Personal Information
            {tab === 'profile' ? <Underline /> : null}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tickets'}
            onClick={() => setParams({ tab: 'tickets' })}
            className={`${TAB_BASE} flex items-center space-x-2 ${
              tab === 'tickets' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>My Tickets</span>
            {ticketsCount ? (
              <span
                aria-label={`${ticketsCount} tickets`}
                className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b1d] px-1 text-[11px] font-bold text-white"
              >
                {ticketsCount}
              </span>
            ) : null}
            {tab === 'tickets' ? <Underline /> : null}
          </button>
        </nav>

        <div className="mt-8">{tab === 'tickets' ? <TicketsPanel /> : <ProfileForm />}</div>
      </main>
    </AppLayout>
  )
}