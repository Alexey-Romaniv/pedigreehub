import { z } from 'zod'

export const createReviewSchema = z.object({
  breederId: z.string().min(1, 'ID hodowcy jest wymagane'),
  rating: z
    .number({ invalid_type_error: 'Ocena musi być liczbą' })
    .int('Ocena musi być liczbą całkowitą')
    .min(1, 'Minimalna ocena to 1')
    .max(5, 'Maksymalna ocena to 5'),
  text: z
    .string()
    .trim()
    .min(10, 'Opinia musi mieć minimum 10 znaków')
    .max(2000, 'Opinia może mieć maksymalnie 2000 znaków'),
})
