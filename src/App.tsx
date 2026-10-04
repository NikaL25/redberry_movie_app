import AppRoutes from './routes/AppRoutes'
import { AuthModal } from './features/auth/AuthModal'
import { BookingModal } from './features/booking/BookingModal'
import { ProfileModal } from './features/profile/ProfileModal'

export default function App() {
  return (
    <>
      <AppRoutes />
      <AuthModal />
      <ProfileModal />
      <BookingModal />
    </>
  )
}
