import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import bookingReducer from '@/features/booking/bookingSlice'

export const rootReducer = combineReducers({
  auth: authReducer,
  booking: bookingReducer,
})

export type RootState = ReturnType<typeof rootReducer>
