import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'

export function ProtectedRoute() {
  const isAuthenticated = useSelector((state: RootState) => Boolean(state.auth.token && state.auth.user))

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}