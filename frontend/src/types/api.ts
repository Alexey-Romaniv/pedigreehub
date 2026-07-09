export interface IApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

export interface IApiSuccess<T> {
  success: true
  data: T
  message?: string
}

