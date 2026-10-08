import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
  openAuthModal,
  openProfileModal,
  setReplay,
} from '@/features/auth/authSlice'

import { openBooking } from './bookingSlice'
import { useAuth } from '@/features/auth/useAuth'

export function useBookingFlow() {
  const dispatch = useDispatch()
  const { isAuthenticated, user, status } = useAuth()

  const startBooking = useCallback(
    (sessionId: number) => {
      // Ignore invalid session IDs.
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return
      }

      // Wait until authentication state has been restored.
      // This prevents treating an authenticated user as a guest
      // while /me or persisted auth state is still loading.
      if (status === 'loading') {
        return
      }

      // Guest:
      // remember the protected action and open Login.
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

      // Authenticated user with an incomplete profile:
      // remember the booking action and open Profile.
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

      // Authenticated user with a complete profile:
      // continue directly to seat selection.
      dispatch(openBooking(sessionId))
    },
    [dispatch, isAuthenticated, status, user],
  )

  return {
    startBooking,
  }
}
