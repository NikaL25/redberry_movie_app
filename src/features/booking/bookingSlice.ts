import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type {
  Order,
  SeatHold,
} from '@/types/models'

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

type BookingState = {
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

const bookingSlice = createSlice({
  name: 'booking',

  initialState,

  reducers: {
    /**
     * Открытие НОВОГО booking flow.
     *
     * Старый selection/order/contested state
     * не должен переходить в новую сессию.
     *
     * Hold очищается только если он относится
     * к другой сессии.
     */
    openBooking(
      state,
      action: PayloadAction<number>,
    ) {
      const nextSessionId =
        action.payload

      const sameSession =
        state.sessionId === nextSessionId

      state.isOpen = true
      state.sessionId = nextSessionId
      state.step = 'seats'
      state.order = null
      state.banner = null
      state.contested = []

      /**
       * Если открывается другая сессия,
       * старое состояние выбора нельзя переносить.
       */
      if (!sameSession) {
        state.selected = []
        state.hold = null
      }
    },

    /**
     * Полностью закрываем booking.
     *
     * Живой hold также больше не должен оставаться
     * связанным с закрытым booking UI.
     */
    closeBooking(state) {
      state.isOpen = false
      state.sessionId = null
      state.step = 'seats'
      state.selected = []
      state.hold = null
      state.order = null
      state.banner = null
      state.contested = []
    },

    /**
     * Выбор / снятие места.
     */
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

      const existing =
        state.selected.find(
          (seat) =>
            seat.seatId === seatId,
        )

      /**
       * Повторное нажатие снимает выбор.
       */
      if (existing) {
        state.selected =
          state.selected.filter(
            (seat) =>
              seat.seatId !== seatId,
          )

        state.banner = null

        return
      }

      /**
       * Максимальное количество мест
       * контролируется UI.
       */
      if (
        state.selected.length >=
        maxSeats
      ) {
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

    /**
     * Изменение типа билета.
     */
    setTicketType(
      state,
      action: PayloadAction<{
        seatId: number
        ticketType: TicketKind
      }>,
    ) {
      const seat =
        state.selected.find(
          (item) =>
            item.seatId ===
            action.payload.seatId,
        )

      if (!seat) {
        return
      }

      seat.ticketType =
        action.payload.ticketType
    },

    /**
     * Восстановление selection.
     */
    restoreSelection(
      state,
      action: PayloadAction<SelectedSeat[]>,
    ) {
      state.selected =
        action.payload
    },

    /**
     * Conflict при создании hold.
     *
     * Потерянные места удаляются.
     * Остальные остаются выбранными.
     */
    dropContested(
      state,
      action: PayloadAction<string[]>,
    ) {
      state.contested =
        action.payload

      state.selected =
        state.selected.filter(
          (seat) =>
            !action.payload.includes(
              seat.code,
            ),
        )

      if (
        action.payload.length > 0
      ) {
        state.banner =
          `Some of those seats were just taken: ${action.payload.join(', ')}`
      }
    },

    /**
     * Сохраняем серверный hold.
     *
     * Никаких предположений о результате:
     * selection строится непосредственно
     * из ответа API.
     */
    setHold(
      state,
      action: PayloadAction<SeatHold | null>,
    ) {
      const hold =
        action.payload

      state.hold = hold

      if (!hold?.isLive) {
        return
      }

      state.selected =
        hold.seats.map(
          (seat) => ({
            seatId: seat.seatId,
            code: seat.code,

            /**
             * Если API не возвращает отдельный label,
             * используем код места как fallback.
             */
            label: seat.code.replace(
              /^[A-Z]+/,
              '',
            ),

            section: 'Seat',

            ticketType:
              seat.ticketType.slug as TicketKind,
          }),
        )
    },

    /**
     * Переход между шагами.
     */
    setStep(
      state,
      action: PayloadAction<BookingStep>,
    ) {
      state.step =
        action.payload
    },

    /**
     * Сервер подтвердил создание заказа.
     *
     * Hold больше не нужен.
     */
    setOrder(
      state,
      action: PayloadAction<Order>,
    ) {
      state.order =
        action.payload

      state.hold = null
      state.step =
        'confirmation'
    },

    /**
     * Banner.
     */
    setBanner(
      state,
      action: PayloadAction<string | null>,
    ) {
      state.banner =
        action.payload
    },

    /**
     * Hold expired.
     *
     * Серверный hold уже недействителен,
     * поэтому selection очищается.
     */
    expireHold(state) {
      state.hold = null
      state.selected = []
      state.step = 'seats'

      state.banner =
        'Your hold time expired. Please re-select your seats.'
    },

    /**
     * Вернуться на Step 1.
     *
     * Используется после ошибок checkout / expiry.
     */
    resetToSeats(state) {
      state.step = 'seats'
      state.hold = null
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