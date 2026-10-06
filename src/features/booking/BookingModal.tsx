import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { ModalOverlay } from '@/components/modals/ModalOverlay'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorBanner, Spinner } from '@/components/feedback/Status'

import type { RootState } from '@/app/store'
import { queryKeys } from '@/app/queryClient'

import {
  useSession,
  useSeatMap,
  useFilterOptions,
} from '@/features/sessions/sessionsQueries'

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

import {
  createHold,
  createOrder,
  fetchHold,
  releaseHold,
} from './bookingApi'

import { HOLD_STORAGE_KEY } from './bookingSlice'
import { useHoldTimer } from '@/hooks/useHoldTimer'

import {
  digitsOnly,
  formatGel,
  formatHoldClock,
  formatMobileDisplay,
  formatCardNumber,
  formatExpiry,
} from '@/utils/formatters'

import { validateCheckout } from '@/utils/validation'
import {
  isFieldValidation,
  parseApiError,
} from '@/utils/errorHandling'

import type { Seat, TicketType } from '@/types/models'
import { useAuth } from '@/hooks/useAuth'

export function BookingModal() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const { isOpen, sessionId, hold } = useSelector(
    (state: RootState) => state.booking,
  )

  const onClose = async () => {
    if (hold?.isLive && hold.holdId) {
      try {
        await releaseHold(hold.holdId)
      } catch {
        // The hold will expire server-side if release fails.
      }

      dispatch(setHold(null))
    }

    dispatch(closeBooking())

    if (sessionId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.seats(sessionId),
      })
    }
  }

  return (
    <ModalOverlay
      open={isOpen}
      title="Buy tickets"
      onClose={() => void onClose()}
      wide
    >
      {sessionId ? (
        <BookingFlow
          sessionId={sessionId}
          onClose={() => void onClose()}
        />
      ) : null}
    </ModalOverlay>
  )
}

