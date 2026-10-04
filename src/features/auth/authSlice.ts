import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types/models'

export const TOKEN_KEY = 'kinoxii_token'

export type AuthModalMode = 'closed' | 'login' | 'register'

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

/**
 * Действие, которое пользователь начал выполнять
 * до открытия Login Modal.
 *
 * ВАЖНО:
 * Здесь нельзя хранить функцию.
 * Redux state должен оставаться serializable.
 */
export type ReplayAction =
  | {
      type: 'book'
      sessionId: number
    }
  | {
      type: 'notify'
      slug: string
    }
  | {
      type: 'profile'
    }
  | {
      type: 'tickets'
    }
  | {
      type: 'foyer-order'
    }
  | null

export type AuthState = {
  token: string | null
  user: User | null

  status: AuthStatus

  /**
   * Login / Register modal.
   */
  modal: AuthModalMode

  /**
   * Profile modal.
   */
  profileModal: boolean

  /**
   * Действие, которое нужно продолжить
   * после успешной авторизации.
   */
  replay: ReplayAction

  /**
   * Ошибка login/register.
   */
  errorMessage: string | null
}

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

const initialState: AuthState = {
  token: getInitialToken(),
  user: null,
  status: 'idle',
  modal: 'closed',
  profileModal: false,
  replay: null,
  errorMessage: null,
}

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    /**
     * Успешный login/register.
     */
    setCredentials(
      state,
      action: PayloadAction<{
        user: User
        token: string
      }>,
    ) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.status = 'success'
      state.errorMessage = null
      state.modal = 'closed'

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          TOKEN_KEY,
          action.payload.token,
        )
      }
    },

    /**
     * Обновление пользователя.
     */
    setUser(
      state,
      action: PayloadAction<User>,
    ) {
      state.user = action.payload
      state.status = 'success'
    },

    /**
     * Статус auth-запроса.
     */
    setAuthStatus(
      state,
      action: PayloadAction<AuthStatus>,
    ) {
      state.status = action.payload
    },

    /**
     * Открытие Login/Register.
     */
    openAuthModal(
      state,
      action: PayloadAction<
        Exclude<AuthModalMode, 'closed'>
      >,
    ) {
      state.modal = action.payload
      state.profileModal = false
    },

    /**
     * Закрытие Login/Register.
     */
    closeAuthModal(state) {
      state.modal = 'closed'
      state.errorMessage = null
    },

    /**
     * Открытие Profile Modal.
     */
    openProfileModal(state) {
      state.profileModal = true
      state.modal = 'closed'
    },

    /**
     * Закрытие Profile Modal.
     */
    closeProfileModal(state) {
      state.profileModal = false
    },

    /**
     * Сохраняем действие, которое нужно продолжить
     * после авторизации.
     */
    setReplay(
      state,
      action: PayloadAction<ReplayAction>,
    ) {
      state.replay = action.payload
    },

    /**
     * Удаляем replay после его выполнения.
     */
    clearReplay(state) {
      state.replay = null
    },

    /**
     * Ошибка авторизации.
     */
    setAuthError(
      state,
      action: PayloadAction<string | null>,
    ) {
      state.errorMessage = action.payload
      state.status = action.payload
        ? 'error'
        : state.status
    },

    /**
     * 401 от API.
     *
     * Axios вызывает этот reducer.
     */
    handleUnauthorized(
      state,
      action: PayloadAction<{
        replay?: ReplayAction
      } | undefined>,
    ) {
      state.modal = 'login'
      state.profileModal = false
      state.errorMessage = null

      if (action.payload?.replay) {
        state.replay = action.payload.replay
      }
    },

    /**
     * Полный logout / очистка истёкшей сессии.
     *
     * ВАЖНО:
     * replay здесь НЕ очищаем.
     *
     * Потому что при 401 нам нужно сохранить
     * действие пользователя и выполнить его
     * после повторного login.
     */
    clearSession(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.modal = 'closed'
      state.profileModal = false
      state.errorMessage = null

      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY)
      }
    },

    /**
     * Полный logout пользователя.
     *
     * В отличие от clearSession этот action
     * также удаляет replay.
     */
    logout(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.modal = 'closed'
      state.profileModal = false
      state.replay = null
      state.errorMessage = null

      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY)
      }
    },
  },
})

export const {
  setCredentials,
  setUser,
  setAuthStatus,
  openAuthModal,
  closeAuthModal,
  openProfileModal,
  closeProfileModal,
  setReplay,
  clearReplay,
  setAuthError,
  handleUnauthorized,
  clearSession,
  logout,
} = authSlice.actions

export default authSlice.reducer
