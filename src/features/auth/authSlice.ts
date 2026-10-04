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
 * до авторизации.
 *
 * ВАЖНО:
 * Здесь никогда не храним функции.
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
   * Отдельное модальное окно профиля.
   */
  profileModal: boolean

  /**
   * Действие, которое необходимо
   * продолжить после успешной авторизации.
   */
  replay: ReplayAction

  /**
   * Ошибка авторизации.
   */
  errorMessage: string | null
}

function getInitialToken(): string | null {
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
     * Успешная авторизация.
     *
     * Используется и после login, и после register.
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

      /**
       * Replay специально НЕ очищаем.
       *
       * Он будет очищен только после того,
       * как прерванное действие действительно
       * будет продолжено.
       */
      state.modal = 'closed'
      state.profileModal = false

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          TOKEN_KEY,
          action.payload.token,
        )
      }
    },

    /**
     * Обновление данных текущего пользователя.
     */
    setUser(
      state,
      action: PayloadAction<User>,
    ) {
      state.user = action.payload
      state.status = 'success'
      state.errorMessage = null
    },

    /**
     * Состояние auth-запроса.
     */
    setAuthStatus(
      state,
      action: PayloadAction<AuthStatus>,
    ) {
      state.status = action.payload
    },

    /**
     * Открытие Login/Register.
     *
     * При переключении между модалками
     * старая ошибка не должна переноситься
     * в новую форму.
     *
     * Replay при этом сохраняется.
     */
    openAuthModal(
      state,
      action: PayloadAction<
        Exclude<AuthModalMode, 'closed'>
      >,
    ) {
      state.modal = action.payload
      state.profileModal = false
      state.errorMessage = null
      state.status = 'idle'
    },

    /**
     * Закрытие Login/Register.
     *
     * Replay намеренно сохраняем.
     *
     * Это позволяет закрыть модалку и,
     * например, открыть её снова, не потеряв
     * защищённое действие.
     */
    closeAuthModal(state) {
      state.modal = 'closed'
      state.errorMessage = null
      state.status = 'idle'
    },

    /**
     * Открытие Profile Modal.
     */
    openProfileModal(state) {
      state.profileModal = true
      state.modal = 'closed'
      state.errorMessage = null
    },

    /**
     * Закрытие Profile Modal.
     */
    closeProfileModal(state) {
      state.profileModal = false
    },

    /**
     * Сохранение защищённого действия.
     *
     * Например:
     *
     * dispatch(
     *   setReplay({
     *     type: 'book',
     *     sessionId: 123,
     *   }),
     * )
     */
    setReplay(
      state,
      action: PayloadAction<ReplayAction>,
    ) {
      state.replay = action.payload
    },

    /**
     * Очистка replay.
     *
     * Вызывается только после того,
     * как действие действительно продолжено.
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

      if (action.payload) {
        state.status = 'error'
      }
    },

    /**
     * API вернул 401.
     *
     * replay можно передать непосредственно
     * из Axios.
     *
     * Если replay не передан, уже сохранённый
     * replay НЕ удаляется.
     */
    handleUnauthorized(
      state,
      action: PayloadAction<
        { replay?: ReplayAction } | undefined
      >,
    ) {
      state.modal = 'login'
      state.profileModal = false
      state.errorMessage = null
      state.status = 'idle'

      if (action.payload?.replay) {
        state.replay = action.payload.replay
      }
    },

    /**
     * Очистка истёкшей сессии.
     *
     * ВАЖНО:
     * replay сохраняется.
     *
     * Сценарий:
     *
     * protected action
     *      ↓
     * 401
     *      ↓
     * clearSession
     *      ↓
     * login modal
     *      ↓
     * successful login
     *      ↓
     * replay
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

      /**
       * НЕ делаем:
       *
       * state.replay = null
       */
    },

    /**
     * Полный logout пользователя.
     *
     * В отличие от clearSession:
     * replay здесь удаляется.
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
