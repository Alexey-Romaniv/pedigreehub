import type { Listing, PopulatedBreed, ListingBreederPreview } from '../types'

/** Название породы независимо от того, populate-нуто поле или нет */
export const getBreedName = (breed: Listing['breed']): string => {
  if (typeof breed === 'string') return ''
  return (breed as PopulatedBreed)?.name || ''
}

/** Populate-нутый заводчик или null, если бэкенд вернул только ID */
export const getListingBreeder = (
  breederId: Listing['breederId']
): ListingBreederPreview | null => {
  if (!breederId || typeof breederId === 'string') return null
  return breederId
}

export const formatPrice = (price: number, currency: string = 'PLN'): string =>
  `${price.toLocaleString('pl-PL')} ${currency}`

/** Возраст щенка по-польски: недели до 3 месяцев, дальше месяцы */
export const formatAge = (birthDate: string): string => {
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return ''

  const days = Math.max(0, Math.floor((Date.now() - birth.getTime()) / 86_400_000))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30.44)

  if (months >= 12) {
    const years = Math.floor(months / 12)
    if (years === 1) return '1 rok'
    if (years >= 2 && years <= 4) return `${years} lata`
    return `${years} lat`
  }
  if (months >= 3) {
    return months >= 5 ? `${months} miesięcy` : `${months} miesiące`
  }
  if (weeks <= 1) return '1 tydzień'
  if (weeks >= 2 && weeks <= 4) return `${weeks} tygodnie`
  return `${weeks} tygodni`
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Микрочип частично замаскирован: 4 первые + 3 последние цифры */
export const maskMicrochip = (microchip: string): string => {
  if (!microchip || microchip.length < 8) return microchip
  return `${microchip.slice(0, 4)}${'•'.repeat(microchip.length - 7)}${microchip.slice(-3)}`
}

export const genderLabel = (gender: 'male' | 'female'): string =>
  gender === 'male' ? 'Samiec' : 'Samica'
