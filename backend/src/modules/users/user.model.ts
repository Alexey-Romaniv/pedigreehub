import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: 'user' | 'breeder' | 'admin'
  isVerified: boolean
  isEmailVerified: boolean
  isBlocked: boolean
  avatar?: string
  avatarPublicId?: string
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  passwordResetToken?: string
  passwordResetExpires?: Date
  refreshToken?: string
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'breeder', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    avatar: String,
    // publicId Cloudinary — нужен, чтобы удалить прежний файл при замене аватара
    avatarPublicId: String,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
)

// Индексы
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })

export const User = mongoose.model<IUser>('User', userSchema)

