import { z } from 'zod'

// Нормализация польского номера телефона к формату +48XXXXXXXXX
export const normalizePhone = (value: string) =>
  `+48${value.replace(/[\s-]/g, '').replace(/^\+?48/, '')}`

// Польский номер телефона; результат нормализуется к +48XXXXXXXXX
export const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => /^(\+?48)?\d{9}$/.test(value), {
    message: 'Numer musi być w formacie +48 XXX XXX XXX',
  })
  .transform(normalizePhone)
