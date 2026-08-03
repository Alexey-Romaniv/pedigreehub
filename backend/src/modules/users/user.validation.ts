import { z } from 'zod'
import { phoneSchema } from '../auth/auth.validation'

// PATCH /users/me — все поля опциональны, но хотя бы одно должно быть передано
export const updateProfileSchema = z
  .object({
    firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki').max(50).trim().optional(),
    lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki').max(50).trim().optional(),
    phone: phoneSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Brak danych do aktualizacji',
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
