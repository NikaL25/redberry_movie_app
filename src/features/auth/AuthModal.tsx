import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ModalOverlay } from '@/components/modals/ModalOverlay'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { queryKeys } from '@/app/queryClient'
import type { RootState } from '@/app/store'
import {
  closeAuthModal,
  openAuthModal,
  openProfileModal,
  setCredentials,
 clearReplay,
} from './authSlice'
import { login, register } from './authApi'
import { flattenErrors, validateAvatar, validateLogin, validateRegister } from '@/utils/validation'
import { isFieldValidation, parseApiError } from '@/utils/errorHandling'
import { openBooking } from '@/features/booking/bookingSlice'
import { notifyMovie } from '@/features/movies/moviesApi'

export function AuthModal() {
  const dispatch = useDispatch()
  const { modal } = useSelector((state: RootState) => state.auth)
  const open = modal !== 'closed'
  const isRegister = modal === 'register'

  return (
    <ModalOverlay
      open={open}
      title={isRegister ? 'Sign Up' : 'Log In'}
      onClose={() => dispatch(closeAuthModal())}
    >
      {isRegister ? <RegisterForm /> : <LoginForm />}
    </ModalOverlay>
  )
}

function useReplay() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const replay = useSelector(
    (state: RootState) => state.auth.replay,
  )

  return async function continueAfterAuth(
    profileComplete: boolean,
  ) {
    const action = replay

    /**
     * Если действия нет — просто закрываем modal.
     */
    if (!action) {
      dispatch(closeAuthModal())
      return
    }

    /**
     * Закрываем Login Modal перед продолжением.
     */
    dispatch(closeAuthModal())

    /**
     * --------------------------------------------------
     * NOTIFY
     * --------------------------------------------------
     */
    if (action.type === 'notify') {
      try {
        await notifyMovie(action.slug)

        await queryClient.invalidateQueries({
          queryKey: queryKeys.comingSoon(6),
        })

        /**
         * Очищаем replay только после
         * успешного выполнения действия.
         */
        dispatch(clearReplay())
      } catch {
        /**
         * Replay оставляем.
         *
         * Если действие завершилось ошибкой,
         * его не следует считать выполненным.
         */
      }

      return
    }

    /**
     * --------------------------------------------------
     * PROFILE
     * --------------------------------------------------
     */
    if (action.type === 'profile') {
      dispatch(clearReplay())
      navigate('/profile')
      return
    }

    /**
     * --------------------------------------------------
     * TICKETS
     * --------------------------------------------------
     */
    if (action.type === 'tickets') {
      dispatch(clearReplay())
      navigate('/profile?tab=tickets')
      return
    }

    /**
     * --------------------------------------------------
     * FOYER ORDER
     * --------------------------------------------------
     *
     * Реальный foyer flow подключим
     * на соответствующем этапе.
     *
     * Пока replay НЕ очищаем, чтобы действие
     * не потерялось.
     */
    if (action.type === 'foyer-order') {
      return
    }

    /**
     * --------------------------------------------------
     * BOOKING
     * --------------------------------------------------
     */
    if (action.type === 'book') {
      /**
       * Авторизация есть, но профиль неполный.
       *
       * Booking начинать нельзя.
       *
       * Replay сохраняем.
       *
       * Profile Modal после сохранения профиля
       * сможет продолжить booking.
       */
      if (!profileComplete) {
        dispatch(openProfileModal())
        return
      }

      /**
       * Профиль полный — можно открыть booking.
       */
      dispatch(openBooking(action.sessionId))

      /**
       * Действие действительно продолжено.
       */
      dispatch(clearReplay())

      return
    }

    /**
     * Теоретически сюда попасть нельзя,
     * но replay всё равно очищаем для безопасности.
     */
    dispatch(clearReplay())
  }
}


function LoginForm() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const continueAfterAuth = useReplay()
  const errorMessage = useSelector((state: RootState) => state.auth.errorMessage)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

