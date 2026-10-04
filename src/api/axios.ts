import axios, {
  type AxiosError,
} from 'axios'

import { API_BASE_URL } from './endpoints'

import {
  TOKEN_KEY,
  clearSession,
  handleUnauthorized,
  setReplay,
} from '@/features/auth/authSlice'

import { parseApiError } from '@/utils/errorHandling'

import type { store as AppStore } from '@/app/store'

let storeRef: typeof AppStore | null = null

/**
 * Redux store передаётся сюда после создания store.
 */
export function injectStore(
  store: typeof AppStore,
) {
  storeRef = store
}

export const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    Accept: 'application/json',
  },
})

/**
 * Добавляем Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    const token =
      storeRef?.getState().auth.token ??
      (
        typeof window !== 'undefined'
          ? localStorage.getItem(TOKEN_KEY)
          : null
      )

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    return config
  },
)

/**
 * Глобальная обработка API ошибок.
 */
api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    const parsed = parseApiError(error)

    const url = error.config?.url ?? ''

    /**
     * Login/register нельзя считать
     * защищённым действием.
     *
     * Иначе:
     *
     * login → 401 → login modal → login → ...
     */
    const isCredentialCall =
      url.includes('/login') ||
      url.includes('/register')

    if (
      parsed.status === 401 &&
      !isCredentialCall &&
      storeRef
    ) {
      const state = storeRef.getState()

      /**
       * Если запрос был связан с booking,
       * сохраняем booking как replay.
       *
       * Это fallback для случаев,
       * когда 401 произошёл уже внутри booking.
       */
      const booking = state.booking

      if (
        booking?.isOpen &&
        booking.sessionId
      ) {
        storeRef.dispatch(
          setReplay({
            type: 'book',
            sessionId: booking.sessionId,
          }),
        )
      }

      /**
       * ВАЖНО:
       * clearSession НЕ очищает replay.
       */
      storeRef.dispatch(
        clearSession(),
      )

      /**
       * Открываем Login Modal.
       */
      storeRef.dispatch(
        handleUnauthorized(),
      )
    }

    return Promise.reject(parsed)
  },
)
