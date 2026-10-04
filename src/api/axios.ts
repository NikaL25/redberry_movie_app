import axios, { type AxiosError } from 'axios'
import { API_BASE_URL } from './endpoints'
import { TOKEN_KEY } from '@/features/auth/authSlice'
import { parseApiError } from '@/utils/errorHandling'
import type { store as AppStore } from '@/app/store'
import { clearSession, openAuthModal, setReplay } from '@/features/auth/authSlice'

let storeRef: typeof AppStore | null = null

export function injectStore(store: typeof AppStore) {
  storeRef = store
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = storeRef?.getState().auth.token ?? localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const parsed = parseApiError(error)
    const url = error.config?.url ?? ''
    const isCredentialCall = url.includes('/login') || url.includes('/register')
    if (parsed.status === 401 && !isCredentialCall) {
      const booking = storeRef?.getState().booking
      storeRef?.dispatch(clearSession())
      if (booking?.isOpen && booking.sessionId) {
        storeRef?.dispatch(setReplay({ type: 'book', sessionId: booking.sessionId }))
      }
      storeRef?.dispatch(openAuthModal('login'))
    }
    return Promise.reject(parsed)
  },
)
