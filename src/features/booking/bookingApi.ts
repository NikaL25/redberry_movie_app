import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { CheckoutPayload, HoldSeatPayload } from '@/types/api'
import type { Order, SeatHold } from '@/types/models'

export async function createHold(sessionId: number, seats: HoldSeatPayload[]) {
  const { data } = await api.post<{ data: SeatHold }>(endpoints.holds(sessionId), { seats })
  return data.data
}

export async function fetchHold(holdId: string) {
  const { data } = await api.get<{ data: SeatHold }>(endpoints.hold(holdId))
  return data.data
}

export async function releaseHold(holdId: string) {
  await api.delete(endpoints.hold(holdId))
}

export async function createOrder(payload: CheckoutPayload) {
  const { data } = await api.post<{ data: Order }>(endpoints.orders, payload)
  return data.data
}
