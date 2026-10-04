import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ModalOverlay } from '@/components/modals/ModalOverlay'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorBanner, Spinner } from '@/components/feedback/Status'
import type { RootState } from '@/app/store'
import { queryKeys } from '@/app/queryClient'
import { useSession, useSeatMap, useFilterOptions } from '@/features/sessions/sessionsQueries'
import {
  closeBooking,
  dropContested,
  expireHold,
  resetToSeats,
  setBanner,
  setHold,
  setOrder,
  setStep,
  setTicketType,
  toggleSeat,
} from './bookingSlice'
import { createHold, createOrder, fetchHold, releaseHold } from './bookingApi'
import { HOLD_STORAGE_KEY } from './bookingSlice'
import { useHoldTimer } from '@/hooks/useHoldTimer'
import { digitsOnly, formatGel, formatHoldClock, formatMobileDisplay, formatCardNumber, formatExpiry } from '@/utils/formatters'
import { validateCheckout } from '@/utils/validation'
import { isFieldValidation, parseApiError } from '@/utils/errorHandling'
import type { Seat, TicketType } from '@/types/models'
import { useAuth } from '@/hooks/useAuth'

export function BookingModal() {
  const dispatch = useDispatch()
  const { isOpen, sessionId, hold } = useSelector((state: RootState) => state.booking)
  const queryClient = useQueryClient()

  const onClose = async () => {
    if (hold?.isLive && hold.holdId) {
      try {
        await releaseHold(hold.holdId)
      } catch {
        /* seats still expire server-side */
      }
      dispatch(setHold(null))
    }
    dispatch(closeBooking())
    if (sessionId) queryClient.invalidateQueries({ queryKey: queryKeys.seats(sessionId) })
  }

  return (
    <ModalOverlay open={isOpen} title="Buy tickets" onClose={() => void onClose()} wide>
      {sessionId ? <BookingFlow sessionId={sessionId} onClose={() => void onClose()} /> : null}
    </ModalOverlay>
  )
}

function BookingFlow({ sessionId, onClose }: { sessionId: number; onClose: () => void }) {
  const dispatch = useDispatch()
  const step = useSelector((state: RootState) => state.booking.step)
  const hold = useSelector((state: RootState) => state.booking.hold)
  const sessionQuery = useSession(sessionId)
  const seatsQuery = useSeatMap(sessionId)
  const optionsQuery = useFilterOptions()

  useEffect(() => {
    const raw = sessionStorage.getItem(HOLD_STORAGE_KEY)
    if (!raw) return
    try {
      const stored = JSON.parse(raw) as { holdId: string; sessionId: number }
      if (stored.sessionId !== sessionId) return
      void fetchHold(stored.holdId).then((result) => {
        if (result.isLive) {
          dispatch(setHold(result))
          dispatch(setStep('checkout'))
        } else {
          dispatch(expireHold())
          void seatsQuery.refetch()
        }
      })
    } catch {
      sessionStorage.removeItem(HOLD_STORAGE_KEY)
    }
  }, [dispatch, sessionId, seatsQuery])

  if (sessionQuery.isLoading || seatsQuery.isLoading || optionsQuery.isLoading) {
    return <Spinner label="Loading hall map" />
  }
  if (sessionQuery.isError || seatsQuery.isError || !sessionQuery.data || !seatsQuery.data || !optionsQuery.data) {
    return <ErrorBanner message="Could not load this session." onRetry={() => void seatsQuery.refetch()} />
  }

  return (
    <div className="booking">
      <header className="booking-head">
        <div>
          <p className="eyebrow">{sessionQuery.data.venue.name}</p>
          <h2>{sessionQuery.data.movie.title}</h2>
          <p>
            {sessionQuery.data.date} · {sessionQuery.data.time} · Hall {sessionQuery.data.hall.name} · {sessionQuery.data.format.name}
          </p>
        </div>
        <button type="button" className="icon-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      {step === 'seats' ? (
        <SeatStep
          sessionId={sessionId}
          minAge={sessionQuery.data.movie.ageRating.minAge}
          ticketTypes={optionsQuery.data.ticketTypes}
          maxSeats={optionsQuery.data.maxSeatsPerOrder}
          onReload={() => void seatsQuery.refetch()}
        />
      ) : null}
      {step === 'checkout' && hold ? <CheckoutStep /> : null}
      {step === 'confirmation' ? <ConfirmationStep onClose={onClose} /> : null}
    </div>
  )
}

