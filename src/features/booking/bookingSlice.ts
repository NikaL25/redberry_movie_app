import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Order, SeatHold } from '@/types/models'

export const HOLD_STORAGE_KEY = 'kinoxii_hold'

export type BookingStep =
| 'seats'
| 'checkout'
| 'confirmation'

export type TicketKind =
| 'adult'
| 'child'
| 'student'

export type SelectedSeat = {
seatId: number
code: string
label: string
section: string
ticketType: TicketKind
}

export type BookingState = {
isOpen: boolean
sessionId: number | null
step: BookingStep
selected: SelectedSeat[]
hold: SeatHold | null
order: Order | null
banner: string | null
contested: string[]
}

const initialState: BookingState = {
isOpen: false,
sessionId: null,
step: 'seats',
selected: [],
hold: null,
order: null,
banner: null,
contested: [],
}

function persistHold(hold: SeatHold | null) {
if (typeof window === 'undefined') {
return
}

if (hold?.isLive) {
sessionStorage.setItem(
HOLD_STORAGE_KEY,
JSON.stringify({
holdId: hold.holdId,
sessionId: hold.sessionId,
}),
)
return
}

sessionStorage.removeItem(HOLD_STORAGE_KEY)
}

function resetBookingState(state: BookingState) {
state.isOpen = false
state.sessionId = null
state.step = 'seats'
state.selected = []
state.hold = null
state.order = null
state.banner = null
state.contested = []

persistHold(null)
}

const bookingSlice = createSlice({
name: 'booking',

initialState,

reducers: {
openBooking(
state,
action: PayloadAction<number>,
) {
/*
* Opening another session must always start
* from a clean booking state.
*/
state.isOpen = true
state.sessionId = action.payload
state.step = 'seats'
state.selected = []
state.hold = null
state.order = null
state.banner = null
state.contested = []

  /*
   * A hold belongs to a previous booking/session.
   */
  persistHold(null)
},

closeBooking(state) {
  resetBookingState(state)
},

toggleSeat(
  state,
  action: PayloadAction<{
    seatId: number
    code: string
    label: string
    section: string
    maxSeats: number
  }>,
) {
  const {
    seatId,
    code,
    label,
    section,
    maxSeats,
  } = action.payload

  const existing = state.selected.find(
    (seat) => seat.seatId === seatId,
  )

  if (existing) {
    state.selected = state.selected.filter(
      (seat) => seat.seatId !== seatId,
    )
    state.banner = null
    return
  }

  if (state.selected.length >= maxSeats) {
    state.banner =
      `You can select at most ${maxSeats} seats per order.`
    return
  }

  state.banner = null

  state.selected.push({
    seatId,
    code,
    label,
    section,
    ticketType: 'adult',
  })
},

setTicketType(
  state,
  action: PayloadAction<{
    seatId: number
    ticketType: TicketKind
  }>,
) {
  const seat = state.selected.find(
    (item) => item.seatId === action.payload.seatId,
  )

  if (seat) {
    seat.ticketType = action.payload.ticketType
  }
},

restoreSelection(
  state,
  action: PayloadAction<SelectedSeat[]>,
) {
  state.selected = action.payload
},

dropContested(
  state,
  action: PayloadAction<string[]>,
) {
  state.contested = action.payload

  state.selected = state.selected.filter(
    (seat) =>
      !action.payload.includes(seat.code),
  )

  if (action.payload.length > 0) {
    state.banner =
      `Some of those seats were just taken: ${action.payload.join(', ')}`
  }
},

setHold(
  state,
  action: PayloadAction<SeatHold | null>,
) {
  state.hold = action.payload

  persistHold(action.payload)

  if (action.payload?.isLive) {
    state.selected =
      action.payload.seats.map((seat) => ({
        seatId: seat.seatId,
        code: seat.code,
        label: seat.code.replace(
          /^[A-Z]+/,
          '',
        ),
        section: 'Seat',
        ticketType:
          seat.ticketType.slug as TicketKind,
      }))
  }
},

setStep(
  state,
  action: PayloadAction<BookingStep>,
) {
  state.step = action.payload
},

setOrder(
  state,
  action: PayloadAction<Order>,
) {
  state.order = action.payload
  state.hold = null
  state.step = 'confirmation'

  persistHold(null)
},

setBanner(
  state,
  action: PayloadAction<string | null>,
) {
  state.banner = action.payload
},

expireHold(state) {
  state.hold = null
  state.selected = []
  state.step = 'seats'
  state.banner =
    'Your hold time expired. Please re-select your seats.'

  persistHold(null)
},

resetToSeats(state) {
  state.step = 'seats'
  state.hold = null

  persistHold(null)
},


},
})

export const {
openBooking,
closeBooking,
toggleSeat,
setTicketType,
restoreSelection,
dropContested,
setHold,
setStep,
setOrder,
setBanner,
expireHold,
resetToSeats,
} = bookingSlice.actions

export default bookingSlice.reducer