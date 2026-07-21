export type Currency = 'PLN' | 'EUR'

export interface CreateListingFormData {
  // Шаг 1
  title: string
  breed: string
  birthDate: Date | null
  gender: 'male' | 'female' | ''
  color: string
  puppyName?: string
  price: number
  currency?: Currency
  
  // Шаг 2
  father: {
    name: string
    pedigreeNumber?: string
    titles: string[]
    photo?: File
  }
  mother: {
    name: string
    pedigreeNumber?: string
    titles: string[]
    photo?: File
  }
  
  // Шаг 3
  microchipNumber: string
  hasPedigree: boolean
  pedigreeDocument?: File
  hasVetPassport: boolean
  vetPassportDocument?: File
  hasMetric: boolean
  metricDocument?: File
  
  // Шаг 4
  photos: File[]
  videos: string[]
  description: string
}

export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'rejected'
  | 'sold'
  | 'reserved'
  | 'archived'

export type ListingVerificationStatus = 'pending' | 'verified' | 'rejected'

// Порода после populate (GET /listings, /listings/my, /listings/:id)
export interface PopulatedBreed {
  _id: string
  name: string
  nameEn?: string
}

// Заводчик после populate (публичные эндпоинты)
export interface ListingBreederPreview {
  _id: string
  kennelName: string
  verification?: {
    status: ListingVerificationStatus
    level: 'new' | 'verified' | 'trusted' | 'professional'
  }
  rating?: number
  reviewsCount?: number
}

// Документ после populate (GET /listings/:id)
export interface ListingDocumentInfo {
  _id: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  originalName?: string
}

export interface Listing {
  _id: string
  breederId: string | ListingBreederPreview
  breed: string | PopulatedBreed
  title: string
  description?: string // у черновика может отсутствовать
  price: number
  currency: Currency
  puppyName?: string
  birthDate: string
  gender: 'male' | 'female'
  color: string
  microchipNumber?: string // у черновика может отсутствовать
  hasPedigree: boolean
  pedigreeDocument?: string | ListingDocumentInfo
  hasVetPassport: boolean
  vetPassportDocument?: string | ListingDocumentInfo
  hasMetric: boolean
  metricDocument?: string | ListingDocumentInfo
  father: {
    name: string
    pedigreeNumber?: string
    titles: string[]
    photo?: string
  }
  mother: {
    name: string
    pedigreeNumber?: string
    titles: string[]
    photo?: string
  }
  photos: string[]
  videos?: string[]
  status: ListingStatus
  verificationStatus: ListingVerificationStatus
  verificationNote?: string
  viewsCount: number
  inquiriesCount: number
  favoritesCount: number
  location: {
    region: string
    city: string
  }
  publishedAt?: string
  soldAt?: string
  createdAt: string
  updatedAt: string
  /** Mikroczip znaleziony w publicznej bazie ZKwP (производный флаг с бэка) */
  zkwpVerified?: boolean
}

export interface CreateListingResponse {
  success: boolean
  data: Listing
}

export interface PublicListingsParams {
  breed?: string
  breederId?: string
  region?: string
  priceMin?: number
  priceMax?: number
  gender?: 'male' | 'female'
  sort?: 'newest' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}

export interface PublicListingsResponse {
  success: boolean
  data: Listing[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface Breed {
  _id: string
  name: string
  nameEn?: string
}

export interface BreedsResponse {
  success: boolean
  data: Breed[]
}