function SeatStep({
  sessionId,
  minAge,
  ticketTypes,
  maxSeats,
  onReload,
}: {
  sessionId: number
  minAge: number
  ticketTypes: TicketType[]
  maxSeats: number
  onReload: () => void
}) {
  const dispatch = useDispatch()
  const { selected, banner, contested } = useSelector((state: RootState) => state.booking)
  const { user } = useAuth()
  const seatsQuery = useSeatMap(sessionId)
  const map = seatsQuery.data

  const holdMutation = useMutation({
    mutationFn: () =>
      createHold(
        sessionId,
        selected.map((seat) => ({ seatId: seat.seatId, ticketType: seat.ticketType })),
      ),
    onSuccess(hold) {
      dispatch(setHold(hold))
      dispatch(setStep('checkout'))
      dispatch(setBanner(null))
    },
    onError(error) {
      const parsed = parseApiError(error)
      if (parsed.status === 409 && parsed.contested) {
        dispatch(dropContested(parsed.contested))
        onReload()
        return
      }
      dispatch(setBanner(parsed.message))
    },
  })

  if (!map) return <Spinner />

  const allowedTypes = ticketTypes.filter(
    (type) => type.blockedFromRatingAge == null || minAge < type.blockedFromRatingAge,
  )

  return (
    <div className="booking-grid">
      <div>
        {banner ? <ErrorBanner message={banner} /> : null}
        {!user?.profileComplete ? (
          <p className="banner banner-warn">
            Complete your profile before checkout. <Link to="/profile">Go to My Profile</Link>
          </p>
        ) : null}
        <div className="screen">SCREEN</div>
        {map.sections.map((section) => (
          <section key={section.name} className="hall-section">
            <h3>{section.name}</h3>
            {section.rows.map((row) => (
              <div key={row.label} className="seat-row">
                <span className="row-label">{row.label}</span>
                <div className="seat-cells">
                  {row.seats.map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      selected={selected.some((item) => item.seatId === seat.id)}
                      contested={contested.includes(seat.code)}
                      section={section.name}
                      onToggle={() =>
                        dispatch(
                          toggleSeat({
                            seatId: seat.id,
                            code: seat.code,
                            label: seat.label,
                            section: section.name,
                            maxSeats,
                          }),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
        <ul className="legend">
          <li><i className="seat available" /> Available</li>
          <li><i className="seat selected" /> Selected</li>
          <li><i className="seat held" /> Held</li>
          <li><i className="seat sold" /> Sold</li>
        </ul>
      </div>
      <aside className="booking-summary">
        <p>Select up to {maxSeats} seats.</p>
        {selected.map((seat) => (
          <label key={seat.seatId} className="ticket-row">
            <strong>{seat.code}</strong>
            <select
              value={seat.ticketType}
              onChange={(event) =>
                dispatch(setTicketType({ seatId: seat.seatId, ticketType: event.target.value as typeof seat.ticketType }))
              }
            >
              {allowedTypes.map((type) => (
                <option key={type.slug} value={type.slug}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <Button disabled={!selected.length || holdMutation.isPending} onClick={() => holdMutation.mutate()}>
          {holdMutation.isPending ? 'Holding seats…' : 'Continue'}
        </Button>
      </aside>
    </div>
  )
}

function SeatButton({
  seat,
  selected,
  contested,
  onToggle,
  section,
}: {
  seat: Seat
  selected: boolean
  contested: boolean
  section: string
  onToggle: () => void
}) {
  const mine = seat.isMine || selected
  const disabled = seat.state === 'sold' || seat.state === 'held' || seat.state === 'unavailable'
  if (seat.state === 'unavailable') {
    return (
      <>
        <span className="seat gap" aria-hidden="true" />
        {seat.aisleAfter ? <span className="aisle" /> : null}
      </>
    )
  }
  return (
    <>
      <button
        type="button"
        className={`seat ${mine ? 'selected' : seat.state} ${contested ? 'contested' : ''}`}
        disabled={disabled}
        onClick={onToggle}
        aria-label={`Seat ${seat.code} in ${section}`}
      >
        {seat.label}
      </button>
      {seat.aisleAfter ? <span className="aisle" /> : null}
    </>
  )
}

function CheckoutStep() {
  const dispatch = useDispatch()
  const hold = useSelector((state: RootState) => state.booking.hold)
  const sessionId = useSelector((state: RootState) => state.booking.sessionId)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [mobileNumber, setMobileNumber] = useState(formatMobileDisplay(user?.mobileNumber ?? ''))
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('09/30')
  const [cvv, setCvv] = useState('123')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const onExpire = useCallback(() => {
    dispatch(expireHold())
    if (sessionId) void queryClient.invalidateQueries({ queryKey: queryKeys.seats(sessionId) })
  }, [dispatch, queryClient, sessionId])

  const seconds = useHoldTimer(hold?.expiresAt ?? null, onExpire)

  const pay = useMutation({
    mutationFn: createOrder,
    onSuccess(order) {
      dispatch(setOrder(order))
      void queryClient.invalidateQueries({ queryKey: queryKeys.tickets('upcoming') })
    },
    onError(error) {
      const parsed = parseApiError(error)
      if (parsed.status === 409 && parsed.contested) {
        dispatch(dropContested(parsed.contested))
        dispatch(resetToSeats())
        return
      }
      if (parsed.status === 422 && !parsed.errors) {
        dispatch(expireHold())
        dispatch(setBanner(parsed.message))
        return
      }
      if (isFieldValidation(parsed)) {
        setErrors(Object.fromEntries(Object.entries(parsed.errors ?? {}).map(([key, value]) => [key, value[0]])))
        return
      }
      dispatch(setBanner(parsed.message))
    },
  })

  if (!hold) return null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const payload = {
      holdId: hold.holdId,
      fullName,
      email,
      mobileNumber: digitsOnly(mobileNumber),
      cardNumber: digitsOnly(cardNumber),
      expiry,
      cvv,
    }
    const next = validateCheckout({ ...payload, mobileNumber, cardNumber, expiry, cvv })
    setErrors(next)
    if (Object.keys(next).length) return
    pay.mutate(payload)
  }

  return (
    <form className="checkout" onSubmit={onSubmit}>
      <p className="timer">Hold remaining {formatHoldClock(seconds)}</p>
      <ul className="hold-seats">
        {hold.seats.map((seat) => (
          <li key={seat.seatId}>
            {seat.code} · {seat.ticketType.name} · {formatGel(seat.price)}
          </li>
        ))}
      </ul>
      <p className="total">Total {formatGel(hold.subtotal)}</p>
      <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
      <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Input
        label="Mobile number"
        value={mobileNumber}
        onChange={(e) => setMobileNumber(formatMobileDisplay(e.target.value))}
        error={errors.mobileNumber}
      />
      <Input
        label="Card number"
        value={cardNumber}
        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
        error={errors.cardNumber}
      />
      <div className="split">
        <Input label="Expiry" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} error={errors.expiry} />
        <Input label="CVV" value={cvv} onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 3))} error={errors.cvv} />
      </div>
      <div className="hero-buttons">
        <Button variant="dark" onClick={() => dispatch(setStep('seats'))}>
          Back to seats
        </Button>
        <Button type="submit" disabled={pay.isPending || seconds === 0}>
          {pay.isPending ? 'Paying…' : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}

function ConfirmationStep({ onClose }: { onClose: () => void }) {
  const order = useSelector((state: RootState) => state.booking.order)
  if (!order) return null
  return (
    <div className="confirm">
      <p className="eyebrow">Booking confirmed</p>
      <h2>{order.reference}</h2>
      <p>
        {order.session.movie.title} · {order.session.date} {order.session.time}
      </p>
      <ul>
        {order.tickets.map((ticket) => (
          <li key={ticket.id}>
            {ticket.seatCode} · {ticket.ticketType.name} · {formatGel(ticket.price)}
          </li>
        ))}
      </ul>
      <p>Total {formatGel(order.totalPrice)} · card ···· {order.cardLastFour}</p>
      <Button onClick={onClose}>Done</Button>
    </div>
  )
}
