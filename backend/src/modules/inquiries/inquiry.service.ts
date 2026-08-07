import { Types } from 'mongoose'
import { Inquiry, IInquiry } from './inquiry.model'
import { Listing } from '../listings/listing.model'
import { Breeder } from '../breeders/breeder.model'
import { AppError } from '../../middleware/error.middleware'

interface AuthUser {
  _id: Types.ObjectId
  role: 'user' | 'breeder' | 'admin'
}

interface InquiryAccess {
  inquiry: IInquiry
  isBuyer: boolean
  isBreeder: boolean
  isAdmin: boolean
}

// Поля для populate в списках и треде.
// ВАЖНО: не отдаём приватное — у покупателя только имя/аватар (телефон — лишь осознанно
// оставленный contactPhone), у заводчика — только статус/уровень верификации (без NIP и заметок).
const LISTING_FIELDS = 'title photos price currency status verificationStatus puppyName'
const BUYER_FIELDS = 'firstName lastName avatar'
const BREEDER_FIELDS = 'kennelName city region verification.status verification.level'

const POPULATE_THREAD = [
  { path: 'listingId', select: LISTING_FIELDS },
  { path: 'buyerId', select: BUYER_FIELDS },
  { path: 'breederId', select: BREEDER_FIELDS },
]

class InquiryService {
  /**
   * Создание запроса (только покупатель, 1 активный на пару buyer↔listing)
   */
  async create(params: {
    buyerId: Types.ObjectId
    listingId: Types.ObjectId
    message: string
    contactPhone?: string
  }): Promise<IInquiry> {
    const listing = await Listing.findById(params.listingId)
    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404, 'LISTING_NOT_FOUND')
    }

    if (listing.status !== 'active' || listing.verificationStatus !== 'verified') {
      throw new AppError('Ogłoszenie nie jest dostępne', 400, 'LISTING_NOT_AVAILABLE')
    }

    // Заводчик не может отправить запрос на собственное объявление
    const ownBreeder = await Breeder.findOne({ userId: params.buyerId })
    if (ownBreeder && ownBreeder._id.equals(listing.breederId)) {
      throw new AppError(
        'Nie możesz wysłać zapytania do własnego ogłoszenia',
        403,
        'OWN_LISTING'
      )
    }

    // Один активный запрос на пару покупатель↔объявление.
    // Предварительная проверка — для быстрого ответа; от гонки параллельных POST
    // защищает частичный уникальный индекс (E11000 ниже).
    const existing = await Inquiry.findOne({
      listingId: listing._id,
      buyerId: params.buyerId,
      status: { $ne: 'closed' },
    })
    if (existing) {
      throw new AppError(
        'Masz już aktywne zapytanie do tego ogłoszenia',
        409,
        'INQUIRY_EXISTS'
      )
    }

    let inquiry: IInquiry
    try {
      inquiry = await Inquiry.create({
        listingId: listing._id,
        buyerId: params.buyerId,
        breederId: listing.breederId,
        contactPhone: params.contactPhone,
        messages: [
          {
            senderId: params.buyerId,
            text: params.message,
            createdAt: new Date(),
          },
        ],
        status: 'new',
        breederUnreadCount: 1,
        buyerUnreadCount: 0,
        lastMessageAt: new Date(),
      })
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new AppError(
          'Masz już aktywne zapytanie do tego ogłoszenia',
          409,
          'INQUIRY_EXISTS'
        )
      }
      throw error
    }

    await Listing.updateOne({ _id: listing._id }, { $inc: { inquiriesCount: 1 } })

    return inquiry
  }

  /**
   * Запросы покупателя (в списке — только последнее сообщение треда)
   */
  async getForBuyer(
    buyerId: Types.ObjectId,
    pagination: { page: number; limit: number }
  ): Promise<{ inquiries: IInquiry[]; total: number; pages: number }> {
    const { page, limit } = pagination
    const [inquiries, total] = await Promise.all([
      Inquiry.find({ buyerId })
        .select({ messages: { $slice: -1 } })
        .populate('listingId', LISTING_FIELDS)
        .populate('breederId', BREEDER_FIELDS)
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Inquiry.countDocuments({ buyerId }),
    ])
    return { inquiries, total, pages: Math.ceil(total / limit) }
  }

  /**
   * Входящие запросы заводчика (в списке — только последнее сообщение треда)
   */
  async getForBreeder(
    breederId: Types.ObjectId,
    pagination: { page: number; limit: number }
  ): Promise<{ inquiries: IInquiry[]; total: number; pages: number }> {
    const { page, limit } = pagination
    const [inquiries, total] = await Promise.all([
      Inquiry.find({ breederId })
        .select({ messages: { $slice: -1 } })
        .populate('listingId', LISTING_FIELDS)
        .populate('buyerId', BUYER_FIELDS)
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Inquiry.countDocuments({ breederId }),
    ])
    return { inquiries, total, pages: Math.ceil(total / limit) }
  }

  /**
   * Поиск запроса + проверка прав доступа (покупатель, заводчик-владелец, админ)
   */
  async getWithAccess(inquiryId: Types.ObjectId, user: AuthUser): Promise<InquiryAccess> {
    const inquiry = await Inquiry.findById(inquiryId)
    if (!inquiry) {
      throw new AppError('Zapytanie nie zostało znalezione', 404, 'INQUIRY_NOT_FOUND')
    }

    const isBuyer = inquiry.buyerId.equals(user._id)
    const isAdmin = user.role === 'admin'

    // Ищем breeder-профиль для любой роли (admin тоже может владеть хозяйством)
    let isBreeder = false
    if (!isBuyer) {
      const breeder = await Breeder.findOne({ userId: user._id })
      isBreeder = !!breeder && breeder._id.equals(inquiry.breederId)
    }

    if (!isBuyer && !isBreeder && !isAdmin) {
      throw new AppError('Brak dostępu do tego zapytania', 403, 'FORBIDDEN')
    }

    return { inquiry, isBuyer, isBreeder, isAdmin }
  }

  /**
   * Тред запроса; помечает сообщения прочитанными для смотрящей стороны
   */
  async getById(inquiryId: Types.ObjectId, user: AuthUser): Promise<IInquiry> {
    const { inquiry, isBuyer, isBreeder } = await this.getWithAccess(inquiryId, user)

    // Атомарные обновления вместо save(): параллельное сообщение контрагента
    // не должно быть случайно помечено прочитанным (у него свой $inc)
    if (isBreeder) {
      await Inquiry.updateOne({ _id: inquiry._id }, { $set: { breederUnreadCount: 0 } })
      await Inquiry.updateOne(
        { _id: inquiry._id, status: 'new' },
        { $set: { status: 'read' } }
      )
    } else if (isBuyer) {
      await Inquiry.updateOne({ _id: inquiry._id }, { $set: { buyerUnreadCount: 0 } })
    }

    const fresh = await Inquiry.findById(inquiry._id).populate(POPULATE_THREAD)
    if (!fresh) {
      throw new AppError('Zapytanie nie zostało znalezione', 404, 'INQUIRY_NOT_FOUND')
    }
    return fresh
  }

  /**
   * Новое сообщение в треде (покупатель или заводчик)
   */
  async addMessage(
    inquiryId: Types.ObjectId,
    user: AuthUser,
    text: string
  ): Promise<IInquiry> {
    const { inquiry, isBuyer, isBreeder } = await this.getWithAccess(inquiryId, user)

    if (!isBuyer && !isBreeder) {
      throw new AppError('Brak dostępu do tego zapytania', 403, 'FORBIDDEN')
    }

    // Атомарный $push с проверкой статуса прямо в фильтре — параллельное закрытие
    // не пропустит сообщение, а параллельные сообщения не потеряют $inc
    const now = new Date()
    const updated = await Inquiry.findOneAndUpdate(
      { _id: inquiry._id, status: { $ne: 'closed' } },
      {
        $push: { messages: { senderId: user._id, text, createdAt: now } },
        $set: { lastMessageAt: now },
        $inc: isBreeder ? { buyerUnreadCount: 1 } : { breederUnreadCount: 1 },
      },
      { new: true }
    )
    if (!updated) {
      throw new AppError('Zapytanie jest zamknięte', 400, 'INQUIRY_CLOSED')
    }

    // Первый ответ заводчика переводит запрос в переписку
    if (isBreeder) {
      await Inquiry.updateOne(
        { _id: inquiry._id, status: { $in: ['new', 'read'] } },
        { $set: { status: 'in_progress' } }
      )
    }

    const fresh = await Inquiry.findById(inquiry._id).populate(POPULATE_THREAD)
    if (!fresh) {
      throw new AppError('Zapytanie nie zostało znalezione', 404, 'INQUIRY_NOT_FOUND')
    }
    return fresh
  }

  /**
   * Закрытие запроса (любая из сторон)
   */
  async close(inquiryId: Types.ObjectId, user: AuthUser): Promise<IInquiry> {
    const { inquiry, isBuyer, isBreeder } = await this.getWithAccess(inquiryId, user)

    if (!isBuyer && !isBreeder) {
      throw new AppError('Brak dostępu do tego zapytania', 403, 'FORBIDDEN')
    }

    if (inquiry.status === 'closed') {
      throw new AppError('Zapytanie jest już zamknięte', 400, 'ALREADY_CLOSED')
    }

    if (inquiry.status === 'purchase_confirmed') {
      throw new AppError(
        'Nie można zamknąć zapytania z potwierdzonym zakupem',
        400,
        'PURCHASE_CONFIRMED'
      )
    }

    const updated = await Inquiry.findOneAndUpdate(
      { _id: inquiry._id, status: { $nin: ['closed', 'purchase_confirmed'] } },
      { $set: { status: 'closed', closedAt: new Date() } },
      { new: true }
    )
    if (!updated) {
      // Гонка: статус изменился между проверкой и обновлением
      throw new AppError('Nie można zamknąć zapytania', 409, 'INVALID_STATUS')
    }

    return updated
  }

  /**
   * Подтверждение покупки — ТОЛЬКО покупатель (разблокирует отзыв в Этапе 4)
   */
  async confirmPurchase(inquiryId: Types.ObjectId, user: AuthUser): Promise<IInquiry> {
    const { inquiry, isBuyer } = await this.getWithAccess(inquiryId, user)

    if (!isBuyer) {
      throw new AppError(
        'Tylko kupujący może potwierdzić zakup',
        403,
        'BUYER_ONLY'
      )
    }

    if (inquiry.status === 'purchase_confirmed') {
      throw new AppError('Zakup został już potwierdzony', 400, 'ALREADY_CONFIRMED')
    }

    if (inquiry.status === 'closed') {
      throw new AppError('Zapytanie jest zamknięte', 400, 'INQUIRY_CLOSED')
    }

    // Подтвердить покупку можно только после ответа заводчика — иначе любой аккаунт
    // мог бы «купить» и оставить отзыв (Этап 4) без какого-либо контакта
    if (inquiry.status !== 'in_progress') {
      throw new AppError(
        'Zakup można potwierdzić dopiero po odpowiedzi hodowcy',
        400,
        'NO_BREEDER_REPLY'
      )
    }

    const updated = await Inquiry.findOneAndUpdate(
      { _id: inquiry._id, status: 'in_progress' },
      { $set: { status: 'purchase_confirmed', purchaseConfirmedAt: new Date() } },
      { new: true }
    )
    if (!updated) {
      throw new AppError('Nie można potwierdzić zakupu', 409, 'INVALID_STATUS')
    }

    return updated
  }
}

export const inquiryService = new InquiryService()
