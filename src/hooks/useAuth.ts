import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { queryKeys } from '@/app/queryClient'
import type { RootState } from '@/app/store'
import { fetchMe, logout } from '@/features/auth/authApi'
import {
  clearSession,
  setAuthStatus,
  setUser,
  openAuthModal,
  setReplay,
} from '@/features/auth/authSlice'

export function useAuth() {
  const dispatch = useDispatch()

  const {
    token,
    user,
    status,
    modal,
    profileModal,
  } = useSelector(
    (state: RootState) => state.auth,
  )

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (!query.data) {
      return
    }

    dispatch(setUser(query.data))
  }, [dispatch, query.data])

  /**
   * 401 не обрабатываем здесь.
   *
   * Axios interceptor является единым местом
   * обработки истёкшей auth-сессии.
   *
   * Это предотвращает двойной clearSession()
   * и позволяет сохранить replay action.
   */

  const isAuthenticated =
    Boolean(token && user)

  const isGuest = !token

  const isLoading =
    Boolean(
      query.isLoading &&
      token &&
      !user,
    )

  return {
    token,

    user,

    status: isLoading
      ? 'loading'
      : status,

    isAuthenticated,

    isGuest,

    profileComplete:
      Boolean(user?.profileComplete),

    modal,

    profileModal,

    requireAuth(
      replay?: RootState['auth']['replay'],
    ) {
      if (token && user) {
        return true
      }

      if (replay) {
        dispatch(setReplay(replay))
      }

      dispatch(openAuthModal('login'))

      return false
    },

    async signOut() {
      try {
        await logout()
      } catch {
        /*
         * Даже если API logout завершился ошибкой,
         * локальная auth-сессия должна быть удалена.
         */
      }

      dispatch(clearSession())
      dispatch(setAuthStatus('idle'))
    },
  }
}
