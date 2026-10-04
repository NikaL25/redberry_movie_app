import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ProfilePayload } from '@/types/api'
import type { Order, User } from '@/types/models'

export async function updateProfile(payload: ProfilePayload) {
  const form = new FormData()
  form.append('fullName', payload.fullName)
  form.append('mobileNumber', payload.mobileNumber)
  form.append('dateOfBirth', payload.dateOfBirth)
  if (payload.preferredVenueId != null) {
    form.append('preferredVenueId', String(payload.preferredVenueId))
  }
  if (payload.avatar) form.append('avatar', payload.avatar)
  const { data } = await api.put<{ data: User }>(endpoints.profile, form)
  return data.data
}

export async function fetchTickets(filter?: 'upcoming' | 'past') {
  const { data } = await api.get<{ data: Order[] }>(endpoints.tickets, {
    params: filter ? { filter } : undefined,
  })
  return data.data
}

export async function refundOrder(reference: string) {
  const { data } = await api.post<{ data: Order }>(endpoints.refund(reference))
  return data.data
}