function BookingFlow({
  sessionId,
  onClose,
}: {
  sessionId: number
  onClose: () => void
}) {
  const dispatch = useDispatch()

  const step = useSelector(
    (state: RootState) => state.booking.step,
  )

  const hold = useSelector(
    (state: RootState) => state.booking.hold,
  )

  const sessionQuery = useSession(sessionId)
  const seatsQuery = useSeatMap(sessionId)
  const optionsQuery = useFilterOptions()

  /*
   * Restore a live hold after page refresh / accidental reload.
   */
  useEffect(() => {
    const raw = sessionStorage.getItem(HOLD_STORAGE_KEY)

    if (!raw) return

    let stored: { holdId: string; sessionId: number }

    try {
      stored = JSON.parse(raw) as {
        holdId: string
        sessionId: number
      }
    } catch {
      sessionStorage.removeItem(HOLD_STORAGE_KEY)
      return
    }

    if (stored.sessionId !== sessionId) return

    let cancelled = false

    void fetchHold(stored.holdId)
      .then((result) => {
        if (cancelled) return

        if (result.isLive) {
          dispatch(setHold(result))
          dispatch(setStep('checkout'))
        } else {
          dispatch(expireHold())
          void seatsQuery.refetch()
        }
      })
      .catch(() => {
        if (cancelled) return

        sessionStorage.removeItem(HOLD_STORAGE_KEY)
        dispatch(expireHold())
        void seatsQuery.refetch()
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, sessionId, seatsQuery.refetch])

  if (
    sessionQuery.isLoading ||
    seatsQuery.isLoading ||
    optionsQuery.isLoading
  ) {
    return <Spinner label="Loading hall map" />
  }

  if (
    sessionQuery.isError ||
    seatsQuery.isError ||
    optionsQuery.isError ||
    !sessionQuery.data ||
    !seatsQuery.data ||
    !optionsQuery.data
  ) {
    return (
      <ErrorBanner
        message="Could not load this session."
        onRetry={() => {
          void sessionQuery.refetch()
          void seatsQuery.refetch()
          void optionsQuery.refetch()
        }}
      />
    )
  }

  const session = sessionQuery.data

  return (
    <div className="booking">
      <BookingHeader
        session={session}
        step={step}
        hold={hold}
        onClose={onClose}
      />

      {step === 'seats' ? (
        <SeatStep
          sessionId={sessionId}
          minAge={session.movie.ageRating.minAge}
          ticketTypes={optionsQuery.data.ticketTypes}
          maxSeats={optionsQuery.data.maxSeatsPerOrder}
          onReload={() => void seatsQuery.refetch()}
        />
      ) : null}

      {step === 'checkout' && hold ? (
        <CheckoutStep />
      ) : null}

      {step === 'confirmation' ? (
        <ConfirmationStep onClose={onClose} />
      ) : null}
    </div>
  )
}

function BookingHeader({
  session,
  step,
  hold,
  onClose,
}: {
  session: {
    venue: {
      name: string
    }
    movie: {
      title: string
    }
    date: string
    time: string
    hall: {
      name: string
    }
    format: {
      name: string
    }
  }
  step: 'seats' | 'checkout' | 'confirmation'
  hold: RootState['booking']['hold']
  onClose: () => void
}) {
  const seconds = useHoldTimer(hold?.expiresAt ?? null, () => undefined)

  return (
    <header className="booking-head">
      <div>
        <p className="eyebrow">{session.venue.name}</p>

        <h2>{session.movie.title}</h2>

        <p>
          {session.date} · {session.time} · Hall {session.hall.name} ·{' '}
          {session.format.name}
        </p>

        <div className="booking-steps" aria-label="Booking progress">
          <span
            className={step === 'seats' ? 'active' : 'complete'}
          >
            1. Seats
          </span>

          <span className={step === 'checkout' ? 'active' : ''}>
            2. Checkout
          </span>

          {step === 'confirmation' ? (
            <span className="active">3. Confirmation</span>
          ) : null}
        </div>

        {step === 'checkout' && hold ? (
          <p className="timer">
            Hold remaining: {formatHoldClock(seconds)}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="icon-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    </header>
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
  const navigate = useNavigate()

  const {
    selected,
    banner,
    contested,
  } = useSelector((state: RootState) => state.booking)

  const { user } = useAuth()

  const seatsQuery = useSeatMap(sessionId)
  const map = seatsQuery.data

  const isTooYoung =
    user?.age != null && user.age < minAge

  const profileIncomplete =
    Boolean(user) && !user?.profileComplete

  const allowedTypes = useMemo(
    () =>
      ticketTypes.filter(
        (type) =>
          type.blockedFromRatingAge == null ||
          minAge < type.blockedFromRatingAge,
      ),
    [ticketTypes, minAge],
  )

  const holdMutation = useMutation({
    mutationFn: () =>
      createHold(
        sessionId,
        selected.map((seat) => ({
          seatId: seat.seatId,
          ticketType: seat.ticketType,
        })),
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

  if (!map) {
    return <Spinner label="Loading hall map" />
  }

  const canContinue =
    selected.length > 0 &&
    !holdMutation.isPending &&
    !profileIncomplete &&
    !isTooYoung

  const ageRestrictionMessage =
    minAge >= 18
      ? 'This film is rated 18+. You cannot buy tickets for it with this account.'
      : minAge >= 16
        ? 'This film is rated 16+. You cannot buy tickets for it with this account.'
        : null

  const handleContinue = () => {
    if (!user) {
      dispatch(
        setBanner('Please log in to continue with your booking.'),
      )
      return
    }

    if (profileIncomplete) {
      dispatch(
        setBanner(
          'Please complete your profile before buying tickets.',
        ),
      )
      navigate('/profile')
      return
    }

    if (isTooYoung) {
      dispatch(setBanner(ageRestrictionMessage))
      return
    }

    if (!selected.length) {
      dispatch(setBanner('Please select at least one seat.'))
      return
    }

    holdMutation.mutate()
  }

  return (
    <div className="booking-grid">
      <div>
        {banner ? <ErrorBanner message={banner} /> : null}

        {profileIncomplete ? (
          <p className="banner banner-warn">
            Please complete your profile to enable booking.{' '}
            <Link to="/profile">Go to My Profile</Link>
          </p>
        ) : null}

        {isTooYoung && ageRestrictionMessage ? (
          <p className="banner banner-error">
            {ageRestrictionMessage}
          </p>
        ) : null}

        <div className="screen">SCREEN</div>

        {map.sections.map((section) => (
          <section
            key={section.name}
            className="hall-section"
          >
            <h3>{section.name}</h3>

            {section.rows.map((row) => (
              <div
                key={row.label}
                className="seat-row"
              >
                <span className="row-label">
                  {row.label}
                </span>

                <div className="seat-cells">
                  {row.seats.map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      selected={selected.some(
                        (item) => item.seatId === seat.id,
                      )}
                      contested={contested.includes(
                        seat.code,
                      )}
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
          <li>
            <i className="seat available" />
            Available
          </li>

          <li>
            <i className="seat selected" />
            Selected
          </li>

          <li>
            <i className="seat held" />
            Held
          </li>

          <li>
            <i className="seat sold" />
            Sold
          </li>

          <li>
            <i className="seat gap" />
            Unavailable
          </li>
        </ul>
      </div>

      <aside className="booking-summary">
        <p>
          Select up to {maxSeats} seats.
        </p>

        {selected.length === 0 ? (
          <p className="empty-state">
            Select at least one available seat to continue.
          </p>
        ) : null}

        {selected.map((seat) => (
          <label
            key={seat.seatId}
            className="ticket-row"
          >
            <strong>{seat.code}</strong>

            <select
              value={seat.ticketType}
              onChange={(event) =>
                dispatch(
                  setTicketType({
                    seatId: seat.seatId,
                    ticketType:
                      event.target.value as typeof seat.ticketType,
                  }),
                )
              }
            >
              {allowedTypes.map((type) => (
                <option
                  key={type.slug}
                  value={type.slug}
                >
                  {type.name}
                </option>
              ))}
            </select>
          </label>
        ))}

        <Button
          disabled={!canContinue}
          onClick={handleContinue}
        >
          {holdMutation.isPending
            ? 'Holding seats…'
            : 'Next: Checkout'}
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
  if (seat.state === 'unavailable') {
    return (
      <>
        <span
          className="seat gap"
          aria-label="Unavailable seat"
          aria-hidden="true"
        />

        {seat.aisleAfter ? (
          <span className="aisle" />
        ) : null}
      </>
    )
  }

  const mine = seat.isMine || selected

  const disabled =
    seat.state === 'sold' ||
    seat.state === 'held'

  return (
    <>
      <button
        type="button"
        className={`seat ${
          mine ? 'selected' : seat.state
        } ${contested ? 'contested' : ''}`}
        disabled={disabled}
        onClick={onToggle}
        aria-label={`Seat ${seat.code} in ${section}`}
      >
        {seat.label}
      </button>

      {seat.aisleAfter ? (
        <span className="aisle" />
      ) : null}
    </>
  )
}

function CheckoutStep() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const hold = useSelector(
    (state: RootState) => state.booking.hold,
  )

  const sessionId = useSelector(
    (state: RootState) => state.booking.sessionId,
  )

  const { user } = useAuth()

  const [fullName, setFullName] = useState(
    user?.fullName ?? '',
  )

  const [email, setEmail] = useState(
    user?.email ?? '',
  )

  const [mobileNumber, setMobileNumber] = useState(
    formatMobileDisplay(user?.mobileNumber ?? ''),
  )

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const [errors, setErrors] = useState<
    Record<string, string>
  >({})

  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!user) return

    setFullName(user.fullName ?? '')
    setEmail(user.email ?? '')
    setMobileNumber(
      formatMobileDisplay(user.mobileNumber ?? ''),
    )
  }, [user])

  const onExpire = useCallback(() => {
    dispatch(expireHold())

    if (sessionId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.seats(sessionId),
      })
    }
  }, [dispatch, queryClient, sessionId])

  const seconds = useHoldTimer(
    hold?.expiresAt ?? null,
    onExpire,
  )

  const pay = useMutation({
    mutationFn: createOrder,

    onSuccess(order) {
      dispatch(setOrder(order))

      void queryClient.invalidateQueries({
        queryKey: queryKeys.tickets('upcoming'),
      })

      if (sessionId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.seats(sessionId),
        })
      }
    },

    onError(error) {
      const parsed = parseApiError(error)

      if (parsed.status === 409 && parsed.contested) {
        dispatch(dropContested(parsed.contested))
        dispatch(resetToSeats())

        if (sessionId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.seats(sessionId),
          })
        }

        return
      }

      if (
        parsed.status === 422 &&
        !parsed.errors
      ) {
        dispatch(expireHold())
        dispatch(setBanner(parsed.message))

        if (sessionId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.seats(sessionId),
          })
        }

        return
      }

      if (isFieldValidation(parsed)) {
        setErrors(
          Object.fromEntries(
            Object.entries(
              parsed.errors ?? {},
            ).map(([key, value]) => [
              key,
              value[0],
            ]),
          ),
        )

        return
      }

      dispatch(setBanner(parsed.message))
    },
  })

  if (!hold) {
    return null
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()

    setSubmitted(true)

    if (pay.isPending || seconds <= 0) {
      return
    }

    const payload = {
      holdId: hold.holdId,
      fullName: fullName.trim(),
      email: email.trim(),
      mobileNumber: digitsOnly(mobileNumber),
      cardNumber: digitsOnly(cardNumber),
      expiry,
      cvv,
    }

    const next = validateCheckout({
      fullName,
      email,
      mobileNumber,
      cardNumber,
      expiry,
      cvv,
    })

    setErrors(next)

    if (Object.keys(next).length > 0) {
      return
    }

    pay.mutate(payload)
  }

  const handleBack = async () => {
    if (pay.isPending) return

    if (hold.isLive && hold.holdId) {
      try {
        await releaseHold(hold.holdId)
      } catch {
        // The server will eventually expire the hold.
      }
    }

    dispatch(setHold(null))
    dispatch(setStep('seats'))

    if (sessionId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.seats(sessionId),
      })
    }
  }

  return (
    <form
      className="checkout"
      onSubmit={onSubmit}
      noValidate
    >
      {hold.isLive ? (
        <p className="timer">
          Hold remaining {formatHoldClock(seconds)}
        </p>
      ) : null}

      <ul className="hold-seats">
        {hold.seats.map((seat) => (
          <li key={seat.seatId}>
            {seat.code} · {seat.ticketType.name} ·{' '}
            {formatGel(seat.price)}
          </li>
        ))}
      </ul>

      <p className="total">
        Total {formatGel(hold.subtotal)}
      </p>

      <Input
        label="Full Name"
        value={fullName}
        onChange={(event) =>
          setFullName(event.target.value)
        }
        onBlur={() =>
          setSubmitted(true)
        }
        error={
          submitted
            ? errors.fullName
            : undefined
        }
        disabled={pay.isPending}
      />

      <Input
        label="Email"
        value={email}
        disabled
        error={
          submitted
            ? errors.email
            : undefined
        }
      />

      <Input
        label="Mobile Number"
        value={mobileNumber}
        onChange={(event) =>
          setMobileNumber(
            formatMobileDisplay(
              event.target.value,
            ),
          )
        }
        onBlur={() =>
          setSubmitted(true)
        }
        error={
          submitted
            ? errors.mobileNumber
            : undefined
        }
        disabled={pay.isPending}
        placeholder="5XX XXX XXX"
      />

      <Input
        label="Card Number"
        value={cardNumber}
        onChange={(event) =>
          setCardNumber(
            formatCardNumber(
              event.target.value,
            ),
          )
        }
        onBlur={() =>
          setSubmitted(true)
        }
        error={
          submitted
            ? errors.cardNumber
            : undefined
        }
        disabled={pay.isPending}
        placeholder="1234 5678 9012 3456"
        inputMode="numeric"
        autoComplete="cc-number"
      />

      <div className="split">
        <Input
          label="Expiry"
          value={expiry}
          onChange={(event) =>
            setExpiry(
              formatExpiry(
                event.target.value,
              ),
            )
          }
          onBlur={() =>
            setSubmitted(true)
          }
          error={
            submitted
              ? errors.expiry
              : undefined
          }
          disabled={pay.isPending}
          placeholder="MM/YY"
          inputMode="numeric"
          autoComplete="cc-exp"
        />

        <Input
          label="CVV"
          value={cvv}
          onChange={(event) =>
            setCvv(
              digitsOnly(
                event.target.value,
              ).slice(0, 3),
            )
          }
          onBlur={() =>
            setSubmitted(true)
          }
          error={
            submitted
              ? errors.cvv
              : undefined
          }
          disabled={pay.isPending}
          placeholder="123"
          inputMode="numeric"
          autoComplete="cc-csc"
        />
      </div>

      <div className="hero-buttons">
        <Button
          type="button"
          variant="dark"
          onClick={() => void handleBack()}
          disabled={pay.isPending}
        >
          Back
        </Button>

        <Button
          type="submit"
          disabled={
            pay.isPending ||
            seconds <= 0
          }
        >
          {pay.isPending
            ? 'Paying…'
            : 'Pay & Complete Order'}
        </Button>
      </div>
    </form>
  )
}

function ConfirmationStep({
  onClose,
}: {
  onClose: () => void
}) {
  const navigate = useNavigate()

  const order = useSelector(
    (state: RootState) => state.booking.order,
  )

  if (!order) {
    return null
  }

  const handleTickets = () => {
    onClose()
    navigate('/profile')
  }

  return (
    <div className="confirm">
      <p className="eyebrow">
        Booking confirmed
      </p>

      <h2>
        Order {order.reference}
      </h2>

      <p>
        {order.session.movie.title} ·{' '}
        {order.session.date}{' '}
        {order.session.time}
      </p>

      <ul>
        {order.tickets.map((ticket) => (
          <li key={ticket.id}>
            {ticket.seatCode} ·{' '}
            {ticket.ticketType.name} ·{' '}
            {formatGel(ticket.price)}
          </li>
        ))}
      </ul>

      <p>
        Total {formatGel(order.totalPrice)} ·
        {' '}card ···· {order.cardLastFour}
      </p>

      <div className="hero-buttons">
        <Button onClick={handleTickets}>
          My Tickets
        </Button>

        <Button
          variant="dark"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}
