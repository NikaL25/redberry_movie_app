import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { queryKeys } from '@/app/queryClient'
import type { RootState } from '@/app/store'
import { fetchMe, logout } from '@/features/auth/authApi'
import { clearSession, openAuthModal, setAuthStatus, setReplay, setUser } from '@/features/auth/authSlice'
import { parseApiError } from '@/utils/errorHandling'

export function useAuth() {
  const dispatch = useDispatch()
  const { token, user, status, modal, profileModal } = useSelector((state: RootState) => state.auth)

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (query.data) dispatch(setUser(query.data))
  }, [dispatch, query.data])

  useEffect(() => {
    if (!query.isError || !token) return
    const error = parseApiError(query.error)
    if (error.status === 401) dispatch(clearSession())
  }, [dispatch, query.error, query.isError, token])

  return {
    token,
    user,
    status: query.isLoading && token && !user ? 'loading' : status,
    isAuthenticated: Boolean(token && user),
    isGuest: !token,
    profileComplete: Boolean(user?.profileComplete),
    modal,
    profileModal,
    requireAuth(replay?: RootState['auth']['replay']) {
      if (token && user) return true
      if (replay) dispatch(setReplay(replay))
      dispatch(openAuthModal('login'))
      return false
    },
    async signOut() {
      try {
        await logout()
      } catch {
        /* local clear still required */
      }
      dispatch(clearSession())
      dispatch(setAuthStatus('idle'))
    },
  }
}
