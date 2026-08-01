export interface UploadDocumentResponse {
  success: boolean
  data: {
    _id: string
    type: string
    fileName: string
    fileUrl: string
    status: string
  }
}

export interface Document {
  _id: string
  type: string
  fileName: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