const mutation = useMutation({
  mutationFn: login,

  async onSuccess(result) {
    dispatch(setCredentials(result))

    await queryClient.invalidateQueries({
      queryKey: queryKeys.me,
    })

    await continueAfterAuth(
      Boolean(result.user.profileComplete),
    )
  },
})

  const fieldErrors = {
    ...validateLogin({ email, password }),
    ...(mutation.error && isFieldValidation(parseApiError(mutation.error))
      ? flattenErrors(parseApiError(mutation.error).errors)
      : {}),
  }
  const apiError = mutation.error ? parseApiError(mutation.error) : null
  const banner =
    errorMessage ??
    (apiError && !isFieldValidation(apiError) ? apiError.message : null)

  const show = (name: string) => submitted || Boolean(touched[name])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const next = validateLogin({ email, password })
    if (Object.keys(next).length) return
    mutation.mutate({ email, password })
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <h2>Log In</h2>
      {banner ? <p className="banner banner-error" role="alert">{banner}</p> : null}
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        disabled={mutation.isPending}
        value={email}
        onChange={(e) => { mutation.reset(); setEmail(e.target.value) }}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={show('email') ? fieldErrors.email : undefined}
        valid={show('email') && !fieldErrors.email && Boolean(email)}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={mutation.isPending}
        value={password}
        onChange={(e) => { mutation.reset(); setPassword(e.target.value) }}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={show('password') ? fieldErrors.password : undefined}
        valid={show('password') && !fieldErrors.password && Boolean(password)}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Signing in…' : 'Log In'}
      </Button>
      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={() => dispatch(openAuthModal('register'))}>
          Sign Up
        </button>
      </p>
    </form>
  )
}

function RegisterForm() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const continueAfterAuth = useReplay()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const previewUrl = useRef<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    }
  }, [])

  const mutation = useMutation({
    mutationFn: register,
    async onSuccess(result) {
      dispatch(setCredentials(result))
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
      await continueAfterAuth(result.user.profileComplete)
    },
  })

  const values = { username, email, password, passwordConfirmation, avatar }
  const localErrors = validateRegister(values)
  const apiError = mutation.error ? parseApiError(mutation.error) : null
  const fieldErrors = {
    ...localErrors,
    ...(apiError && isFieldValidation(apiError) ? flattenErrors(apiError.errors) : {}),
  }
  const banner = apiError && !isFieldValidation(apiError) ? apiError.message : null
  const show = (name: string) => submitted || Boolean(touched[name])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateRegister(values)).length) return
    mutation.mutate({ username, email, password, passwordConfirmation, avatar })
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <h2>Sign Up</h2>
      {banner ? <p className="banner banner-error" role="alert">{banner}</p> : null}
      <Input
        label="Username"
        name="username"
        autoComplete="username"
        minLength={3}
        required
        disabled={mutation.isPending}
        value={username}
        onChange={(e) => { mutation.reset(); setUsername(e.target.value) }}
        onBlur={() => setTouched((t) => ({ ...t, username: true }))}
        error={show('username') ? fieldErrors.username : undefined}
        valid={show('username') && !fieldErrors.username && Boolean(username)}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        disabled={mutation.isPending}
        value={email}
        onChange={(e) => { mutation.reset(); setEmail(e.target.value) }}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={show('email') ? fieldErrors.email : undefined}
        valid={show('email') && !fieldErrors.email && Boolean(email)}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={3}
        required
        disabled={mutation.isPending}
        value={password}
        onChange={(e) => { mutation.reset(); setPassword(e.target.value) }}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={show('password') ? fieldErrors.password : undefined}
        valid={show('password') && !fieldErrors.password && Boolean(password)}
      />
      <Input
        label="Confirm Password"
        name="password_confirmation"
        type="password"
        autoComplete="new-password"
        minLength={3}
        required
        disabled={mutation.isPending}
        value={passwordConfirmation}
        onChange={(e) => { mutation.reset(); setPasswordConfirmation(e.target.value) }}
        onBlur={() => setTouched((t) => ({ ...t, password_confirmation: true }))}
        error={show('password_confirmation') ? fieldErrors.password_confirmation : undefined}
        valid={show('password_confirmation') && !fieldErrors.password_confirmation && Boolean(passwordConfirmation)}
      />
      <label className="field">
        <span className="field-label">Avatar (optional)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          disabled={mutation.isPending}
          onChange={(e) => {
            mutation.reset()
            const file = e.target.files?.[0] ?? null
            setAvatar(file)
            setTouched((current) => ({ ...current, avatar: true }))
            if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
            previewUrl.current = file && !validateAvatar(file) ? URL.createObjectURL(file) : null
            setPreview(previewUrl.current)
          }}
          onBlur={() => setTouched((t) => ({ ...t, avatar: true }))}
        />
        {preview ? <img className="avatar-preview" src={preview} alt="Avatar preview" /> : null}
        {show('avatar') && fieldErrors.avatar ? <span className="field-error">{fieldErrors.avatar}</span> : null}
      </label>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating account…' : 'Sign Up'}
      </Button>
      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={() => dispatch(openAuthModal('login'))}>
          Log In
        </button>
      </p>
    </form>
  )
}
