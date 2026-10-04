import { Ticket } from 'lucide-react'
import type { Session } from '@/types/models'
import { formatGel } from '@/utils/formatters'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useAuth } from '@/hooks/useAuth'

export function SessionCard({ session, blockedReason }: { session: Session; blockedReason?: string }) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()
  const soldOut = session.isSoldOut
  const low = session.seatsLeft > 0 && session.seatsLeft <= 5
  const tooYoung = user?.age != null && user.age < session.movie.ageRating.minAge
  const disabled = soldOut || tooYoung || Boolean(blockedReason)

  return (
    <button
      type="button"
      disabled={disabled}
      title={tooYoung ? `You must be at least ${session.movie.ageRating.minAge}` : blockedReason}
      aria-label={`${session.time}, ${session.format.name}, ${soldOut ? 'sold out' : `${session.seatsLeft} seats left`}, ${formatGel(session.price)}`}
      className={`session-card ${soldOut ? 'is-sold' : ''}`}
      onClick={() => startBooking(session.id)}
    >
      <div className="session-card-top">
        <span className="session-time">{session.time}</span>
        <span className="session-format">{session.format.name}</span>
      </div>
      <div className="session-card-mid">
        <span>{session.language.name}</span>
        {soldOut ? (
          <span>Sold out</span>
        ) : (
          <span className={low ? 'seats-low' : 'seats-ok'}>
            <Ticket className="w-3.5 h-3.5 -rotate-45" fill="currentColor" aria-hidden="true" />
            {session.seatsLeft} left
          </span>
        )}
      </div>
      <div className="session-card-bot">
        <span>Hall {session.hall.name}</span>
        <span>{formatGel(session.price)}</span>
      </div>
    </button>
  )
}
