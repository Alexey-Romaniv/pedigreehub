import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { env } from '../config/env'

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export type UploadFolder = 
  | 'avatars'
  | 'kennels'
  | 'puppies'
  | 'listings/photos'
  | 'listings/parents'
  | 'documents/zkwp'
  | 'documents/identity'
  | 'documents/pedigrees'
  | 'documents/awards'
  | 'documents/other'

interface UploadOptions {
  folder: UploadFolder
  publicId?: string
  transformation?: object
  resourceType?: 'image' | 'raw' | 'auto'
  originalName?: string // Для сохранения расширения в raw файлах
}

interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  format: string
  width?: number
  height?: number
  bytes: number
}

class CloudinaryService {
  /**
   * Загрузка файла из буфера (Multer)
   */
  async uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    // Для raw файлов (PDF и др.) добавляем расширение в public_id
    let publicId = options.publicId
    if (options.resourceType === 'raw' && options.originalName) {
      const ext = options.originalName.split('.').pop()?.toLowerCase()
      if (ext && !publicId) {
        publicId = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      }
    }

    const uploadOptions = {
      folder: `pedigreehub/${options.folder}`,
      public_id: publicId,
      resource_type: options.resourceType || 'auto' as const,
      transformation: options.transformation,
      use_filename: options.resourceType === 'raw',
    }

    // Для raw файлов (PDF) используем base64 upload - надёжнее чем stream
    if (options.resourceType === 'raw') {
      const base64 = `data:application/octet-stream;base64,${buffer.toString('base64')}`
      const result = await cloudinary.uploader.upload(base64, uploadOptions)
      return this.formatResult(result)
    }

    // Для изображений - stream upload
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'))
            return
          }
          resolve(this.formatResult(result))
        }
      ).end(buffer)
    })
  }

  /**
   * Загрузка файла по URL
   */
  async uploadUrl(url: string, options: UploadOptions): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(url, {
      folder: `pedigreehub/${options.folder}`,
      public_id: options.publicId,
      resource_type: options.resourceType || 'auto',
      transformation: options.transformation,
    })
    return this.formatResult(result)
  }

  /**
   * Удаление файла
   */
  async delete(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })
      return result.result === 'ok'
    } catch {
      return false
    }
  }

  /**
   * Удаление нескольких файлов
   */
  async deleteMany(publicIds: string[], resourceType: 'image' | 'raw' = 'image'): Promise<void> {
    if (publicIds.length === 0) return
    
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    })
  }

  /**
   * Получение URL с трансформациями
   */
  getUrl(publicId: string, options?: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
  }): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: options ? [{
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: options.quality || 'auto',
      }] : undefined,
    })
  }

  /**
   * Thumbnail URL
   */
  getThumbnailUrl(publicId: string, size = 150): string {
    return this.getUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      quality: 80,
    })
  }

  private formatResult(result: UploadApiResponse): UploadResult {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }
  }
}

export const cloudinaryService = new CloudinaryService()

