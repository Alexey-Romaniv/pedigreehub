import mongoose, { Document, Schema, Types } from 'mongoose'

export type DocumentType = 
  | 'zkwp_certificate'      // Свидетельство ZKwP (обязательный)
  | 'identity'              // Документ личности
  | 'pedigree'              // Родословная собаки
  | 'award'                 // Диплом/награда
  | 'kennel_photo'          // Фото питомника
  | 'puppy_photo'           // Фото щенка
  | 'vet_passport'          // Ветпаспорт
  | 'metric'                // Метрика щенка
  | 'other'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface IDocument extends Document {
  userId: Types.ObjectId
  type: DocumentType
  fileName: string
  originalName: string
  fileUrl: string
  publicId: string           // Cloudinary public_id для удаления
  fileSize: number
  mimeType: string
  status: DocumentStatus
  rejectionReason?: string
  verifiedBy?: Types.ObjectId
  verifiedAt?: Date
  metadata?: {
    width?: number
    height?: number
    format?: string
  }
  createdAt: Date
  updatedAt: Date
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'zkwp_certificate',
        'identity',
        'pedigree',
        'award',
        'kennel_photo',
        'puppy_photo',
        'vet_passport',
        'metric',
        'other'
      ],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    metadata: {
      width: Number,
      height: Number,
      format: String,
    },
  },
  {
    timestamps: true,
  }
)

// Индексы
documentSchema.index({ userId: 1 })
documentSchema.index({ type: 1 })
documentSchema.index({ status: 1 })
documentSchema.index({ createdAt: -1 })

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema)

