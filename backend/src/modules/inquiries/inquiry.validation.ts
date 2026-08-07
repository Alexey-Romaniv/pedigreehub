import { z } from 'zod'

// Польский номер телефона (опциональный): допускает пробелы/дефисы, нормализует к +48XXXXXXXXX
const optionalPhoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => /^(\+?48)?\d{9}$/.test(value), {
    message: 'Numer musi być w formacie +48XXXXXXXXX',
  })
  .transform((value) => `+48${value.replace(/^\+?48/, '')}`)
  .optional()

export const createInquirySchema = z.object({
  listingId: z.string().min(1, 'ID ogłoszenia jest wymagane'),
  message: z
    .string()
    .trim()
    .min(10, 'Wiadomość musi mieć minimum 10 znaków')
    .max(2000, 'Wiadomość może mieć maksymalnie 2000 znaków'),
  contactPhone: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    optionalPhoneSchema
  ),
})

export const addMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Wiadomość nie może być pusta')
    .max(2000, 'Wiadomość może mieć maksymalnie 2000 znaków'),
})

export const updateInquiryStatusSchema = z.object({
  status: z.literal('closed', {
    errorMap: () => ({ message: 'Dozwolona jest tylko zmiana statusu na "closed"' }),
  }),
})
