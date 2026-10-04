import type { Movie, MovieDetail, Order, SeatHold, SeatMap, Session, SessionGroup, SessionsMeta, User, VenueSessionGroup } from './models'

export type DataEnvelope<T> = { data: T }

export type AuthResponse = DataEnvelope<{ user: User; token: string }>

export type SessionsListResponse = {
  data: SessionGroup[]
  meta: SessionsMeta
}

export type ValidationErrorBody = {
  message: string
  errors?: Record<string, string[]>
}

export type ConflictBody = {
  message: string
  contested?: string[]
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  passwordConfirmation: string
  avatar?: File | null
}

export type LoginPayload = {
  email: string
  password: string
}

export type ProfilePayload = {
  fullName: string
  mobileNumber: string
  dateOfBirth: string
  preferredVenueId?: number | null
  avatar?: File | null
}

export type HoldSeatPayload = {
  seatId: number
  ticketType: 'adult' | 'child' | 'student'
}

export type CheckoutPayload = {
  holdId: string
  fullName: string
  email: string
  mobileNumber: string
  cardNumber: string
  expiry: string
  cvv: string
}

export type SessionFilters = {
  date?: string
  venues: string[]
  formats: string[]
  languages: string[]
  bands: string[]
  search: string
  sort: string
  page: number
}

export type MovieBySlug = DataEnvelope<MovieDetail>
export type MovieSessions = DataEnvelope<VenueSessionGroup[]>
export type SessionDetail = DataEnvelope<Session>
export type SeatMapResponse = DataEnvelope<SeatMap>
export type HoldResponse = DataEnvelope<SeatHold>
export type OrderResponse = DataEnvelope<Order>
export type TicketsResponse = DataEnvelope<Order[]>
export type SearchResponse = DataEnvelope<Movie[]>
