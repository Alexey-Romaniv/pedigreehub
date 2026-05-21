/**
 * NIP Verification Service
 * Использует API Ministerstwa Finansów (Biała Lista VAT)
 * Работает со всеми типами компаний: JDG, sp. z o.o., S.A. и др.
 * 
 * API: https://wl-api.mf.gov.pl
 */

interface MFSubject {
  name: string
  nip: string
  statusVat: string // "Czynny" | "Zwolniony" | "Niezarejestrowany"
  regon?: string
  krs?: string
  residenceAddress?: string
  workingAddress?: string
  registrationLegalDate?: string
}

interface MFResponse {
  result: {
    subject: MFSubject | null
    requestId: string
  }
}

export interface VerificationResult {
  verified: boolean
  companyName?: string
  status?: string
  address?: string
  regon?: string
  krs?: string
  error?: string
}

class NIPService {
  private readonly baseUrl = 'https://wl-api.mf.gov.pl/api/search/nip'

  /**
   * Нормализация NIP (удаление дефисов и пробелов)
   */
  private normalizeNIP(nip: string): string {
    return nip.replace(/[\s-]/g, '')
  }

  /**
   * Валидация формата NIP (контрольная сумма)
   */
  validateNIP(nip: string): boolean {
    const normalized = this.normalizeNIP(nip)
    
    if (!/^\d{10}$/.test(normalized)) return false
    
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
    const digits = normalized.split('').map(Number)
    
    const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0)
    const checksum = sum % 11
    
    return checksum === digits[9]
  }

  /**
   * Форматирование даты для API (yyyy-MM-dd)
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Проверка NIP через API Ministerstwa Finansów
   */
  async verifyNIP(nip: string): Promise<VerificationResult> {
    const normalized = this.normalizeNIP(nip)
    
    if (!this.validateNIP(normalized)) {
      return {
        verified: false,
        error: 'Nieprawidłowy format NIP',
      }
    }

    try {
      const url = `${this.baseUrl}/${normalized}?date=${this.getToday()}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 400) {
          return {
            verified: false,
            error: 'Nieprawidłowy NIP',
          }
        }
        
        console.error('MF API error:', response.status)
        return {
          verified: false,
          error: 'Błąd weryfikacji NIP. Spróbuj później.',
        }
      }

      const data = await response.json() as MFResponse
      
      if (!data.result?.subject) {
        return {
          verified: false,
          error: 'Nie znaleziono podmiotu o podanym NIP',
        }
      }

      const subject = data.result.subject

      // Проверяем статус VAT
      if (subject.statusVat === 'Niezarejestrowany') {
        return {
          verified: false,
          companyName: subject.name,
          status: subject.statusVat,
          error: 'Podmiot niezarejestrowany jako podatnik VAT',
        }
      }

      return {
        verified: true,
        companyName: subject.name,
        status: subject.statusVat,
        address: subject.workingAddress || subject.residenceAddress,
        regon: subject.regon,
        krs: subject.krs,
      }

    } catch (error) {
      console.error('NIP verification error:', error)
      return {
        verified: false,
        error: 'Błąd połączenia z API. Spróbuj później.',
      }
    }
  }
}

export const nipService = new NIPService()

