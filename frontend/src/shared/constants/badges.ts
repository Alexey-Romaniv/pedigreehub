export const BREEDER_BADGES = [
  {
    id: 'zkwp_verified',
    icon: '✓',
    label: 'Hodowla ZKwP',
    description: 'Certyfikat ZKwP zweryfikowany',
    color: 'green',
  },
  {
    id: 'identity_verified',
    icon: '⭐',
    label: 'Tożsamość potwierdzona',
    description: 'Dokument tożsamości przesłany',
    color: 'purple',
  },
  {
    id: 'nip_verified',
    icon: '💼',
    label: 'Legalna działalność',
    description: 'NIP zweryfikowany w Białej Liście VAT',
    color: 'blue',
  },
  {
    id: 'kennel_photos',
    icon: '📸',
    label: 'Zdjęcia hodowli',
    description: 'Minimum 3 zdjęcia hodowli',
    color: 'teal',
  },
  {
    id: 'awards_verified',
    icon: '🏆',
    label: 'Nagradzana hodowla',
    description: 'Dyplomy i nagrody',
    color: 'yellow',
  },
  {
    id: 'breeding_dogs_verified',
    icon: '🐕',
    label: 'Potwierdzona hodowla',
    description: 'Rodowody reproduktorów',
    color: 'orange',
  },
] as const

export type BadgeId = typeof BREEDER_BADGES[number]['id']
