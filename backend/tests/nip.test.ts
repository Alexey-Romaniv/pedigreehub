import { describe, it, expect } from 'vitest'
import { nipService } from '../src/services/nip.service'

// Чистая функция: сеть и база не нужны
describe('nipService.validateNIP (suma kontrolna)', () => {
  it('akceptuje poprawny NIP', () => {
    expect(nipService.validateNIP('5261040828')).toBe(true)
    expect(nipService.validateNIP('7740001454')).toBe(true)
  })

  it('akceptuje NIP z myślnikami i spacjami', () => {
    expect(nipService.validateNIP('526-104-08-28')).toBe(true)
    expect(nipService.validateNIP('526 104 08 28')).toBe(true)
  })

  it('odrzuca NIP z błędną cyfrą kontrolną', () => {
    expect(nipService.validateNIP('5261040829')).toBe(false)
    expect(nipService.validateNIP('7740001455')).toBe(false)
  })

  it('odrzuca NIP, dla którego suma modulo 11 daje 10', () => {
    // Такой NIP не выдаётся: контрольная цифра не может быть «10»
    expect(nipService.validateNIP('1000000160')).toBe(false)
  })

  it('odrzuca litery', () => {
    expect(nipService.validateNIP('52610408AB')).toBe(false)
    expect(nipService.validateNIP('PL5261040828')).toBe(false)
  })

  it('odrzuca zbyt krótki i zbyt długi numer', () => {
    expect(nipService.validateNIP('526104082')).toBe(false)
    expect(nipService.validateNIP('52610408281')).toBe(false)
    expect(nipService.validateNIP('')).toBe(false)
  })
})
