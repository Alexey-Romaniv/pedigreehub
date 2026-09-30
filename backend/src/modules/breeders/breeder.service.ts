import { Types } from 'mongoose'
import { Breeder, IBreeder, VerificationStatus } from './breeder.model'
import { Listing } from '../listings/listing.model'
import { DocumentModel } from '../documents/document.model'
import { User } from '../users/user.model'
import { nipService } from '../../services/nip.service'
import { AppError } from '../../middleware/error.middleware'

interface CreateBreederParams {
  userId: Types.ObjectId
  kennelName: string
  kennelRegistration: string
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
}

interface UpdateBreederParams {
  kennelName?: string
  region?: string
  city?: string
  address?: string
  description?: string
  website?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
  }
  breeds?: Types.ObjectId[]
}

interface VerifyBreederParams {
  breederId: Types.ObjectId
  status: VerificationStatus
  adminId: Types.ObjectId
  note?: string
}

class BreederService {
  /**
   * Создание профиля заводчика
   */
  async create(params: CreateBreederParams): Promise<IBreeder> {
    // Проверяем, не является ли пользователь уже заводчиком
    const existing = await Breeder.findOne({ userId: params.userId })
    if (existing) {
      throw new AppError('Masz już profil hodowcy', 400)
    }

    const breeder = await Breeder.create({
      ...params,
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

    // Обновление роли пользователя
    await User.findByIdAndUpdate(params.userId, { role: 'breeder' })

    return breeder
  }

  /**
   * Получение заводчика по ID
   */
  async getById(breederId: Types.ObjectId): Promise<IBreeder | null> {
    return Breeder.findById(breederId)
      .populate('verification.zkwpDocument')
  }

  /**
   * Получение заводчика по userId
   */
  async getByUserId(userId: Types.ObjectId): Promise<IBreeder | null> {
    return Breeder.findOne({ userId })
  }

  /**
   * Полный профиль для админ-панели — без вырезания приватных полей
   * (NIP, документ личности), с подтянутыми документами и владельцем
   */
  async getByIdForAdmin(breederId: Types.ObjectId): Promise<IBreeder | null> {
    return Breeder.findById(breederId)
      .populate('userId', 'firstName lastName email phone isBlocked')
      .populate('verification.zkwpDocument')
      .populate('verification.identityDocument')
      .populate('verification.breedingDogs.pedigreeDocument')
      .populate('verification.awards.document')
  }

  /**
   * Статистика заводчика для дашборда — агрегация по объявлениям
   */
  async getMyStats(breeder: IBreeder): Promise<{
    kennel: { name: string; level: string; status: VerificationStatus; note?: string }
    badges: string[]
    stats: {
      views: number
      inquiries: number
      favorites: number
      activeListings: number
      totalListings: number
      byStatus: Record<string, number>
    }
  }> {
    const rows = await Listing.aggregate<{
      _id: string
      count: number
      views: number
      inquiries: number
      favorites: number
    }>([
      { $match: { breederId: breeder._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          views: { $sum: '$viewsCount' },
          inquiries: { $sum: '$inquiriesCount' },
          favorites: { $sum: '$favoritesCount' },
        },
      },
    ])

    const byStatus: Record<string, number> = {}
    let views = 0
    let inquiries = 0
    let favorites = 0
    let totalListings = 0

    for (const row of rows) {
      byStatus[row._id] = row.count
      totalListings += row.count
      views += row.views
      inquiries += row.inquiries
      favorites += row.favorites
    }

    return {
      kennel: {
        name: breeder.kennelName,
        level: breeder.verification.level,
        status: breeder.verification.status,
        // Причина отказа — только при rejected (админская заметка по ZKwP)
        ...(breeder.verification.status === 'rejected' && breeder.verification.zkwpNote
          ? { note: breeder.verification.zkwpNote }
          : {}),
      },
      badges: breeder.badges,
      stats: {
        views,
        inquiries,
        favorites,
        activeListings: byStatus.active || 0,
        totalListings,
        byStatus,
      },
    }
  }

  /**
   * Обновление профиля заводчика
   */
  async update(breederId: Types.ObjectId, params: UpdateBreederParams): Promise<IBreeder> {
    const breeder = await Breeder.findByIdAndUpdate(
      breederId,
      { $set: params },
      { new: true, runValidators: true }
    )

    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    return breeder
  }

  /**
   * Загрузка документа ZKwP
   */
  async uploadZkwpDocument(breederId: Types.ObjectId, documentId: Types.ObjectId): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.verification.zkwpDocument = documentId
    await breeder.save()

    return breeder
  }

  /**
   * Загрузка документа, подтверждающего личность
   */
  async uploadIdentityDocument(breederId: Types.ObjectId, documentId: Types.ObjectId): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.verification.identityDocument = documentId
    await breeder.save()

    return breeder
  }

  /**
   * Проверка NIP через Białą Listę VAT (API Ministerstwa Finansów)
   */
  async verifyNIP(breederId: Types.ObjectId, nip: string): Promise<{
    verified: boolean
    companyName?: string
    error?: string
  }> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    const result = await nipService.verifyNIP(nip)

    if (result.verified) {
      breeder.verification.nip = nip
      breeder.verification.nipVerified = true
      breeder.verification.nipVerifiedAt = new Date()
      breeder.verification.nipCompanyName = result.companyName
      await breeder.save()
    }

