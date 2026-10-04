import axios, { type AxiosError } from 'axios'

export type ParsedApiError = {
  status: number
  message: string
  errors?: Record<string, string[]>
  contested?: string[]
}

export function parseApiError(error: unknown): ParsedApiError {
  if (isParsed(error)) return error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]>; contested?: string[] }>
    const status = axiosError.response?.status ?? 0
    const data = axiosError.response?.data
    return {
      status,
      message: data?.message ?? (status === 0 ? 'Network error. Check your connection and retry.' : 'Something went wrong.'),
      errors: data?.errors,
      contested: data?.contested,
    }
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message }
  }
  return { status: 0, message: 'Something went wrong.' }
}

function isParsed(error: unknown): error is ParsedApiError {
  return Boolean(error && typeof error === 'object' && 'status' in error && 'message' in error)
}

export function isFieldValidation(error: ParsedApiError) {
  return error.status === 422 && Boolean(error.errors && Object.keys(error.errors).length)
}

export function statusLabel(status: number) {
  if (status === 0) return 'Network error'
  if (status === 401) return 'Sign in required'
  if (status === 403) return 'Not allowed'
  if (status === 404) return 'Not found'
  if (status === 409) return 'Seats no longer available'
  if (status === 422) return 'Could not continue'
  if (status >= 500) return 'Server error'
  return 'Error'
}
