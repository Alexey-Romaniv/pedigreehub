import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { User } from '../users/user.model'
import { Breeder } from '../breeders/breeder.model'
import { Breed } from '../breeds/breed.model'
import { RegisterInput, LoginInput, RegisterBreederInput, ChangePasswordInput } from './auth.validation'
import { AppError } from '../../middleware/error.middleware'
import { emailService } from '../../services/email.service'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

interface TokenPayload {
  userId: string
  role: string
}

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role } as TokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
  const refreshToken = jwt.sign({ userId, role } as TokenPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions)
  return { accessToken, refreshToken }
}

// В базе храним sha256-хеш токена; сырой токен уходит только в письмо
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000 // 1h

export const authService = {
  async checkEmailAvailable(email: string): Promise<boolean> {
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    return !existingUser
  },

  async register(data: RegisterInput) {
    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) {
      throw new AppError('Ten email jest już używany', 409, 'EMAIL_EXISTS')
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const user = await User.create({
      ...data,
      password: hashedPassword,
      role: 'user',
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    })

    await emailService.sendVerificationEmail(user.email, verificationToken)

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  },

  async registerBreeder(data: RegisterBreederInput) {
    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) {
      throw new AppError('Ten email jest już używany', 409, 'EMAIL_EXISTS')
    }

    const existingKennel = await Breeder.findOne({ kennelRegistration: data.kennelRegistration })
    if (existingKennel) {
      throw new AppError('Ten numer ZKwP jest już zarejestrowany', 409, 'KENNEL_EXISTS')
    }

    // Породы приходят как ObjectId из каталога — проверяем существование
    // и сохраняем и ссылки (breeds), и названия (breedNames, для отображения)
    const breedIds = [...new Set(data.breeds)]
    const selectedBreeds = await Breed.find({ _id: { $in: breedIds } }).select('_id name')
    if (selectedBreeds.length !== breedIds.length) {
      throw new AppError('Jedna z wybranych ras nie istnieje w bazie', 400)
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'breeder',
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    })

    const breeder = await Breeder.create({
      userId: user._id,
      kennelName: data.kennelName,
      kennelRegistration: data.kennelRegistration,
      region: data.region,
      city: data.city,
      address: data.address,
      description: data.description,
      website: data.website || undefined,
      socialLinks: data.socialLinks,
      breeds: selectedBreeds.map((b) => b._id),
      breedNames: selectedBreeds.map((b) => b.name),
      verification: {
        status: 'pending',
        level: 'new',
        emailVerified: false,
        zkwpVerified: false,
        identityVerified: false,
        nipVerified: false,
        breedingDogs: [],
        awards: [],
      },
      kennelPhotos: [],
      badges: [],
    })

    await emailService.sendVerificationEmail(user.email, verificationToken)

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      breeder: {
        id: breeder._id.toString(),
        kennelName: breeder.kennelName,
        verificationStatus: breeder.verification.status,
      },
    }
  },

  async login(data: LoginInput) {
    const user = await User.findOne({ email: data.email }).select('+password')
    if (!user) {
      throw new AppError('Nieprawidłowy email lub hasło', 401, 'INVALID_CREDENTIALS')
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    if (!isPasswordValid) {
      throw new AppError('Nieprawidłowy email lub hasło', 401, 'INVALID_CREDENTIALS')
    }

    if (user.isBlocked) {
      throw new AppError('Konto zablokowane', 403, 'ACCOUNT_BLOCKED')
    }

    const tokens = generateTokens(user._id.toString(), user.role)

    user.refreshToken = tokens.refreshToken
    user.lastLoginAt = new Date()
    await user.save()

    let breederInfo = null
    if (user.role === 'breeder') {
      const breeder = await Breeder.findOne({ userId: user._id })
      if (breeder) {
        breederInfo = {
          id: breeder._id.toString(),
          kennelName: breeder.kennelName,
          verificationStatus: breeder.verification.status,
          verificationLevel: breeder.verification.level,
          badges: breeder.badges,
        }
      }
    }

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
      },
      breeder: breederInfo,
    }
  },

  async getUserById(userId: string) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    let breederInfo = null
    if (user.role === 'breeder') {
      const breeder = await Breeder.findOne({ userId: user._id })
      if (breeder) {
        breederInfo = {
          id: breeder._id.toString(),
          kennelName: breeder.kennelName,
          verificationStatus: breeder.verification.status,
          verificationLevel: breeder.verification.level,
          badges: breeder.badges,
        }
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      breeder: breederInfo,
    }
  },

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload
      const user = await User.findById(decoded.userId)
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Nieprawidłowy token', 401, 'INVALID_TOKEN')
      }

      const tokens = generateTokens(user._id.toString(), user.role)
      user.refreshToken = tokens.refreshToken
      await user.save()

      return tokens
    } catch {
      throw new AppError('Nieprawidłowy token', 401, 'INVALID_TOKEN')
    }
  },

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null })
  },

  async verifyEmail(token: string) {
    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    })

    if (!user) {
      throw new AppError('Nieprawidłowy lub wygasły link weryfikacyjny', 400, 'INVALID_VERIFICATION_TOKEN')
    }

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    // Дублируем флаг в профиль заводчика (используется в verification-домене)
    if (user.role === 'breeder') {
      await Breeder.findOneAndUpdate(
        { userId: user._id },
        {
          'verification.emailVerified': true,
          'verification.emailVerifiedAt': new Date(),
        }
      )
    }

    return { email: user.email }
  },

  /**
   * Повторная отправка письма с подтверждением email.
   * Старый токен перезаписывается — активной остаётся только последняя ссылка.
   */
  async resendVerificationEmail(userId: string) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    if (user.isEmailVerified) {
      throw new AppError('Email jest już potwierdzony', 400, 'EMAIL_ALREADY_VERIFIED')
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    user.emailVerificationToken = hashToken(verificationToken)
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
    await user.save()

    await emailService.sendVerificationEmail(user.email, verificationToken)

    return { email: user.email }
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() })

    // Не раскрываем, существует ли email — всегда отвечаем success
    if (!user || user.isBlocked) {
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken = hashToken(resetToken)
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS)
    await user.save()

    await emailService.sendPasswordResetEmail(user.email, resetToken)
  },

  async resetPassword(token: string, password: string) {
    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    })

    if (!user) {
      throw new AppError('Nieprawidłowy lub wygasły link resetowania hasła', 400, 'INVALID_RESET_TOKEN')
    }

    user.password = await bcrypt.hash(password, 12)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.refreshToken = undefined // разлогиниваем все сессии
    await user.save()
  },

  /**
   * Смена пароля из панели пользователя.
   * Старые сессии инвалидируются, вызывающему возвращается свежая пара токенов,
   * чтобы его собственная сессия не оборвалась.
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await User.findById(userId).select('+password')
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password)
    if (!isPasswordValid) {
      throw new AppError('Aktualne hasło jest nieprawidłowe', 400, 'INVALID_CURRENT_PASSWORD')
    }

    const tokens = generateTokens(user._id.toString(), user.role)

    user.password = await bcrypt.hash(data.newPassword, 12)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.refreshToken = tokens.refreshToken
    await user.save()

    return tokens
  },
}
