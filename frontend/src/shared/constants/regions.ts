export const POLISH_REGIONS = [
  { value: 'dolnośląskie', label: 'Dolnośląskie' },
  { value: 'kujawsko-pomorskie', label: 'Kujawsko-Pomorskie' },
  { value: 'lubelskie', label: 'Lubelskie' },
  { value: 'lubuskie', label: 'Lubuskie' },
  { value: 'łódzkie', label: 'Łódzkie' },
  { value: 'małopolskie', label: 'Małopolskie' },
  { value: 'mazowieckie', label: 'Mazowieckie' },
  { value: 'opolskie', label: 'Opolskie' },
  { value: 'podkarpackie', label: 'Podkarpackie' },
  { value: 'podlaskie', label: 'Podlaskie' },
  { value: 'pomorskie', label: 'Pomorskie' },
  { value: 'śląskie', label: 'Śląskie' },
  { value: 'świętokrzyskie', label: 'Świętokrzyskie' },
  { value: 'warmińsko-mazurskie', label: 'Warmińsko-Mazurskie' },
  { value: 'wielkopolskie', label: 'Wielkopolskie' },
  { value: 'zachodniopomorskie', label: 'Zachodniopomorskie' },
] as const

export type PolishRegion = typeof POLISH_REGIONS[number]['value']

