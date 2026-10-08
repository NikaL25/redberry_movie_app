import { useSelector } from 'react-redux'
import { ModalOverlay } from '@/components/modals/ModalOverlay'
import { ProfileForm } from './ProfileForm'
import type { RootState } from '@/app/store'
import { closeProfileModal } from '@/features/auth/authSlice'
import { useDispatch } from 'react-redux'
import { useAuth } from '@/features/auth/useAuth'

export function ProfileModal() {
  const dispatch = useDispatch()
  const open = useSelector((state: RootState) => state.auth.profileModal)
  const { isAuthenticated } = useAuth()

  return (
    <ModalOverlay open={open && isAuthenticated} title="Complete your profile" onClose={() => dispatch(closeProfileModal())}>
      <div className="auth-form">
        <h2>Complete your profile</h2>
        <p className="lede">Please complete your profile before buying tickets.</p>
        <ProfileForm onSaved={() => dispatch(closeProfileModal())} compact />
      </div>
    </ModalOverlay>
  )
}
