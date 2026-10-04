import type { AgeRating, User } from '@/types/models'

export function ageGateMessage(user: User | null | undefined, rating: AgeRating): string | null {
  if (!user?.age || (rating.code !== '16+' && rating.code !== '18+')) return null
  if (user.age >= rating.minAge) return null
  return `This film is rated ${rating.code}. You cannot buy tickets for it with this account.`
}

export function isAgeBlocked(user: User | null | undefined, rating: AgeRating) {
  return Boolean(ageGateMessage(user, rating))
}