    return {
      verified: result.verified,
      companyName: result.companyName,
      error: result.error,
    }
  }

  /**
   * Добавление фото питомника
   */
  async addKennelPhoto(breederId: Types.ObjectId, photoUrl: string): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.kennelPhotos.push(photoUrl)
    await breeder.save()

    return breeder
  }

  /**
   * Удаление фото питомника
   */
  async removeKennelPhoto(breederId: Types.ObjectId, photoUrl: string): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.kennelPhotos = breeder.kennelPhotos.filter(url => url !== photoUrl)
    await breeder.save()

    return breeder
  }

  /**
   * Добавление производителя
   */
  async addBreedingDog(
    breederId: Types.ObjectId,
    name: string,
    pedigreeNumber?: string,
    pedigreeDocument?: Types.ObjectId
  ): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.verification.breedingDogs.push({
      name,
      pedigreeNumber,
      pedigreeDocument,
      verified: false,
    })
    await breeder.save()

    return breeder
  }

  /**
   * Добавление награды
   */
  async addAward(
    breederId: Types.ObjectId,
    title: string,
    year?: number,
    document?: Types.ObjectId
  ): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.verification.awards.push({
      title,
      year,
      document,
      verified: false,
    })
    await breeder.save()

    return breeder
  }

  /**
   * Отметка email как подтверждённого
   */
  async markEmailVerified(breederId: Types.ObjectId): Promise<void> {
    await Breeder.findByIdAndUpdate(breederId, {
      'verification.emailVerified': true,
      'verification.emailVerifiedAt': new Date(),
    })
  }

  // ADMIN-методы

  /**
   * Верификация заводчика (одобрение/отклонение ZKwP)
   */
  async verifyBreeder(params: VerifyBreederParams): Promise<IBreeder> {
    const { breederId, status, adminId, note } = params

    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.verification.status = status
    breeder.verification.zkwpVerifiedBy = adminId

    if (status === 'verified') {
      breeder.verification.zkwpVerified = true
      breeder.verification.zkwpVerifiedAt = new Date()
      
      // Обновление статуса документа
      if (breeder.verification.zkwpDocument) {
        await DocumentModel.findByIdAndUpdate(breeder.verification.zkwpDocument, {
          status: 'approved',
          verifiedBy: adminId,
          verifiedAt: new Date(),
        })
      }
    } else if (status === 'rejected') {
      breeder.verification.zkwpNote = note
      
      // Обновление статуса документа
      if (breeder.verification.zkwpDocument) {
        await DocumentModel.findByIdAndUpdate(breeder.verification.zkwpDocument, {
          status: 'rejected',
          verifiedBy: adminId,
          verifiedAt: new Date(),
          rejectionReason: note,
        })
      }
    }

    await breeder.save()
    return breeder
  }

  /**
   * Верификация документа, подтверждающего личность
   */
  async verifyIdentity(breederId: Types.ObjectId, adminId: Types.ObjectId): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    breeder.verification.identityVerified = true
    breeder.verification.identityVerifiedAt = new Date()

    if (breeder.verification.identityDocument) {
      await DocumentModel.findByIdAndUpdate(breeder.verification.identityDocument, {
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: new Date(),
      })
    }

    await breeder.save()
    return breeder
  }

  /**
   * Верификация производителя
   */
  async verifyBreedingDog(breederId: Types.ObjectId, dogIndex: number): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    if (breeder.verification.breedingDogs[dogIndex]) {
      breeder.verification.breedingDogs[dogIndex].verified = true
    }

    await breeder.save()
    return breeder
  }

  /**
   * Верификация награды
   */
  async verifyAward(breederId: Types.ObjectId, awardIndex: number): Promise<IBreeder> {
    const breeder = await Breeder.findById(breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie znaleziony', 404)
    }

    if (breeder.verification.awards[awardIndex]) {
      breeder.verification.awards[awardIndex].verified = true
    }

    await breeder.save()
    return breeder
  }

  /**
   * Получение заводчиков, ожидающих верификации
   */
  async getPendingVerification(page = 1, limit = 20): Promise<{
    breeders: IBreeder[]
    total: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const [breeders, total] = await Promise.all([
      Breeder.find({ 'verification.status': 'pending' })
        .populate('userId', 'firstName lastName email phone')
        .populate('verification.zkwpDocument')
        .populate('verification.identityDocument')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Breeder.countDocuments({ 'verification.status': 'pending' }),
    ])

    return {
      breeders,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  /**
   * Публичный список заводчиков (только верифицированные)
   */
  async getPublicList(params: {
    page?: number
    limit?: number
    region?: string
    breed?: Types.ObjectId
    search?: string
  }): Promise<{
    breeders: IBreeder[]
    total: number
    pages: number
  }> {
    const { page = 1, limit = 20, region, breed, search } = params
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = {
      'verification.status': 'verified',
      isActive: true,
    }

    if (region) query.region = region
    if (breed) query.breeds = breed
    if (search) {
      query.$text = { $search: search }
    }

    const [breeders, total] = await Promise.all([
      Breeder.find(query)
        .select('-verification.identityDocument -verification.nip')
        .sort({ rating: -1, reviewsCount: -1 })
        .skip(skip)
        .limit(limit),
      Breeder.countDocuments(query),
    ])

    return {
      breeders,
      total,
      pages: Math.ceil(total / limit),
    }
  }
}

export const breederService = new BreederService()
