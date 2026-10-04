import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

import { API_BASE_URL } from './endpoints'

import {
  TOKEN_KEY,
  clearSession,
  handleUnauthorized,
  setReplay,
  type ReplayAction,
} from '@/features/auth/authSlice'

import { parseApiError } from '@/utils/errorHandling'

import type { store as AppStore } from '@/app/store'

/**
 * Расширяем Axios config собственным
 * serializable полем для replay.
 *
 * ВАЖНО:
 * Здесь нет функций.
 */
type AuthRequestConfig = InternalAxiosRequestConfig & {
  authReplay?: ReplayAction
}

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
 * Добавляем Bearer token к каждому запросу.
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
 * Проверяем, является ли запрос login/register.
 *
 * Такие запросы не должны открывать Login Modal
 * повторно при 401.
 */
function isCredentialRequest(
  url: string,
): boolean {
  const normalizedUrl = url.toLowerCase()

  return (
    normalizedUrl.includes('/login') ||
    normalizedUrl.includes('/register')
  )
}

/**
 * Получаем replay, который был связан
 * непосредственно с конкретным запросом.
 */
function getRequestReplay(
  config: AuthRequestConfig | undefined,
): ReplayAction {
  return config?.authReplay ?? null
}

/**
 * Глобальная обработка API ошибок.
 */
api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    const parsed = parseApiError(error)

    const config =
      error.config as AuthRequestConfig | undefined

    const url = config?.url ?? ''

    const isCredentialCall =
      isCredentialRequest(url)

    /**
     * 401 означает:
     *
     * - текущая сессия больше недействительна;
     * - пользователя нужно отправить
     *   в Login Modal;
     * - после login необходимо
     *   продолжить действие.
     */
    if (
      parsed.status === 401 &&
      !isCredentialCall &&
      storeRef
    ) {
      const state = storeRef.getState()

      /**
       * Приоритет:
       *
       * 1. Replay, переданный конкретным запросом.
       * 2. Уже сохранённый replay.
       * 3. Booking fallback.
       */
      let replay =
        getRequestReplay(config) ??
        state.auth.replay

      /**
       * Fallback для booking.
       *
       * Это особенно полезно, если 401 произошёл
       * уже после открытия Booking Modal.
       */
      if (
        !replay &&
        state.booking?.isOpen &&
        state.booking.sessionId
      ) {
        replay = {
          type: 'book',
          sessionId: state.booking.sessionId,
        }
      }

      /**
       * Сохраняем replay ДО очистки сессии.
       */
      if (replay) {
        storeRef.dispatch(
          setReplay(replay),
        )
      }

      /**
       * Удаляем старую сессию.
       *
       * clearSession специально
       * НЕ удаляет replay.
       */
      storeRef.dispatch(
        clearSession(),
      )

      /**
       * Открываем Login Modal.
       *
       * Передаём replay напрямую,
       * чтобы не потерять действие.
       */
      storeRef.dispatch(
        handleUnauthorized(
          replay
            ? { replay }
            : undefined,
        ),
      )
    }

    /**
     * Важно вернуть parsed error,
     * потому что React Query / mutation
     * должны продолжать обрабатывать ошибку
     * самостоятельно.
     */
    return Promise.reject(parsed)
  },
)
