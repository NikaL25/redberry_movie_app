import { useDispatch } from 'react-redux'
import { openAuthModal, openProfileModal, setReplay } from '@/features/auth/authSlice'
import { openBooking } from './bookingSlice'
import { useAuth } from '@/hooks/useAuth'

export function useBookingFlow() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAuth()

  function startBooking(sessionId: number) {
    if (!isAuthenticated) {
      dispatch(setReplay({ type: 'book', sessionId }))
      dispatch(openAuthModal('login'))
      return
    }
    if (user && !user.profileComplete) {
      dispatch(setReplay({ type: 'book', sessionId }))
      dispatch(openProfileModal())
      return
    }
    dispatch(openBooking(sessionId))
  }

  return { startBooking }
}
