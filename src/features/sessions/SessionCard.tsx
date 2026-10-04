import { Ticket } from 'lucide-react'
import type { Session } from '@/types/models'
import { formatGel } from '@/utils/formatters'
import { useBookingFlow } from '@/features/booking/useBookingFlow'
import { useAuth } from '@/hooks/useAuth'

type SessionCardProps = {
  session: Session
  minimumAge?: number
  blockedReason?: string
}

export function SessionCard({
  session,
  minimumAge = 0,
  blockedReason,
}: SessionCardProps) {
  const { startBooking } = useBookingFlow()
  const { user } = useAuth()

  const soldOut =
    session.isSoldOut ||
    session.seatsLeft <= 0

  const low =
    !soldOut &&
    session.seatsLeft > 0 &&
    session.seatsLeft <= 5

  const userAge = user?.age

  const tooYoung =
    userAge != null &&
    minimumAge > 0 &&
    userAge < minimumAge

  const disabled =
    soldOut ||
    tooYoung ||
    Boolean(blockedReason)

  const handleBooking = () => {
    if (disabled) {
      return
    }

    startBooking(session.id)
  }

  const title = tooYoung
    ? `You must be at least ${minimumAge} years old to book this session.`
    : blockedReason

  const availabilityLabel = soldOut
    ? 'sold out'
    : `${session.seatsLeft} seats left`

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={[
        session.time,
        session.format.name,
        availabilityLabel,
        formatGel(session.price),
        tooYoung
          ? `minimum age ${minimumAge}`
          : undefined,
        blockedReason,
      ]
        .filter(Boolean)
        .join(', ')}
      className={`session-card ${
        soldOut ? 'is-sold' : ''
      } ${disabled && !soldOut ? 'is-disabled' : ''}`}
      onClick={handleBooking}
    >
      <div className="session-card-top">
        <span className="session-time">
          {session.time}
        </span>

        <span className="session-format">
          {session.format.name}
        </span>
      </div>

      <div className="session-card-mid">
        <span>
          {session.language.name}
        </span>

        {soldOut ? (
          <span>
            Sold out
          </span>
        ) : tooYoung ? (
          <span>
            Age {minimumAge}+
          </span>
        ) : blockedReason ? (
          <span>
            {blockedReason}
          </span>
        ) : (
          <span
            className={
              low
                ? 'seats-low'
                : 'seats-ok'
            }
          >
            <Ticket
              className="w-3.5 h-3.5 -rotate-45"
              fill="currentColor"
              aria-hidden="true"
            />

            {session.seatsLeft} left
          </span>
        )}
      </div>

      <div className="session-card-bot">
        <span>
          Hall {session.hall.name}
        </span>

        <span>
          {formatGel(session.price)}
        </span>
      </div>
    </button>
  )
}
