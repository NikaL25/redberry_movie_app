import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/types/models'

export const TOKEN_KEY = 'kinoxii_token'

export type AuthModalMode = 'closed' | 'login' | 'register'
export type ReplayAction =
  | { type: 'book'; sessionId: number }
  | { type: 'notify'; slug: string }
  | { type: 'profile' }
  | { type: 'tickets' }
  | null

type AuthState = {
  [x: string]: any
  token: string | null
  user: User | null
  status: 'idle' | 'loading' | 'success' | 'error'
  modal: AuthModalMode
  profileModal: boolean
  replay: ReplayAction
  errorMessage: string | null
}

const initialState: AuthState = {
  token: localStorage.getItem(TOKEN_KEY),
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
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.status = 'success'
      state.errorMessage = null
      localStorage.setItem(TOKEN_KEY, action.payload.token)
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.status = 'success'
    },
    setAuthStatus(state, action: PayloadAction<AuthState['status']>) {
      state.status = action.payload
    },
    clearSession(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      localStorage.removeItem(TOKEN_KEY)
    },
    openAuthModal(state, action: PayloadAction<Exclude<AuthModalMode, 'closed'>>) {
      state.modal = action.payload
      state.profileModal = false
    },
    closeAuthModal(state) {
      state.modal = 'closed'
      state.errorMessage = null
    },
    openProfileModal(state) {
      state.profileModal = true
    },
    closeProfileModal(state) {
      state.profileModal = false
    },
    setReplay(state, action: PayloadAction<ReplayAction>) {
      state.replay = action.payload
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload
    },
  },
})

export const {
  setCredentials,
  setUser,
  setAuthStatus,
  clearSession,
  openAuthModal,
  closeAuthModal,
  openProfileModal,
  closeProfileModal,
  setReplay,
  setAuthError,
} = authSlice.actions

export default authSlice.reducer
