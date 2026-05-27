import { Types } from 'mongoose'
import { DocumentModel, IDocument, DocumentType, DocumentStatus } from './document.model'
import { Breeder } from '../breeders/breeder.model'
import { cloudinaryService, UploadFolder } from '../../services/cloudinary.service'
import { AppError } from '../../middleware/error.middleware'

interface UploadDocumentParams {
  userId: Types.ObjectId
  type: DocumentType
  file: Express.Multer.File
}

interface UpdateDocumentStatusParams {
  documentId: Types.ObjectId
  status: DocumentStatus
  verifiedBy?: Types.ObjectId
  rejectionReason?: string
}

class DocumentService {
  /**
   * Сопоставление типа документа с папкой Cloudinary
   */
  private getFolder(type: DocumentType): UploadFolder {
    const folderMap: Record<DocumentType, UploadFolder> = {
      zkwp_certificate: 'documents/zkwp',
      identity: 'documents/identity',
      pedigree: 'documents/pedigrees',
      award: 'documents/awards',
      kennel_photo: 'kennels',
      puppy_photo: 'puppies',
      vet_passport: 'documents/other',
      metric: 'documents/other',
      other: 'documents/other',
    }
    return folderMap[type]
  }

  /**
   * Загрузка документа
   */
  async upload(params: UploadDocumentParams): Promise<IDocument> {
    const { userId, type, file } = params
    
    const folder = this.getFolder(type)
    const isImage = file.mimetype.startsWith('image/')
    
    // Загрузка в Cloudinary
    const result = await cloudinaryService.uploadBuffer(file.buffer, {
      folder,
      resourceType: isImage ? 'image' : 'raw',
      transformation: isImage ? { quality: 'auto', fetch_format: 'auto' } : undefined,
      originalName: file.originalname,
    })

    // Создание записи в базе
    const document = await DocumentModel.create({
      userId,
      type,
      fileName: result.publicId.split('/').pop(),
      originalName: file.originalname,
      fileUrl: result.secureUrl,
      publicId: result.publicId,
      fileSize: result.bytes,
      mimeType: file.mimetype,
      status: 'pending',
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
      },
    })

