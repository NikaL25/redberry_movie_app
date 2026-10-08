import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { ModalOverlay } from '@/components/modals/ModalOverlay'
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
import { useHoldTimer } from './useHoldTimer'

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
import { useAuth } from '@/features/auth/useAuth'

/* ------------------------------------------------------------------ */
/* Общие стили и хелперы                                               */
/* ------------------------------------------------------------------ */

const BTN_PRIMARY =
  'rounded-2xl bg-[#ea3829] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-all hover:bg-[#d93123] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-50'

const BTN_SECONDARY =
  'rounded-2xl border border-[#232d3f] bg-[#181f2c] px-6 py-4 text-sm font-bold text-white/90 transition-colors hover:bg-[#1e2637] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50'

const CARD = 'rounded-2xl border border-[#1f293a] bg-[#151c27]'

const LABEL_CLASS =
  'text-[11px] font-bold uppercase tracking-wider text-[#78849b]'

/** Три колонки: контент | линия 1px | правая панель. Отступ 20px с обеих сторон линии. */
const SPLIT_GRID =
  'grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_1px_380px]'

/** Вертикальный разделитель 1×518px, цвет #1E2031 */
const VLINE = 'hidden h-[518px] w-px bg-[#1e2031] lg:block'

type SessionInfo = {
  venue: { name: string }
  movie: { title: string }
  date: string
  time: string
  hall: { name: string }
  format: { name: string }
}

/**
 * Предварительная цена места до создания hold.
 * ← Если поле коэффициента у TicketType называется иначе, поправьте только эту строку.
 */
function priceFor(base: number, type: TicketType | undefined) {
  if (!type) return base
  return Math.round(base * type.priceRatio * 100) / 100
}

/* ------------------------------------------------------------------ */
/* Field: локальная замена Input (те же пропсы label / error)          */
/* ------------------------------------------------------------------ */

