import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IReview extends Document {
  breederId: Types.ObjectId
  buyerId: Types.ObjectId
  // Inquiry с подтверждённой покупкой, на основании которого оставлен отзыв
  inquiryId: Types.ObjectId
  rating: number
  text: string
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    breederId: {
      type: Schema.Types.ObjectId,
      ref: 'Breeder',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inquiryId: {
      type: Schema.Types.ObjectId,
      ref: 'Inquiry',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
)

// Один отзыв на пару покупатель↔заводчик (защита от гонки параллельных POST)
reviewSchema.index({ breederId: 1, buyerId: 1 }, { unique: true })
// Список отзывов заводчика — свежие сверху
reviewSchema.index({ breederId: 1, createdAt: -1 })

export const Review = mongoose.model<IReview>('Review', reviewSchema)