    return document
  }

  /**
   * Получение документа по ID
   */
  async getById(documentId: Types.ObjectId): Promise<IDocument | null> {
    return DocumentModel.findById(documentId)
  }

  /**
   * Получение документов пользователя
   */
  async getByUserId(userId: Types.ObjectId, type?: DocumentType): Promise<IDocument[]> {
    const query: { userId: Types.ObjectId; type?: DocumentType } = { userId }
    if (type) query.type = type
    return DocumentModel.find(query).sort({ createdAt: -1 })
  }

  /**
   * Обновление статуса документа (для админа)
   * При одобрении автоматически обновляет флаги верификации заводчика
   */
  async updateStatus(params: UpdateDocumentStatusParams): Promise<IDocument> {
    const { documentId, status, verifiedBy, rejectionReason } = params
    
    const document = await DocumentModel.findById(documentId)
    if (!document) {
      throw new AppError('Dokument nie znaleziony', 404)
    }

    document.status = status
    
    if (status === 'approved' && verifiedBy) {
      document.verifiedBy = verifiedBy
      document.verifiedAt = new Date()
      
      // Автоматическое обновление флагов верификации заводчика
      await this.updateBreederVerification(document.userId, document.type, document._id, verifiedBy)
    }
    
    if (status === 'rejected') {
      if (rejectionReason) {
        document.rejectionReason = rejectionReason
      }
      if (verifiedBy) {
        document.verifiedBy = verifiedBy
        document.verifiedAt = new Date()
      }
    }

    await document.save()
    return document
  }

  /**
   * Обновление флагов верификации заводчика на основе типа документа
   */
  private async updateBreederVerification(
    userId: Types.ObjectId,
    documentType: DocumentType,
    documentId: Types.ObjectId,
    adminId: Types.ObjectId
  ): Promise<void> {
    const breeder = await Breeder.findOne({ userId })
    if (!breeder) return // Не заводчик — пропускаем

    const now = new Date()

    switch (documentType) {
      case 'zkwp_certificate':
        breeder.verification.zkwpVerified = true
        breeder.verification.zkwpVerifiedAt = now
        breeder.verification.zkwpVerifiedBy = adminId
        breeder.verification.zkwpDocument = documentId
        // Основной статус заводчика тоже становится verified
        breeder.verification.status = 'verified'
        break
        
      case 'identity':
        breeder.verification.identityVerified = true
        breeder.verification.identityVerifiedAt = now
        breeder.verification.identityDocument = documentId
        break
        
      case 'award': {
        // Проверяем, нет ли уже награды с этим документом
        const award = breeder.verification.awards.find(
          a => a.document?.toString() === documentId.toString()
        )

        if (!award) {
          // Создаём новую награду с документом
          const document = await this.getById(documentId)
          const awardTitle = document?.originalName || `Nagroda ${now.getFullYear()}`
          breeder.verification.awards.push({
            title: awardTitle,
            document: documentId,
            verified: true,
          })
        } else {
          // Обновляем существующую награду
          award.verified = true
          if (!award.document) {
            award.document = documentId
          }
        }
        break
      }

      case 'pedigree': {
        // Проверяем, нет ли уже собаки с этим документом
        const dog = breeder.verification.breedingDogs.find(
          d => d.pedigreeDocument?.toString() === documentId.toString()
        )

        if (!dog) {
          // Создаём новую собаку с документом
          const document = await this.getById(documentId)
          const dogName = document?.originalName?.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '') || 'Reproduktor'
          breeder.verification.breedingDogs.push({
            name: dogName,
            pedigreeDocument: documentId,
            verified: true,
          })
        } else {
          // Обновляем существующую собаку
          dog.verified = true
          if (!dog.pedigreeDocument) {
            dog.pedigreeDocument = documentId
          }
        }
        break
      }

      case 'kennel_photo':
        // Фото питомника не требуют отдельного флага — считаются по количеству
        // Możemy dodać logikę подсчета одобренных фото если нужно
        break
    }

    await breeder.save()
  }

  /**
   * Удаление документа
   */
  async delete(documentId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const document = await DocumentModel.findOne({ _id: documentId, userId })
    
    if (!document) {
      throw new AppError('Dokument nie znaleziony', 404)
    }

    // Удаление привязок к заводчику, если документ был одобрен
    if (document.status === 'approved') {
      await this.removeBreederVerificationLinks(userId, document.type, documentId)
    }

    // Удаление из Cloudinary
    const isImage = document.mimeType.startsWith('image/')
    await cloudinaryService.delete(document.publicId, isImage ? 'image' : 'raw')

    // Удаление из базы
    await document.deleteOne()
  }

  /**
   * Удаление привязок документа к верификации заводчика
   */
  private async removeBreederVerificationLinks(
    userId: Types.ObjectId,
    documentType: DocumentType,
    documentId: Types.ObjectId
  ): Promise<void> {
    const breeder = await Breeder.findOne({ userId })
    if (!breeder) return

    switch (documentType) {
      case 'zkwp_certificate':
        if (breeder.verification.zkwpDocument?.toString() === documentId.toString()) {
          breeder.verification.zkwpVerified = false
          breeder.verification.zkwpDocument = undefined
          breeder.verification.zkwpVerifiedAt = undefined
          breeder.verification.zkwpVerifiedBy = undefined
          // Если других обязательных документов нет, статус может измениться
          if (!breeder.verification.zkwpVerified) {
            breeder.verification.status = 'pending'
          }
        }
        break

      case 'identity':
        if (breeder.verification.identityDocument?.toString() === documentId.toString()) {
          breeder.verification.identityVerified = false
          breeder.verification.identityDocument = undefined
          breeder.verification.identityVerifiedAt = undefined
        }
        break

      case 'award':
        // Удаляем награду с этим документом
        breeder.verification.awards = breeder.verification.awards.filter(
          a => a.document?.toString() !== documentId.toString()
        )
        break

      case 'pedigree':
        // Удаляем собаку с этим документом
        breeder.verification.breedingDogs = breeder.verification.breedingDogs.filter(
          d => d.pedigreeDocument?.toString() !== documentId.toString()
        )
        break
    }

    await breeder.save()
  }

  /**
   * Получение документов на модерацию (для админа)
   */
  async getPendingDocuments(page = 1, limit = 20, type?: DocumentType): Promise<{
    documents: IDocument[]
    total: number
    pages: number
  }> {
    const skip = (page - 1) * limit
    const query: { status: DocumentStatus; type?: DocumentType } = { status: 'pending' }
    
    if (type) {
      query.type = type
    }
    
    const [documents, total] = await Promise.all([
      DocumentModel.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      DocumentModel.countDocuments(query),
    ])

    return {
      documents,
      total,
      pages: Math.ceil(total / limit),
    }
  }
}

export const documentService = new DocumentService()
