import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types/api'
import type { User } from '@/types/models'

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>(endpoints.login, payload)
  return data.data
}

export async function register(payload: RegisterPayload) {
  const form = new FormData()
  form.append('username', payload.username)
  form.append('email', payload.email)
  form.append('password', payload.password)
  form.append('password_confirmation', payload.passwordConfirmation)
  if (payload.avatar) form.append('avatar', payload.avatar)
  const { data } = await api.post<AuthResponse>(endpoints.register, form)
  return data.data
}

export async function logout() {
  await api.post(endpoints.logout)
}

export async function fetchMe() {
  const { data } = await api.get<{ data: User }>(endpoints.me)
  return data.data
}
