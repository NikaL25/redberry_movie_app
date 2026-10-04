import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
  openAuthModal,
  openProfileModal,
  setReplay,
} from '@/features/auth/authSlice'

import { openBooking } from './bookingSlice'
import { useAuth } from '@/hooks/useAuth'

export function useBookingFlow() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAuth()

  const startBooking = useCallback(
    (sessionId: number) => {
      /**
       * Защита от некорректного sessionId.
       */
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return
      }

      /**
       * --------------------------------------------------
       * 1. НЕАВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ
       * --------------------------------------------------
       *
       * Сохраняем действие, которое пользователь
       * пытался выполнить.
       *
       * После успешного Login AuthModal выполнит:
       *
       * openBooking(sessionId)
       */
      if (!isAuthenticated || !user) {
        dispatch(
          setReplay({
            type: 'book',
            sessionId,
          }),
        )

        dispatch(openAuthModal('login'))

        return
      }

      /**
       * --------------------------------------------------
       * 2. АВТОРИЗОВАН, НО ПРОФИЛЬ НЕ ЗАПОЛНЕН
       * --------------------------------------------------
       *
       * Покупать билет с неполным профилем нельзя.
       *
       * Replay сохраняем, потому что после заполнения
       * профиля пользователь должен автоматически
       * продолжить бронирование.
       */
      if (!user.profileComplete) {
        dispatch(
          setReplay({
            type: 'book',
            sessionId,
          }),
        )

        dispatch(openProfileModal())

        return
      }

      /**
       * --------------------------------------------------
       * 3. АВТОРИЗОВАН + ПРОФИЛЬ ЗАПОЛНЕН
       * --------------------------------------------------
       *
       * Можно непосредственно открыть booking flow.
       */
      dispatch(openBooking(sessionId))
    },
    [dispatch, isAuthenticated, user],
  )

  return {
    startBooking,
  }
}
