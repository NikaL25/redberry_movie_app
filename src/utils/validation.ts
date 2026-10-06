import { digitsOnly } from './formatters'

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function validateAvatar(file: File | null) {
  if (!file) return null

  if (!AVATAR_TYPES.includes(file.type)) {
    return 'Please upload a jpg, png or WebP image.'
  }

  return null
}

export function validateLogin(values: {
  email: string
  password: string
}) {
  const errors: Record<string, string> = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isEmail(values.email)) {
    errors.email = 'Enter a valid email'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 3) {
    errors.password = 'Password must be at least 3 characters'
  }

  return errors
}

export function validateRegister(values: {
  username: string
  email: string
  password: string
  passwordConfirmation: string
  avatar?: File | null
}) {
  const errors: Record<string, string> = {}

  if (!values.username.trim()) {
    errors.username = 'Username is required'
  } else if (values.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isEmail(values.email)) {
    errors.email = 'Enter a valid email'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 3) {
    errors.password = 'Password must be at least 3 characters'
  }

  if (!values.passwordConfirmation) {
    errors.password_confirmation = 'Confirm password is required'
  } else if (values.password !== values.passwordConfirmation) {
    errors.password_confirmation = 'Passwords do not match'
  }

  const avatarError = validateAvatar(values.avatar ?? null)

  if (avatarError) {
    errors.avatar = avatarError
  }

  return errors
}

export function validateProfile(values: {
  fullName: string
  mobileNumber: string
  dateOfBirth: string
}) {
  const errors: Record<string, string> = {}

  const name = values.fullName.trim()

  if (!name) {
    errors.fullName = 'Name is required'
  } else if (name.length < 3) {
    errors.fullName = 'Name must be at least 3 characters'
  } else if (name.length > 50) {
    errors.fullName = 'Name must not exceed 50 characters'
  }

  const rawMobile = values.mobileNumber.trim()
  const mobile = digitsOnly(values.mobileNumber)

  if (!rawMobile) {
    errors.mobileNumber = 'Mobile number is required'
  } else if (/[^\d\s]/.test(rawMobile)) {
    errors.mobileNumber =
      'Please enter a valid Georgian mobile number (9 digits starting with 5)'
  } else if (mobile.length === 9 && !mobile.startsWith('5')) {
    errors.mobileNumber = 'Georgian mobile numbers must start with 5'
  } else if (mobile.length !== 9) {
    errors.mobileNumber = 'Mobile number must be exactly 9 digits'
  } else if (!/^5\d{8}$/.test(mobile)) {
    errors.mobileNumber =
      'Please enter a valid Georgian mobile number (9 digits starting with 5)'
  }

  if (!values.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required'
  } else {
    const birth = new Date(`${values.dateOfBirth}T00:00:00`)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (Number.isNaN(birth.getTime()) || birth > today) {
      errors.dateOfBirth = 'Please enter a valid date of birth'
    } else {
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 12)
      cutoff.setHours(0, 0, 0, 0)

      if (birth > cutoff) {
        errors.dateOfBirth =
          'You must be at least 12 years old to create an account'
      }
    }
  }

  return errors
}

export function isExpiryFuture(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const month = Number(match[1])
  const year = 2000 + Number(match[2])

  const now = new Date()
  const expiryEnd = new Date(year, month, 0, 23, 59, 59)

  return expiryEnd >= now
}

export function validateCheckout(values: {
  fullName: string
  email: string
  mobileNumber: string
  cardNumber: string
  expiry: string
  cvv: string
}) {
  const errors: Record<string, string> = {}

  const name = values.fullName.trim()

  if (!name) {
    errors.fullName = 'Full name is required'
  } else if (name.length < 3) {
    errors.fullName = 'Full name must be at least 3 characters'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isEmail(values.email)) {
    errors.email = 'Enter a valid email'
  }

  const mobile = digitsOnly(values.mobileNumber)

  if (!mobile) {
    errors.mobileNumber = 'Mobile number is required'
  } else if (!/^5\d{8}$/.test(mobile)) {
    errors.mobileNumber =
      'Please enter a valid Georgian mobile number (9 digits starting with 5)'
  }

  const cardNumber = digitsOnly(values.cardNumber)

  if (!cardNumber) {
    errors.cardNumber = 'Card number is required'
  } else if (cardNumber.length !== 16) {
    errors.cardNumber = 'Card number must be 16 digits'
  }

  if (!values.expiry) {
    errors.expiry = 'Expiry is required'
  } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry)) {
    errors.expiry = 'Expiry must be MM/YY'
  } else if (!isExpiryFuture(values.expiry)) {
    errors.expiry = 'Expiry date must be in the future'
  }

  if (!values.cvv) {
    errors.cvv = 'CVV is required'
  } else if (!/^\d{3}$/.test(values.cvv)) {
    errors.cvv = 'CVV must be 3 digits'
  }

  return errors
}

export function firstFieldError(errors?: Record<string, string[]>) {
  if (!errors) {
    return null
  }

  const first = Object.values(errors)[0]

  return first?.[0] ?? null
}

export function flattenErrors(errors?: Record<string, string[]>) {
  if (!errors) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, value[0]]),
  )
}
