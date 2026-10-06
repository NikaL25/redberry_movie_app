export type Venue = {
  id: number
  slug: string
  name: string
  city: string
  formats: Format[]
}

export type Format = {
  id: number
  slug: string
  name: string
  priceUplift: number
}

export type Language = {
  id: number
  slug: string
  name: string
  /** Короткий код языка из API (GEO, RUS, ENG). */
  code?: string
}

export type Genre = {
  id: number
  slug: string
  name: string
}

export type AgeRating = {
  code: 'G' | 'PG' | '12+' | '16+' | '18+'
  minAge: number
  description: string
}

export type TicketType = {
  id: number
  slug: 'adult' | 'child' | 'student'
  name: string
  priceRatio: number
  note: string | null
  blockedFromRatingAge: number | null
}

export type User = {
  id: number
  username: string
  email: string
  avatar: string | null
  fullName: string | null
  mobileNumber: string | null
  dateOfBirth: string | null
  age: number | null
  preferredVenue: Venue | null
  profileComplete: boolean
}

export type Movie = {
  id: number
  slug: string
  title: string
  kind: 'film' | 'event'
  runtimeMinutes: number
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string
  isComingSoon: boolean
  isFeatured: boolean
  isNotified?: boolean
  fromPrice: number
  ageRating: AgeRating
  genres: Genre[]
  formats: Format[]
}

export type MovieDetail = Movie & {
  synopsis: string
  director: string | null
  cast: string | null
  availableDates: string[]
}

export type Session = {
  id: number
  startsAt: string
  date: string
  time: string
  timeBand: 'morning' | 'afternoon' | 'evening'
  price: number
  seatsLeft: number
  isSoldOut: boolean
  hall: { id: number; name: string }
  venue: Venue
  format: Format
  language: Language
  movie: Movie
}

export type SeatState = 'available' | 'sold' | 'held' | 'unavailable'

export type Seat = {
  id: number
  code: string
  label: string
  state: SeatState
  aisleAfter: boolean
  isMine: boolean
}

export type SeatMap = {
  sessionId: number
  hall: {
    id: number
    name: string
    venue: Venue
  }
  sections: Array<{
    name: string
    rows: Array<{
      label: string
      seats: Seat[]
    }>
  }>
}

export type SeatHold = {
  holdId: string
  sessionId: number
  expiresAt: string
  secondsRemaining: number
  isLive: boolean
  subtotal: number
  seats: Array<{
    seatId: number
    code: string
    ticketType: { slug: string; name: string }
    price: number
  }>
}

export type Order = {
  id: number
  reference: string
  status: 'paid' | 'refunded'
  totalPrice: number
  paidAt: string
  refundedAt: string | null
  isUpcoming: boolean
  isRefundable: boolean
  cardLastFour: string
  contact: {
    fullName: string
    email: string
    mobileNumber: string
  }
  session: Session
  tickets: Array<{
    id: number
    seatCode: string
    ticketType: { slug: string; name: string }
    price: number
  }>
}

export type FilterOptions = {
  venues: Venue[]
  formats: Format[]
  languages: Language[]
  timeBands: Array<{ id: string; label: string }>
  sorts: Array<{ id: string; label: string }>
  ticketTypes: TicketType[]
  ageRatings: AgeRating[]
  maxSeatsPerOrder: number
  holdMinutes: number
}

export type SessionGroup = {
  movie: Movie
  sessions: Session[]
}

export type VenueSessionGroup = {
  venue: Venue
  sessions: Session[]
}

export type SessionsMeta = {
  currentPage: number
  lastPage: number
  perPage: number
  totalSessions: number
  totalMovies: number
  date: string
}
