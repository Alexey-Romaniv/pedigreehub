export type DocumentType = 
  | 'zkwp_certificate'
  | 'identity'
  | 'pedigree'
  | 'award'
  | 'kennel_photo'
  | 'puppy_photo'
  | 'vet_passport'
  | 'metric'
  | 'other'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface DocumentUser {
  _id: string
  firstName: string
  lastName: string
  email: string
}

export interface PendingDocument {
  _id: string
  userId: DocumentUser
  type: DocumentType
  fileName: string
  originalName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  status: DocumentStatus
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Listing moderation types
export type ListingStatus = 'pending' | 'active' | 'rejected' | 'all'

export interface BreederInfo {
  _id: string
  kennelName: string
  region: string
  city: string
  userId: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface BreedInfo {
  _id: string
  name: string
  nameEn?: string
}

export interface ListingDocument {
  _id: string
  fileUrl: string
  originalName: string
  mimeType: string
  fileSize?: number
  type?: string
}

export interface AdminListing {
  _id: string
  // Бэкенд populate-ит breederId (kennelName + userId) — поэтому объект, а не только id
  breederId: string | BreederInfo
  breed: string | BreedInfo
  title: string
  description: string
  price: number
  currency: 'PLN' | 'EUR'
  puppyName?: string
  birthDate: string
  gender: 'male' | 'female'
  color: string
  microchipNumber: string
  hasPedigree: boolean
  pedigreeDocument?: string | ListingDocument
  hasVetPassport: boolean
  vetPassportDocument?: string | ListingDocument
  hasMetric: boolean
  metricDocument?: string | ListingDocument
  father?: {
    name: string
    pedigreeNumber?: string
    titles?: string[]
    photo?: string
  }
  mother?: {
    name: string
    pedigreeNumber?: string
    titles?: string[]
    photo?: string
  }
  photos: string[]
  videos?: string[]
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'reserved' | 'archived'
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationNote?: string
  createdAt: string
  updatedAt: string
  breeder?: BreederInfo | string
  autoChecks?: {
    microchipFormatValid?: boolean
    pedigreeFormatValid?: boolean
    documentsUploaded?: boolean
    dataConsistency?: boolean
    zkwpChip?: {
      status: 'found' | 'not_found' | 'unavailable'
      dogName?: string
      kennelName?: string
      sex?: string
      birthDate?: string
      branch?: string
      rawText?: string
      birthDateMatches?: boolean
      checkedAt: string
      checkedChip: string
    }
  }
}

export interface ListingModerationFilters {
  status?: ListingStatus
  search?: string
  page?: number
  limit?: number
}

// Admin users
export interface AdminUser {
  _id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'user' | 'breeder' | 'admin'
  isEmailVerified: boolean
  isBlocked: boolean
  createdAt: string
  lastLoginAt?: string
  breeder?: {
    id: string
    kennelName: string
    verificationStatus?: string
  }
}

// Полный профиль заводчика для админа (GET /admin/breeders/:id) —
// в отличие от публичного профиля здесь не вырезаны NIP и документ тождества
export interface AdminBreederDocument {
  _id: string
  fileUrl: string
  originalName?: string
  status?: DocumentStatus
  createdAt?: string
}

export interface AdminBreederDetails {
  _id: string
  kennelName: string
  kennelRegistration: string
  region: string
  city: string
  address?: string
  website?: string
  badges: string[]
  listingsCount: number
  createdAt: string
  userId?: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  verification: {
    status: 'pending' | 'verified' | 'rejected'
    level: 'new' | 'verified' | 'trusted' | 'professional'
    emailVerified: boolean
    zkwpVerified: boolean
    zkwpVerifiedAt?: string
    zkwpNote?: string
    zkwpDocument?: AdminBreederDocument
    identityVerified: boolean
    identityVerifiedAt?: string
    identityDocument?: AdminBreederDocument
    nip?: string
    nipVerified: boolean
    nipVerifiedAt?: string
    nipCompanyName?: string
    nipPkd?: string
  }
}

export interface AdminUsersFilters {
  page?: number
  limit?: number
  role?: 'user' | 'breeder' | 'admin'
  search?: string
  isBlocked?: boolean
}

// Admin stats
export interface AdminStats {
  users: {
    total: number
    byRole: { user: number; breeder: number; admin: number }
    blocked: number
    newLast7Days: number
  }
  listings: {
    total: number
    byStatus: Record<string, number>
    publiclyVisible: number
  }
  breeders: {
    pending: number
    verified: number
  }
  moderationQueue: {
    listings: number
    breeders: number
    documents: number
  }
  inquiries: {
    total: number
    purchasesConfirmed: number
  }
  reviews: {
    total: number
    avgRating: number | null
  }
}
