import mongoose, { Document, Schema, Types } from 'mongoose'

export type InquiryStatus = 'new' | 'read' | 'in_progress' | 'closed' | 'purchase_confirmed'

export interface IInquiryMessage {
  senderId: Types.ObjectId
  text: string
  createdAt: Date
}

export interface IInquiry extends Document {
  listingId: Types.ObjectId
  buyerId: Types.ObjectId
  breederId: Types.ObjectId
  messages: IInquiryMessage[]
  status: InquiryStatus
  contactPhone?: string
  // Счётчики непрочитанных сообщений для каждой стороны
  buyerUnreadCount: number
  breederUnreadCount: number
  lastMessageAt: Date
  purchaseConfirmedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IInquiryMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
)

const inquirySchema = new Schema<IInquiry>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    breederId: {
      type: Schema.Types.ObjectId,
      ref: 'Breeder',
      required: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in_progress', 'closed', 'purchase_confirmed'],
      default: 'new',
    },
    contactPhone: String,
    buyerUnreadCount: {
      type: Number,
      default: 0,
    },
    breederUnreadCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    purchaseConfirmedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes
inquirySchema.index({ buyerId: 1, lastMessageAt: -1 })
inquirySchema.index({ breederId: 1, lastMessageAt: -1 })
// Один активный запрос на пару покупатель↔объявление — защита от гонки параллельных POST
inquirySchema.index(
  { listingId: 1, buyerId: 1 },
  {
    name: 'uniq_active_inquiry_per_pair',
    unique: true,
    partialFilterExpression: { status: { $in: ['new', 'read', 'in_progress', 'purchase_confirmed'] } },
  }
)

export const Inquiry = mongoose.model<IInquiry>('Inquiry', inquirySchema)
