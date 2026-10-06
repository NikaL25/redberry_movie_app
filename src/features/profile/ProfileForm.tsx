import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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
}, [
  dateOfBirth,
  fullName,
  mobileNumber,
  preferredVenueId,
  user,
])


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
    <form className="profile-form" onSubmit={onSubmit} noValidate>
      {!user.profileComplete ? (
        <p className="banner banner-warn">Please complete your profile to enable booking.</p>
      ) : (
        <p className="banner banner-ok">Profile Complete ✓</p>
      )}
      {ratingWarning ? <p className="banner banner-warn">{ratingWarning}</p> : null}
      {apiError && !isFieldValidation(apiError) ? <p className="banner banner-error">{apiError.message}</p> : null}
      {saved ? <p className="banner banner-ok">Profile saved.</p> : null}
      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
        error={show('fullName') ? fieldErrors.fullName : undefined}
        valid={show('fullName') && !fieldErrors.fullName && Boolean(fullName)}
      />
      <Input label="Email" value={user.email} disabled hint="Set at registration and cannot be changed" />
      <Input
        label="Mobile Number"
        value={mobileNumber}
        onChange={(e) => setMobileNumber(formatMobileDisplay(e.target.value))}
        onBlur={() => setTouched((t) => ({ ...t, mobileNumber: true }))}
        error={show('mobileNumber') ? fieldErrors.mobileNumber : undefined}
        valid={show('mobileNumber') && !fieldErrors.mobileNumber && Boolean(mobileNumber)}
        placeholder="5XX XXX XXX"
      />
      <Input
        label="Date of Birth"
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, dateOfBirth: true }))}
        error={show('dateOfBirth') ? fieldErrors.dateOfBirth : undefined}
        valid={show('dateOfBirth') && !fieldErrors.dateOfBirth && Boolean(dateOfBirth)}
      />
      {!compact ? (
        <label className="field">
          <span className="field-label">Preferred Venue</span>
          <select
            className="field-input"
            value={preferredVenueId}
            onChange={(e) => setPreferredVenueId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">No preference</option>
            {options.data?.venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Button type="submit" disabled={mutation.isPending || !dirty || invalid}>
        {mutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
