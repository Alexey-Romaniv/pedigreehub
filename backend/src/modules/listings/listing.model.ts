import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IListing extends Document {
  breederId: Types.ObjectId
  breed: Types.ObjectId
  title: string
  description?: string // отсутствует только у черновиков
  price: number
  currency: 'PLN' | 'EUR'
  puppyName?: string
  birthDate: Date
  gender: 'male' | 'female'
  color: string
  microchipNumber?: string // отсутствует только у черновиков
  hasPedigree: boolean
  pedigreeDocument?: Types.ObjectId
  hasVetPassport: boolean
  vetPassportDocument?: Types.ObjectId
  hasMetric: boolean
  metricDocument?: Types.ObjectId
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
  verifiedAt?: Date
  verifiedBy?: Types.ObjectId
  // Автоматические проверки
  autoChecks?: {
    microchipFormatValid: boolean
    pedigreeFormatValid: boolean
    documentsUploaded: boolean
    dataConsistency: boolean
    passedAt: Date
    // Проверка чипа в публичной базе ZKwP (best-effort, см. zkwp.service.ts):
    // found — собака зарегистрирована в ZKwP (сильный позитив),
    // not_found — нейтральный сигнал (щенок мог ещё не попасть в базу),
    // unavailable — база была недоступна, проверить не удалось
    zkwpChip?: {
      status: 'found' | 'not_found' | 'unavailable'
      dogName?: string
      kennelName?: string
      sex?: string
      birthDate?: string
      branch?: string
      rawText?: string
      birthDateMatches?: boolean
      checkedAt: Date
      checkedChip: string
    }
  }
  viewsCount: number
  inquiriesCount: number
  favoritesCount: number
  location: {
    region: string
    city: string
  }
  publishedAt?: Date
  soldAt?: Date
  createdAt: Date
  updatedAt: Date
}

const listingSchema = new Schema<IListing>(
  {
    breederId: {
      type: Schema.Types.ObjectId,
      ref: 'Breeder',
      required: true,
    },
    breed: {
      type: Schema.Types.ObjectId,
      ref: 'Breed',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      // Черновик можно сохранить без описания; обязательно с момента отправки на модерацию
      required: function (this: IListing) {
        return this.status !== 'draft'
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['PLN', 'EUR'],
      default: 'PLN',
    },
    puppyName: String,
    birthDate: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    microchipNumber: {
      type: String,
      // Черновик можно сохранить без чипа; обязателен с момента отправки на модерацию
      required: function (this: IListing) {
        return this.status !== 'draft'
      },
      match: /^\d{15}$/,
      index: { unique: true, sparse: true }, // Уникальность микрочипа
    },
    hasPedigree: {
      type: Boolean,
      default: false,
    },
    pedigreeDocument: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    hasVetPassport: {
      type: Boolean,
      default: false,
    },
    vetPassportDocument: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    hasMetric: {
      type: Boolean,
      default: false,
    },
    metricDocument: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    father: {
      name: String,
      pedigreeNumber: String,
      titles: [String],
      photo: String,
    },
    mother: {
      name: String,
      pedigreeNumber: String,
      titles: [String],
      photo: String,
    },
    photos: {
      type: [String],
      validate: {
        // Черновик может быть без фото; минимум 3 — с момента отправки на модерацию
        validator: function (this: IListing, v: string[]) {
          return this.status === 'draft' || v.length >= 3
        },
        message: 'Wymagane minimum 3 zdjęcia',
      },
    },
    videos: [String],
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'rejected', 'sold', 'reserved', 'archived'],
      default: 'draft',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationNote: String,
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    autoChecks: {
      microchipFormatValid: Boolean,
      pedigreeFormatValid: Boolean,
      documentsUploaded: Boolean,
      dataConsistency: Boolean,
      passedAt: Date,
      zkwpChip: {
        status: { type: String, enum: ['found', 'not_found', 'unavailable'] },
        dogName: String,
        kennelName: String,
        sex: String,
        birthDate: String,
        branch: String,
        rawText: String,
        birthDateMatches: Boolean,
        checkedAt: Date,
        checkedChip: String,
      },
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    inquiriesCount: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    location: {
      region: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
    },
    publishedAt: Date,
    soldAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes
listingSchema.index({ breederId: 1 })
listingSchema.index({ breed: 1 })
listingSchema.index({ status: 1, verificationStatus: 1, publishedAt: -1 })
listingSchema.index({ price: 1 })
listingSchema.index({ birthDate: -1 })
listingSchema.index({ 'location.region': 1 })
listingSchema.index({ gender: 1 })
listingSchema.index({ title: 'text', description: 'text' })

export const Listing = mongoose.model<IListing>('Listing', listingSchema)
