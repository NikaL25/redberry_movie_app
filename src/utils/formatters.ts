export function formatGel(value: number) {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, '')
  return `₾${rounded}`
}

export function formatRuntime(minutes: number) {
  return `${minutes} Min`
}

export function formatReleaseDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
}

export function formatInCinemas(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return `IN CINEMAS ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toUpperCase()}`
}

export function weekdayShort(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('en-GB', { weekday: 'short' })
}

export function dayNumber(iso: string) {
  return new Date(`${iso}T00:00:00`).getDate()
}

export function toIsoDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nextDays(count: number, from = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(from)
    date.setDate(from.getDate() + i)
    return toIsoDate(date)
  })
}

export function formatHoldClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatPaidAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function formatMobileDisplay(value: string) {
  const digits = digitsOnly(value).slice(0, 9)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

export function formatCardNumber(value: string) {
  return digitsOnly(value)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}
