import { useEffect, useId, useMemo, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, ChevronDown } from 'lucide-react'
import { queryKeys } from '@/app/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { useFilterOptions } from '@/features/sessions/sessionsQueries'
import { updateProfile } from './profileApi'
import { closeProfileModal, setReplay, setUser } from '@/features/auth/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import { digitsOnly, formatMobileDisplay } from '@/utils/formatters'
import { flattenErrors, validateProfile } from '@/utils/validation'
import { isFieldValidation, parseApiError } from '@/utils/errorHandling'
import { openBooking } from '@/features/booking/bookingSlice'
import type { RootState } from '@/app/store'

/* ------------------------------------------------------------------ */
/* Стили                                                               */
/* ------------------------------------------------------------------ */

const LABEL = 'mb-2 block text-xs font-medium text-gray-300'

const CONTROL =
  'w-full rounded-xl border bg-[#181f31] px-4 py-3 text-sm text-gray-200 transition-all placeholder:text-[#717d91] focus:bg-[#1d263b] focus:outline-none focus:ring-1 focus:ring-gray-600 disabled:cursor-default disabled:opacity-100'

function borderFor(error?: string, valid?: boolean) {
  if (error) return 'border-[#ff3b1d]/60'
  if (valid) return 'border-emerald-500/40'
  return 'border-transparent'
}

const BANNER_BASE = 'rounded-xl border px-4 py-3 text-[13px]'
const BANNER_WARN = `${BANNER_BASE} border-amber-500/30 bg-amber-500/10 text-amber-200`
const BANNER_OK = `${BANNER_BASE} border-emerald-500/30 bg-emerald-500/10 text-emerald-300`
const BANNER_ERROR = `${BANNER_BASE} border-[#ff3b1d]/30 bg-[#ff3b1d]/10 text-[#ff8d7c]`

/* ------------------------------------------------------------------ */
/* Локальные поля (те же пропсы label / error / valid / hint)          */
/* ------------------------------------------------------------------ */

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  error?: string
  valid?: boolean
  hint?: string
  icon?: ReactNode
  inputClassName?: string
}

