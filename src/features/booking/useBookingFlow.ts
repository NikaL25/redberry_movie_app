import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
  openAuthModal,
  openProfileModal,
  setReplay,
} from '@/features/auth/authSlice'

import { openBooking } from '@/features/booking/bookingSlice'
import { useAuth } from '@/hooks/useAuth'

export function useBookingFlow() {
  const dispatch = useDispatch()

  const {
    isAuthenticated,
    user,
  } = useAuth()

  const startBooking = useCallback(
    (sessionId: number) => {
      /**
       * Некорректный sessionId
       * не должен запускать booking flow.
       */
      if (
        !Number.isFinite(sessionId) ||
        sessionId <= 0
      ) {
        return
      }

      /**
       * --------------------------------------------------
       * GUEST
       * --------------------------------------------------
       *
       * Сохраняем защищённое действие.
       *
       * После успешного login replay автоматически
       * продолжит booking.
       */
      if (
        !isAuthenticated ||
        !user
      ) {
        dispatch(
          setReplay({
            type: 'book',
            sessionId,
          }),
        )

        dispatch(
          openAuthModal('login'),
        )

        return
      }

      /**
       * --------------------------------------------------
       * AUTHENTICATED + INCOMPLETE PROFILE
       * --------------------------------------------------
       *
       * Booking запрещён до заполнения обязательных
       * данных профиля.
       *
       * Replay сохраняется, чтобы после Save Changes
       * booking был продолжен автоматически.
       */
      if (!user.profileComplete) {
        dispatch(
          setReplay({
            type: 'book',
            sessionId,
          }),
        )

        dispatch(
          openProfileModal(),
        )

        return
      }

      /**
       * --------------------------------------------------
       * AUTHENTICATED + COMPLETE PROFILE
       * --------------------------------------------------
       */
      dispatch(
        openBooking(sessionId),
      )
    },
    [
      dispatch,
      isAuthenticated,
      user,
    ],
  )

  return {
    startBooking,
  }
}