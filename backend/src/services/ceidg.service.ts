/**
 * CEIDG API Service
 * Centralna Ewidencja i Informacja o Działalności Gospodarczej
 * 
 * API документация: https://dane.biznes.gov.pl/api/ceidg/v2
 * 
 * PKD код для разведения животных: 01.49.Z
 */

interface CEIDGCompany {
  nip: string
  nazwa: string
  status: 'AKTYWNY' | 'ZAWIESZONY' | 'WYKRESLONY'
  dataRozpoczecia?: string
  adres?: {
    wojewodztwo?: string
    powiat?: string
    gmina?: string
    miejscowosc?: string
    ulica?: string
    budynek?: string
    lokal?: string
    kodPocztowy?: string
  }
  pkd?: string[]
}

interface CEIDGResponse {
  firmy: CEIDGCompany[]
}

interface VerificationResult {
  verified: boolean
  companyName?: string
  status?: string
  pkd?: string[]
  hasBreedingPKD?: boolean
  address?: string
  error?: string
}

class CEIDGService {
  private readonly baseUrl = 'https://dane.biznes.gov.pl/api/ceidg/v2'
  
  // PKD коды связанные с разведением животных
  private readonly breedingPKDCodes = [
    '01.49.Z',  // Chów i hodowla pozostałych zwierząt
    '01.42.Z',  // Chów i hodowla innych zwierząt domowych
  ]

  /**
   * Нормализация NIP (удаление дефисов и пробелов)
   */
  private normalizeNIP(nip: string): string {
    return nip.replace(/[\s-]/g, '')
  }

  /**
   * Валидация формата NIP
   */
  validateNIP(nip: string): boolean {
    const normalized = this.normalizeNIP(nip)
    
    // NIP должен содержать 10 цифр
    if (!/^\d{10}$/.test(normalized)) return false
    
    // Проверка контрольной суммы
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
    const digits = normalized.split('').map(Number)
    
    const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0)
    const checksum = sum % 11
    
    return checksum === digits[9]
  }

  /**
   * Проверка NIP через CEIDG API
   */
  async verifyNIP(nip: string): Promise<VerificationResult> {
    const normalized = this.normalizeNIP(nip)
    
    // Сначала валидируем формат
    if (!this.validateNIP(normalized)) {
      return {
        verified: false,
        error: 'Nieprawidłowy format NIP',
      }
    }

    try {
      // CEIDG API - публичный доступ без токена для базовых данных
      const response = await fetch(
        `${this.baseUrl}/firmy?nip=${normalized}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        // Если API недоступен, возвращаем "не проверено" без ошибки
        // чтобы не блокировать регистрацию
        if (response.status === 404) {
          return {
            verified: false,
            error: 'Nie znaleziono firmy o podanym NIP',
          }
        }
        
        console.error('CEIDG API error:', response.status)
        return {
          verified: false,
          error: 'Błąd weryfikacji NIP. Spróbuj później.',
        }
      }

      const data = await response.json() as CEIDGResponse
      
      if (!data.firmy || data.firmy.length === 0) {
        return {
          verified: false,
          error: 'Nie znaleziono firmy o podanym NIP',
        }
      }

      const company = data.firmy[0]
      
      // Проверяем статус компании
      if (company.status !== 'AKTYWNY') {
        return {
          verified: false,
          companyName: company.nazwa,
          status: company.status,
          error: `Firma ma status: ${company.status}`,
        }
      }

      // Проверяем PKD код
      const hasBreedingPKD = company.pkd?.some(pkd => 
        this.breedingPKDCodes.includes(pkd)
      ) || false

      // Форматируем адрес
      let address: string | undefined
      if (company.adres) {
        const a = company.adres
        address = [
          a.ulica ? `${a.ulica} ${a.budynek || ''}${a.lokal ? `/${a.lokal}` : ''}` : a.miejscowosc,
          a.kodPocztowy,
          a.miejscowosc,
          a.wojewodztwo,
        ].filter(Boolean).join(', ')
      }

      return {
        verified: true,
        companyName: company.nazwa,
        status: company.status,
        pkd: company.pkd,
        hasBreedingPKD,
        address,
      }

    } catch (error) {
      console.error('CEIDG verification error:', error)
      return {
        verified: false,
        error: 'Błąd połączenia z CEIDG. Spróbuj później.',
      }
    }
  }
}

export const ceidgService = new CEIDGService()

