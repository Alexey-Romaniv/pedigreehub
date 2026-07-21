import { axiosInstance } from '@/shared/api/axiosInstance'
import type {
  CreateListingFormData,
  CreateListingResponse,
  BreedsResponse,
  Listing,
  ListingStatus,
  PublicListingsParams,
  PublicListingsResponse,
} from '../types'

// Общий сборщик multipart-формы для create/update.
// Пустые опциональные поля (mikroczип, opis) не отправляем — черновик
// можно сохранить частично заполненным
const buildListingFormData = (data: CreateListingFormData): FormData => {
  const formData = new FormData()

  // Шаг 1
  formData.append('title', data.title)
  if (!data.breed) {
    throw new Error('Rasa jest wymagana')
  }
  formData.append('breed', data.breed)
  if (data.birthDate) {
    const birthDate = data.birthDate instanceof Date ? data.birthDate : new Date(data.birthDate)
    formData.append('birthDate', birthDate.toISOString())
  }
  formData.append('gender', data.gender)
  formData.append('color', data.color)
  if (data.puppyName) {
    formData.append('puppyName', data.puppyName)
  }
  formData.append('price', data.price.toString())
  formData.append('currency', data.currency || 'PLN')

  // Шаг 2
  formData.append('fatherName', data.father.name)
  if (data.father.pedigreeNumber) {
    formData.append('fatherPedigreeNumber', data.father.pedigreeNumber)
  }
  if (data.father.titles.length > 0) {
    formData.append('fatherTitles', JSON.stringify(data.father.titles))
  }
  if (data.father.photo) {
    formData.append('fatherPhoto', data.father.photo)
  }

  formData.append('motherName', data.mother.name)
  if (data.mother.pedigreeNumber) {
    formData.append('motherPedigreeNumber', data.mother.pedigreeNumber)
  }
  if (data.mother.titles.length > 0) {
    formData.append('motherTitles', JSON.stringify(data.mother.titles))
  }
  if (data.mother.photo) {
    formData.append('motherPhoto', data.mother.photo)
  }

  // Шаг 3
  if (data.microchipNumber) {
    formData.append('microchipNumber', data.microchipNumber)
  }
  formData.append('hasPedigree', data.hasPedigree.toString())
  if (data.hasPedigree && data.pedigreeDocument) {
    formData.append('pedigreeDocument', data.pedigreeDocument)
  }
  formData.append('hasVetPassport', data.hasVetPassport.toString())
  if (data.hasVetPassport && data.vetPassportDocument) {
    formData.append('vetPassportDocument', data.vetPassportDocument)
  }
  formData.append('hasMetric', data.hasMetric.toString())
  if (data.hasMetric && data.metricDocument) {
    formData.append('metricDocument', data.metricDocument)
  }

  // Шаг 4
  data.photos.forEach((photo) => {
    formData.append('photos', photo)
  })
  formData.append('videos', JSON.stringify(data.videos))
  if (data.description) {
    formData.append('description', data.description)
  }

  return formData
}

export const listingsApi = {
  create: async (data: CreateListingFormData, status: 'draft' | 'pending'): Promise<CreateListingResponse> => {
    const formData = buildListingFormData(data)
    formData.append('status', status)

    const response = await axiosInstance.post<CreateListingResponse>(
      '/listings',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  update: async (
    id: string,
    data: CreateListingFormData,
    existingPhotos: string[]
  ): Promise<Listing> => {
    const formData = buildListingFormData(data)
    // Какие из уже загруженных фото оставить; новые файлы идут в photos
    formData.append('existingPhotos', JSON.stringify(existingPhotos))

    const response = await axiosInstance.patch<{ success: boolean; data: Listing }>(
      `/listings/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  getBreeds: async (): Promise<BreedsResponse> => {
    const response = await axiosInstance.get<BreedsResponse>('/breeds')
    return response.data
  },

  getMy: async (status?: ListingStatus): Promise<Listing[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: Listing[] }>(
      '/listings/my',
      { params: status ? { status } : undefined }
    )
    return response.data.data
  },

  getPublic: async (params: PublicListingsParams): Promise<PublicListingsResponse> => {
    const response = await axiosInstance.get<PublicListingsResponse>('/listings', { params })
    return response.data
  },

  getById: async (id: string): Promise<Listing> => {
    const response = await axiosInstance.get<{ success: boolean; data: Listing }>(
      `/listings/${id}`
    )
    return response.data.data
  },

  updateStatus: async (id: string, status: ListingStatus): Promise<Listing> => {
    const response = await axiosInstance.patch<{ success: boolean; data: Listing }>(
      `/listings/${id}/status`,
      { status }
    )
    return response.data.data
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/listings/${id}`)
  },
}

