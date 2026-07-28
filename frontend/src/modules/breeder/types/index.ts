export type VerificationLevel = 'new' | 'verified' | 'trusted' | 'professional'

export type BadgeType = 
  | 'email_verified'
  | 'zkwp_verified'
  | 'identity_verified'
  | 'nip_verified'
  | 'awards_verified'
  | 'kennel_photos'
  | 'breeding_dogs_verified'

export type ListingStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'reserved' | 'archived'

export interface ListingPreview {
  _id: string
  title: string
  breedName: string
  photo: string
  status: ListingStatus
  price: number
  currency: 'PLN' | 'EUR'
  viewsCount: number
  inquiriesCount: number
  createdAt: string
}

export interface DashboardStats {
  views: number
  inquiries: number
  favorites: number
  activeListings: number
}

// Ответ GET /breeders/me/stats
export interface BreederStatsResponse {
  kennel: {
    name: string
    level: VerificationLevel
    status: 'pending' | 'verified' | 'rejected'
    note?: string
  }
  badges: BadgeType[]
  stats: {
    views: number
    inquiries: number
    favorites: number
    activeListings: number
    totalListings: number
    byStatus: Record<string, number>
  }
}

// Публичный профиль заводчика (GET /breeders/:id)
export interface PublicBreederProfile {
  _id: string
  kennelName: string
  region: string
  city: string
  description: string
  website?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
  }
  breedNames: string[]
  verification: {
    status: 'pending' | 'verified' | 'rejected'
    level: VerificationLevel
  }
  badges: BadgeType[]
  kennelPhotos: string[]
  rating: number
  reviewsCount: number
  listingsCount: number
  createdAt: string
}
