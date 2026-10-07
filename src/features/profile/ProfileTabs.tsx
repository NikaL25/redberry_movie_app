export type ProfileTabId = 'personal' | 'tickets'

type Props = {
  active: ProfileTabId
  onChange: (tab: ProfileTabId) => void
  /** Количество купленных билетов. Если 0 или undefined, бейдж не показывается. */
  ticketsCount?: number
}

const TAB_BASE = 'relative pb-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b1d]'
const TAB_ACTIVE = 'text-white'
const TAB_IDLE = 'text-gray-400 hover:text-gray-200'

function Underline() {
  return <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff3b1d]" />
}

export function ProfileTabs({ active, onChange, ticketsCount }: Props) {
  return (
    <div role="tablist" aria-label="Profile sections" className="relative flex items-center gap-8 border-b border-[#141a29]">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'personal'}
        onClick={() => onChange('personal')}
        className={`${TAB_BASE} ${active === 'personal' ? TAB_ACTIVE : TAB_IDLE}`}
      >
        Personal Information
        {active === 'personal' ? <Underline /> : null}
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={active === 'tickets'}
        onClick={() => onChange('tickets')}
        className={`${TAB_BASE} flex items-center space-x-2 ${active === 'tickets' ? TAB_ACTIVE : TAB_IDLE}`}
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
        {active === 'tickets' ? <Underline /> : null}
      </button>
    </div>
  )
}