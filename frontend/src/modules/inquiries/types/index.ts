export type InquiryStatus = 'new' | 'read' | 'in_progress' | 'closed' | 'purchase_confirmed'

export interface InquiryMessage {
  _id: string
  senderId: string
  text: string
  createdAt: string
}

// Объявление после populate в списках и переписке
export interface InquiryListingPreview {
  _id: string
  title: string
  photos: string[]
  price: number
  currency: 'PLN' | 'EUR'
  status: string
  verificationStatus: string
  puppyName?: string
}

// Покупатель после populate (списки заводчика, переписка)
export interface InquiryBuyerPreview {
  _id: string
  firstName: string
  lastName: string
  avatar?: string
}

// Заводчик после populate (списки покупателя, переписка)
export interface InquiryBreederPreview {
  _id: string
  kennelName: string
  city?: string
  region?: string
  verification?: {
    status: 'pending' | 'verified' | 'rejected' | 'in_review'
  }
}

export interface Inquiry {
  _id: string
  listingId: string | InquiryListingPreview
  buyerId: string | InquiryBuyerPreview
  breederId: string | InquiryBreederPreview
  messages: InquiryMessage[]
  status: InquiryStatus
  contactPhone?: string
  buyerUnreadCount: number
  breederUnreadCount: number
  lastMessageAt: string
  purchaseConfirmedAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateInquiryData {
  listingId: string
  message: string
  contactPhone?: string
}

// Роль текущего пользователя в запросе
export type InquiryRole = 'buyer' | 'breeder'
