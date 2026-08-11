import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IFavorite extends Document {
  userId: Types.ObjectId
  listingId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Одно избранное на пару пользователь↔объявление (гонки ловит индекс)
favoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true })
// Список избранного пользователя — свежие сверху
favoriteSchema.index({ userId: 1, createdAt: -1 })

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema)