function Field({
  label,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={LABEL_CLASS}>
        {label}
      </label>

      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 w-full rounded-xl border bg-[#0f151f] px-4 text-sm text-white outline-none transition placeholder:text-[#4a5568] focus:border-[#3d4c67] disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'border-[#ea3829]/60' : 'border-[#232c3d]'
        }`}
        {...props}
      />

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[#ff6b5a]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

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
      bare
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
    <div className="relative w-full rounded-[32px] border border-[#1b2230] bg-[#0c1017] p-7 text-white shadow-2xl md:p-9">
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
          basePrice={session.price}
          onReload={() => void seatsQuery.refetch()}
        />
      ) : null}

      {step === 'checkout' && hold ? (
        <CheckoutStep session={session} />
      ) : null}

      {step === 'confirmation' ? (
        <ConfirmationStep onClose={onClose} />
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Header + step tabs                                                  */
/* ------------------------------------------------------------------ */

type TabState = 'active' | 'complete' | 'idle'

const TAB_BASE =
  'flex-1 rounded-full py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors duration-200'

function tabClass(state: TabState) {
  if (state === 'active') return `${TAB_BASE} bg-[#ea3829] text-white shadow-md`
  if (state === 'complete') return `${TAB_BASE} text-white/80`
  return `${TAB_BASE} text-[#828f9f]`
}

function BookingHeader({
  session,
  step,
  hold,
  onClose,
}: {
  session: SessionInfo
  step: 'seats' | 'checkout' | 'confirmation'
  hold: RootState['booking']['hold']
  onClose: () => void
}) {
  const seconds = useHoldTimer(hold?.expiresAt ?? null, () => undefined)

  const details = [
    session.venue.name,
    `Hall ${session.hall.name}`,
    session.date,
    session.time,
    session.format.name,
  ]

  const seatsState: TabState = step === 'seats' ? 'active' : 'complete'
  const checkoutState: TabState = step === 'checkout' ? 'active' : 'idle'

  return (
    <>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white md:text-[26px]">
            {session.movie.title}
          </h2>

          <p className="mt-1.5 text-xs font-medium tracking-tight text-[#78849b] md:text-[13px]">
            {details.map((part, index) => (
              <Fragment key={`${part}-${index}`}>
                {index > 0 ? (
                  <span className="mx-1 text-[#4a5568]">·</span>
                ) : null}
                {part}
              </Fragment>
            ))}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {step === 'checkout' && hold ? (
            <div
              role="timer"
              className="flex min-w-[105px] flex-col items-center justify-center rounded-2xl border border-[#232d3f] bg-[#181f2c] px-5 py-2.5 text-center"
            >
              <span className="mb-1 text-[10px] font-bold uppercase leading-none tracking-wider text-[#8e9bb0]">
                Seats held
              </span>
              <span className="text-base font-extrabold leading-none text-white">
                {formatHoldClock(seconds)}
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#232d3f] bg-[#181f2c] text-xl leading-none text-[#8e9bb0] transition-colors hover:bg-[#1e2637] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            ×
          </button>
        </div>
      </header>

      <div className={`${SPLIT_GRID} mb-8`}>
        <div
          aria-label="Booking progress"
          className="flex w-full items-center rounded-full bg-[#161d2a] p-1"
        >
          <span
            className={tabClass(seatsState)}
            aria-current={step === 'seats' ? 'step' : undefined}
          >
            Seats
          </span>

          <span
            className={tabClass(checkoutState)}
            aria-current={step === 'checkout' ? 'step' : undefined}
          >
            Checkout
          </span>

          {step === 'confirmation' ? (
            <span className={tabClass('active')} aria-current="step">
              Confirmation
            </span>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Step 1: seats                                                       */
/* ------------------------------------------------------------------ */

function SeatStep({
  sessionId,
  minAge,
  ticketTypes,
  maxSeats,
  basePrice,
  onReload,
}: {
  sessionId: number
  minAge: number
  ticketTypes: TicketType[]
  maxSeats: number
  basePrice: number
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

  /* Предварительный расчёт цены до checkout (итог всё равно считает сервер). */
  const subtotal = selected.reduce(
    (sum, seat) =>
      sum +
      priceFor(
        basePrice,
        allowedTypes.find((type) => type.slug === seat.ticketType),
      ),
    0,
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

  const showAlerts =
    Boolean(banner) ||
    profileIncomplete ||
    Boolean(isTooYoung && ageRestrictionMessage)

  return (
    <div className={SPLIT_GRID}>
      {/* ===== Левая колонка ===== */}
      <div className="flex min-w-0 flex-col items-center">
        {showAlerts ? (
          <div className="mb-6 w-full space-y-3">
            {banner ? <ErrorBanner message={banner} /> : null}

            {profileIncomplete ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
                Please complete your profile to enable booking.{' '}
                <Link
                  to="/profile"
                  className="font-semibold text-[#ff735d] hover:underline"
                >
                  Go to My Profile
                </Link>
              </p>
            ) : null}

            {isTooYoung && ageRestrictionMessage ? (
              <p
                role="alert"
                className="rounded-xl border border-[#ea3829]/30 bg-[#ea3829]/10 px-4 py-3 text-[13px] text-[#ff8d7c]"
              >
                {ageRestrictionMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Экран */}
        <div className="mb-8 w-full">
          <div className="flex h-9 w-full items-center justify-center rounded-xl border-t border-[#29354b] bg-[#1b2332] shadow-inner">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8694a9]">
              SCREEN
            </span>
          </div>
        </div>

        {/* Схема зала: без горизонтальной прокрутки, места сжимаются */}
        <div className="mb-8 w-full">
          {map.sections.map((section) => (
            <section
              key={section.name}
              className="mb-6 last:mb-0"
            >
              <h3 className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#8694a9]">
                {section.name}
              </h3>

              <div className="flex flex-col gap-3.5">
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3"
                  >
                    <span className="w-5 shrink-0 text-left text-xs font-bold text-[#8694a9]">
                      {row.label}
                    </span>

                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
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
              </div>
            </section>
          ))}
        </div>

        {/* Легенда */}
        <ul className="flex flex-wrap items-center justify-center gap-6 text-[12px] text-[#8694a9]">
          <li className="flex items-center gap-2">
            <i className="h-3.5 w-3.5 rounded-md border border-[#2e3b50] bg-[#18202d]" />
            Available
          </li>

          <li className="flex items-center gap-2">
            <i className="h-3.5 w-3.5 rounded-md bg-[#ea3829]" />
            Selected
          </li>

          <li className="flex items-center gap-2">
            <i className="hatched-pattern h-3.5 w-3.5 rounded-md border border-[#2b374d]" />
            Held
          </li>

          <li className="flex items-center gap-2">
            <i className="h-3.5 w-3.5 rounded-md bg-[#151c27]" />
            Sold
          </li>

          <li className="flex items-center gap-2">
            <i className="h-3.5 w-3.5 rounded-md border border-dashed border-[#2e3b50]" />
            Unavailable
          </li>
        </ul>
      </div>

      {/* ===== Вертикальная линия ===== */}
      <div className={VLINE} aria-hidden="true" />

      {/* ===== Правая колонка ===== */}
      <aside className="flex flex-col gap-4">
        <h3 className="text-sm font-bold tracking-wide text-white">
          Your seats{' '}
          <span className="font-medium text-[#78849b]">
            · Max {maxSeats}
          </span>
        </h3>

        <div className="space-y-3.5">
          {selected.length === 0 ? (
            <p className="rounded-2xl border border-[#1f2838] bg-[#141b26] p-6 text-center text-xs text-[#78849b]">
              Select at least one available seat to continue.
            </p>
          ) : null}

          {selected.map((seat) => {
            const seatPrice = priceFor(
              basePrice,
              allowedTypes.find((type) => type.slug === seat.ticketType),
            )

            return (
              <div
                key={seat.seatId}
                className={`${CARD} p-4 transition-all duration-200`}
              >
                <div className="mb-3.5 flex items-center justify-between text-xs text-[#78849b]">
                  <span>
                    Seat{' '}
                    <strong className="ml-1 text-sm font-bold text-white">
                      {seat.code}
                    </strong>
                  </span>

                  <span className="text-xs font-bold tracking-tight text-white">
                    {formatGel(seatPrice)}
                  </span>
                </div>

                <div
                  role="group"
                  aria-label={`Ticket type for seat ${seat.code}`}
                  className="grid auto-cols-fr grid-flow-col gap-1.5"
                >
                  {allowedTypes.map((type) => {
                    const active =
                      (seat.ticketType as string) === type.slug

                    return (
                      <button
                        key={type.slug}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          dispatch(
                            setTicketType({
                              seatId: seat.seatId,
                              ticketType:
                                type.slug as typeof seat.ticketType,
                            }),
                          )
                        }
                        className={`rounded-full px-1 py-2 text-center text-[11px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea3829] ${
                          active
                            ? 'bg-[#ea3829] font-bold text-white shadow-sm'
                            : 'bg-[#1e2637] font-medium text-[#8e9cb0] hover:bg-[#263145] hover:text-white'
                        }`}
                      >
                        {type.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <span className={LABEL_CLASS}>Subtotal</span>
          <span className="text-2xl font-black tracking-tight text-white">
            {formatGel(subtotal)}
          </span>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={`w-full ${BTN_PRIMARY}`}
        >
          {holdMutation.isPending
            ? 'Holding seats…'
            : 'Next: Checkout'}
        </button>
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
          className="aspect-square min-w-0 max-w-11 flex-1"
          aria-label="Unavailable seat"
          aria-hidden="true"
        />

        {seat.aisleAfter ? (
          <span className="w-3.5 shrink-0" />
        ) : null}
      </>
    )
  }

  const mine = seat.isMine || selected

  const disabled =
    seat.state === 'sold' ||
    seat.state === 'held'

  const base =
    'flex aspect-square min-w-0 max-w-11 flex-1 items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

  let tone: string

  if (mine) {
    tone =
      'scale-105 bg-[#ea3829] text-white shadow-lg shadow-red-950/40'
  } else if (seat.state === 'held') {
    tone =
      'hatched-pattern cursor-not-allowed border border-[#2b374d] text-[#657388]'
  } else if (seat.state === 'sold') {
    tone = 'cursor-not-allowed bg-[#151c27] text-[#3d4b60]'
  } else {
    tone =
      'border border-[#232c3d] bg-[#18202d] text-white hover:border-[#3d4c67] hover:bg-[#1d2636]'
  }

  const contestedRing = contested
    ? 'ring-2 ring-[#f59e0b] ring-offset-2 ring-offset-[#0c1017]'
    : ''

  return (
    <>
      <button
        type="button"
        className={`${base} ${tone} ${contestedRing}`}
        disabled={disabled}
        onClick={onToggle}
        aria-label={`Seat ${seat.code} in ${section}`}
      >
        {seat.label}
      </button>

      {seat.aisleAfter ? (
        <span className="w-3.5 shrink-0" />
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Step 2: checkout                                                    */
/* ------------------------------------------------------------------ */

function CheckoutStep({ session }: { session: SessionInfo }) {
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
      className={SPLIT_GRID}
      onSubmit={onSubmit}
      noValidate
    >
      {/* ===== Левая часть: поля (интервал между блоками 24px) ===== */}
      <div className="flex min-w-0 flex-col gap-6">
        <Field
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            value={email}
            disabled
            error={
              submitted
                ? errors.email
                : undefined
            }
          />

          <Field
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
        </div>

        {/* Горизонтальная линия 1px #1E2031 до вертикальной линии */}
        <div
          className="h-px w-full bg-[#1e2031]"
          aria-hidden="true"
        />

        <Field
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
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

          <Field
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
      </div>

      {/* ===== Вертикальная линия ===== */}
      <div className={VLINE} aria-hidden="true" />

      {/* ===== Правая часть: Summary ===== */}
      <aside className="flex flex-col gap-4">
        <h3 className="text-sm font-bold tracking-wide text-white">
          Summary
        </h3>

        <div>
          <p className="text-lg font-extrabold uppercase tracking-wide text-white">
            {session.movie.title}
          </p>

          <p className="mt-1.5 text-xs font-medium text-[#78849b]">
            {session.venue.name}
            <span className="mx-1 text-[#4a5568]">·</span>
            Hall {session.hall.name}
            <span className="mx-1 text-[#4a5568]">·</span>
            {session.date}
            <span className="mx-1 text-[#4a5568]">·</span>
            {session.time}
            <span className="mx-1 text-[#4a5568]">·</span>
            {session.format.name}
          </p>
        </div>

        <div
          className="h-px w-full bg-[#1e2031]"
          aria-hidden="true"
        />

        <ul className="space-y-3">
          {hold.seats.map((seat) => (
            <li
              key={seat.seatId}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs text-[#78849b]">
                  Seat{' '}
                  <strong className="ml-1 text-sm font-bold text-white">
                    {seat.code}
                  </strong>
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#8e9cb0]">
                  {seat.ticketType.name}
                </p>
              </div>

              <span className="shrink-0 text-xs font-bold tracking-tight text-white">
                {formatGel(seat.price)}
              </span>
            </li>
          ))}
        </ul>

        <div
          className="h-px w-full bg-[#1e2031]"
          aria-hidden="true"
        />

        {hold.isLive ? (
          <p className="px-1 text-xs text-[#78849b]">
            Hold remaining{' '}
            <span className="font-bold text-white">
              {formatHoldClock(seconds)}
            </span>
          </p>
        ) : null}

        <div className="flex items-center justify-between px-1">
          <span className={LABEL_CLASS}>Total</span>
          <span className="text-2xl font-black tracking-tight text-white">
            {formatGel(hold.subtotal)}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => void handleBack()}
            disabled={pay.isPending}
            className={BTN_SECONDARY}
          >
            Back
          </button>

          <button
            type="submit"
            disabled={
              pay.isPending ||
              seconds <= 0
            }
            className={`flex-1 ${BTN_PRIMARY}`}
          >
            {pay.isPending
              ? 'Paying…'
              : 'Pay & Complete Order'}
          </button>
        </div>
      </aside>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Step 3: confirmation                                                */
/* ------------------------------------------------------------------ */

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
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 py-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ea3829]">
          Booking confirmed
        </p>

        <h2 className="mt-2 text-2xl font-extrabold tracking-wide text-white">
          Order {order.reference}
        </h2>

        <p className="mt-1.5 text-[13px] text-[#78849b]">
          {order.session.movie.title} ·{' '}
          {order.session.date}{' '}
          {order.session.time}
        </p>
      </div>

      <ul className="space-y-3">
        {order.tickets.map((ticket) => (
          <li
            key={ticket.id}
            className={`${CARD} flex items-center justify-between gap-3 p-4`}
          >
            <span className="min-w-0 truncate text-sm text-white">
              <strong className="font-bold">
                {ticket.seatCode}
              </strong>
              <span className="mx-1.5 text-[#4a5568]">·</span>
              <span className="text-[#8e9cb0]">
                {ticket.ticketType.name}
              </span>
            </span>

            <span className="shrink-0 text-xs font-bold text-white">
              {formatGel(ticket.price)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-xs text-[#78849b]">
          Card ···· {order.cardLastFour}
        </span>

        <span className="flex items-center gap-3">
          <span className={LABEL_CLASS}>Total</span>
          <span className="text-2xl font-black tracking-tight text-white">
            {formatGel(order.totalPrice)}
          </span>
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleTickets}
          className={`flex-1 ${BTN_PRIMARY}`}
        >
          My Tickets
        </button>

        <button
          type="button"
          onClick={onClose}
          className={BTN_SECONDARY}
        >
          Close
        </button>
      </div>
    </div>
  )
}