import mongoose, { Document, Schema, Types } from 'mongoose'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type VerificationLevel = 'new' | 'verified' | 'trusted' | 'professional'

export type BadgeType = 
  | 'email_verified'        // Email подтверждён
  | 'zkwp_verified'         // ZKwP проверен
  | 'identity_verified'     // Личность подтверждена
  | 'nip_verified'          // NIP проверен через CEIDG
  | 'awards_verified'       // Награды подтверждены
  | 'kennel_photos'         // Фото питомника загружены
  | 'breeding_dogs_verified' // Родословные производителей

export interface IBreedingDog {
  name: string
  pedigreeNumber?: string
  pedigreeDocument?: Types.ObjectId
  verified: boolean
}

export interface IAward {
  title: string
  year?: number
  document?: Types.ObjectId
  verified: boolean
}

export interface IVerification {
  status: VerificationStatus
  level: VerificationLevel
  
  // Email
  emailVerified: boolean
  emailVerifiedAt?: Date
  
  // ZKwP (обязательный)
  zkwpDocument?: Types.ObjectId
  zkwpVerified: boolean
  zkwpVerifiedAt?: Date
  zkwpVerifiedBy?: Types.ObjectId
  zkwpNote?: string
  
  // Личность (опционально)
  identityDocument?: Types.ObjectId
  identityVerified: boolean
  identityVerifiedAt?: Date
  
  // NIP/CEIDG (опционально)
  nip?: string
  nipVerified: boolean
  nipVerifiedAt?: Date
  nipCompanyName?: string
  nipPkd?: string
  
  // Родословные производителей (опционально)
  breedingDogs: IBreedingDog[]
  
  // Дипломы/награды (опционально)
  awards: IAward[]
}

export interface IBreeder extends Document {
  userId: Types.ObjectId
  kennelName: string
  kennelRegistration: string   // Номер ZKwP/FCI
  region: string
  city: string
  address?: string
  description: string
  website?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
  }
  breeds: Types.ObjectId[]
  breedNames: string[]  // Временное поле для названий пород
  
  // Расширенная верификация
  verification: IVerification
  
  // Фото питомника
  kennelPhotos: string[]
  
  // Бейджи (считаются автоматически)
  badges: BadgeType[]
  
  // Статистика
  rating: number
  reviewsCount: number
  listingsCount: number
  
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  
  // Методы
  calculateBadges(): BadgeType[]
  calculateLevel(): VerificationLevel
}

const breedingDogSchema = new Schema<IBreedingDog>(
  {
    name: { type: String, required: true },
    pedigreeNumber: String,
    pedigreeDocument: { type: Schema.Types.ObjectId, ref: 'Document' },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
)

const awardSchema = new Schema<IAward>(
  {
    title: { type: String, required: true },
    year: Number,
    document: { type: Schema.Types.ObjectId, ref: 'Document' },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
)

const verificationSchema = new Schema<IVerification>(
  {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    level: {
      type: String,
      enum: ['new', 'verified', 'trusted', 'professional'],
      default: 'new',
    },
    
    // Email
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    
    // ZKwP
    zkwpDocument: { type: Schema.Types.ObjectId, ref: 'Document' },
    zkwpVerified: { type: Boolean, default: false },
    zkwpVerifiedAt: Date,
    zkwpVerifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    zkwpNote: String,
    
    // Identity
    identityDocument: { type: Schema.Types.ObjectId, ref: 'Document' },
    identityVerified: { type: Boolean, default: false },
    identityVerifiedAt: Date,
    
    // NIP
    nip: String,
    nipVerified: { type: Boolean, default: false },
    nipVerifiedAt: Date,
    nipCompanyName: String,
    nipPkd: String,
    
    // Breeding dogs
    breedingDogs: [breedingDogSchema],
    
    // Awards
    awards: [awardSchema],
  },
  { _id: false }
)

const breederSchema = new Schema<IBreeder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    kennelName: {
      type: String,
      required: true,
      trim: true,
    },
    kennelRegistration: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: String,
    description: {
      type: String,
      required: true,
    },
    website: String,
    socialLinks: {
      facebook: String,
      instagram: String,
    },
    breeds: [{
      type: Schema.Types.ObjectId,
      ref: 'Breed',
    }],
    breedNames: [String],
    
    verification: {
      type: verificationSchema,
      default: () => ({}),
    },
    
    kennelPhotos: [String],
    
    badges: [{
      type: String,
      enum: [
        'email_verified',
        'zkwp_verified',
        'identity_verified',
        'nip_verified',
        'awards_verified',
        'kennel_photos',
        'breeding_dogs_verified'
      ],
    }],
    
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    listingsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

// Метод расчёта бейджей
breederSchema.methods.calculateBadges = function(): BadgeType[] {
  const badges: BadgeType[] = []
  const v = this.verification
  
  if (v.emailVerified) badges.push('email_verified')
  if (v.zkwpVerified) badges.push('zkwp_verified')
  if (v.identityVerified) badges.push('identity_verified')
  if (v.nipVerified) badges.push('nip_verified')
  if (v.awards?.some((a: IAward) => a.verified)) badges.push('awards_verified')
  if (this.kennelPhotos?.length >= 3) badges.push('kennel_photos')
  if (v.breedingDogs?.some((d: IBreedingDog) => d.verified)) badges.push('breeding_dogs_verified')
  
  return badges
}

// Метод расчёта уровня верификации
breederSchema.methods.calculateLevel = function(): VerificationLevel {
  const badgeCount = this.badges?.length || 0
  
  if (badgeCount >= 6) return 'professional'
  if (badgeCount >= 4) return 'trusted'
  if (badgeCount >= 2) return 'verified'
  return 'new'
}

// Middleware: пересчёт бейджей и уровня перед сохранением
breederSchema.pre('save', function(next) {
  this.badges = this.calculateBadges()
  this.verification.level = this.calculateLevel()
  next()
})

// Индексы
breederSchema.index({ userId: 1 })
breederSchema.index({ kennelName: 'text', description: 'text' })
breederSchema.index({ region: 1 })
breederSchema.index({ 'verification.status': 1 })
breederSchema.index({ 'verification.level': 1 })
breederSchema.index({ breeds: 1 })
breederSchema.index({ rating: -1 })
breederSchema.index({ badges: 1 })

export const Breeder = mongoose.model<IBreeder>('Breeder', breederSchema)
