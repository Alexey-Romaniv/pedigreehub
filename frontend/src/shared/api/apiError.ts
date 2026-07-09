// Единый разбор ошибок API: backend отдаёт { success: false, error: { code, message } }
export interface ApiError {
  response?: {
    status?: number
    data?: {
      error?: {
        code?: string
        message?: string
      }
    }
  }
}

export const getApiErrorMessage = (error: unknown, fallback: string): string =>
  (error as ApiError)?.response?.data?.error?.message || fallback