function Field({ label, error, valid, hint, icon, inputClassName = '', id, ...props }: FieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div>
      <label htmlFor={inputId} className={LABEL}>
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${CONTROL} ${borderFor(error, valid)} ${icon ? 'pr-11' : ''} ${inputClassName}`}
          {...props}
        />
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
            {icon}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-[#ff6b5a]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-2 text-xs font-normal text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Форма                                                               */
/* ------------------------------------------------------------------ */

export function ProfileForm({ onSaved, compact = false }: { onSaved?: () => void; compact?: boolean }) {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const options = useFilterOptions()
  const replay = useSelector((state: RootState) => state.auth.replay)
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [mobileNumber, setMobileNumber] = useState(formatMobileDisplay(user?.mobileNumber ?? ''))
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '')
  const [preferredVenueId, setPreferredVenueId] = useState<number | ''>(user?.preferredVenue?.id ?? '')
  const [avatar] = useState<File | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName ?? '')
    setMobileNumber(formatMobileDisplay(user.mobileNumber ?? ''))
    setDateOfBirth(user.dateOfBirth ?? '')
    setPreferredVenueId(user.preferredVenue?.id ?? '')
  }, [user])

  const mutation = useMutation({
    mutationFn: updateProfile,
    async onSuccess(next) {
      dispatch(setUser(next))

      await queryClient.invalidateQueries({
        queryKey: queryKeys.me,
      })

      setSaved(true)

      if (replay?.type === 'book' && next.profileComplete) {
        dispatch(closeProfileModal())

        dispatch(openBooking(replay.sessionId))

        dispatch(setReplay(null))

        return
      }

      onSaved?.()
    },
  })

  const localErrors = validateProfile({ fullName, mobileNumber, dateOfBirth })
  const apiError = mutation.error ? parseApiError(mutation.error) : null
  const fieldErrors = {
    ...localErrors,
    ...(apiError && isFieldValidation(apiError) ? flattenErrors(apiError.errors) : {}),
  }

  const dirty = useMemo(() => {
    if (!user) return false

    return (
      fullName.trim() !== (user.fullName ?? '') ||
      digitsOnly(mobileNumber) !== (user.mobileNumber ?? '') ||
      dateOfBirth !== (user.dateOfBirth ?? '') ||
      (preferredVenueId || null) !== (user.preferredVenue?.id ?? null)
    )
  }, [dateOfBirth, fullName, mobileNumber, preferredVenueId, user])

  const invalid = Object.keys(localErrors).length > 0
  const show = (name: string) => submitted || Boolean(touched[name])

  if (!user) return null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    setSaved(false)
    if (invalid) return
    mutation.mutate({
      fullName,
      mobileNumber: digitsOnly(mobileNumber),
      dateOfBirth,
      preferredVenueId: preferredVenueId === '' ? null : preferredVenueId,
      avatar,
    })
  }

  const age = user.age
  const ratingWarning =
    age != null && age < 18 ? 'you cannot buy tickets for 16+ or 18+ titles' : null

  return (
    <form className="w-full max-w-[880px] space-y-6" onSubmit={onSubmit} noValidate>
      <div className="space-y-3">
        {!user.profileComplete ? (
          <p className={BANNER_WARN}>Please complete your profile to enable booking.</p>
        ) : (
          <p className={BANNER_OK}>Profile Complete ✓</p>
        )}
        {ratingWarning ? <p className={BANNER_WARN}>{ratingWarning}</p> : null}
        {apiError && !isFieldValidation(apiError) ? (
          <p className={BANNER_ERROR}>{apiError.message}</p>
        ) : null}
        {saved ? <p className={BANNER_OK}>Profile saved.</p> : null}
      </div>

      <Field
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
        error={show('fullName') ? fieldErrors.fullName : undefined}
        valid={show('fullName') && !fieldErrors.fullName && Boolean(fullName)}
      />

      <Field
        label="Email"
        value={user.email}
        disabled
        readOnly
        hint="Set at registration and cannot be changed"
      />

      <Field
        label="Mobile number"
        value={mobileNumber}
        onChange={(e) => setMobileNumber(formatMobileDisplay(e.target.value))}
        onBlur={() => setTouched((t) => ({ ...t, mobileNumber: true }))}
        error={show('mobileNumber') ? fieldErrors.mobileNumber : undefined}
        valid={show('mobileNumber') && !fieldErrors.mobileNumber && Boolean(mobileNumber)}
        placeholder="5XX XXX XXX"
      />

      <Field
        label="Date of birth"
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, dateOfBirth: true }))}
        error={show('dateOfBirth') ? fieldErrors.dateOfBirth : undefined}
        valid={show('dateOfBirth') && !fieldErrors.dateOfBirth && Boolean(dateOfBirth)}
        icon={<Calendar className="h-4 w-4 stroke-[1.8]" aria-hidden="true" />}
        inputClassName="[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
      />

      {!compact ? (
        <div>
          <label htmlFor="preferred-venue" className={LABEL}>
            Preferred Venue (Optional)
          </label>

          <div className="relative">
            <select
              id="preferred-venue"
              className={`${CONTROL} cursor-pointer appearance-none border-transparent pr-11 ${
                preferredVenueId === '' ? 'text-[#717d91]' : ''
              }`}
              value={preferredVenueId}
              onChange={(e) => setPreferredVenueId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="" className="bg-[#181f31] text-gray-200">
                No preference
              </option>
              {options.data?.venues.map((venue) => (
                <option key={venue.id} value={venue.id} className="bg-[#181f31] text-gray-200">
                  {venue.name}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
              <ChevronDown className="h-4 w-4 stroke-[1.8]" aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="pt-2">
        <button
          type="submit"
          disabled={mutation.isPending || !dirty || invalid}
          className="rounded-full bg-[#ff3b1d] px-7 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#ea3215] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}