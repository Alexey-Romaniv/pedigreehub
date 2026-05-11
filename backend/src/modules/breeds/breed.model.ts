import mongoose, { Document, Schema } from 'mongoose'

export type SizeCategory = 'small' | 'medium' | 'large' | 'giant'

export interface IBreed extends Document {
  name: string                    // Название на польском
  nameEn: string                  // Название на английском
  nameRu?: string                 // Название на русском
  fciGroup: number                // Группа FCI (1-10)
  fciSection?: number             // Секция
  fciNumber?: number              // Номер стандарта FCI
  description?: string
  sizeCategory: SizeCategory
  averageLifespan?: string
  photo?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const breedSchema = new Schema<IBreed>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    nameRu: {
      type: String,
      trim: true,
    },
    fciGroup: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    fciSection: Number,
    fciNumber: Number,
    description: String,
    sizeCategory: {
      type: String,
      enum: ['small', 'medium', 'large', 'giant'],
      required: true,
    },
    averageLifespan: String,
    photo: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Индексы
breedSchema.index({ name: 'text', nameEn: 'text' })
breedSchema.index({ fciGroup: 1 })
breedSchema.index({ isActive: 1 })

export const Breed = mongoose.model<IBreed>('Breed', breedSchema)

