import {  Outlet, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import { openAuthModal, setReplay } from '@/features/auth/authSlice'
import { useAuth } from '@/features/auth/useAuth'

export function ProtectedRoute() {
const dispatch = useDispatch()
const location = useLocation()
const { token, user, status } = useAuth()

/*

Пока useAuth проверяет существующий token через /me,

не делаем преждевременный redirect.
*/
if (token && !user && status === 'loading') {
return null
}

/*

Неавторизованный пользователь не должен

терять текущий маршрут.

Вместо redirect:

/profile

↓

Login Modal

↓

успешный login

↓

/profile
*/
if (!token || !user) {
const replay =
location.pathname === '/profile' &&
new URLSearchParams(location.search).get('tab') === 'tickets'
? {
type: 'tickets' as const,
}
: {
type: 'profile' as const,
}

dispatch(setReplay(replay))
dispatch(openAuthModal('login'))

/*
 * Пока auth modal открыт, текущий location
 * остаётся неизменным.
 *
 * Navigate не нужен.
 */
return null


}

return <Outlet />
}