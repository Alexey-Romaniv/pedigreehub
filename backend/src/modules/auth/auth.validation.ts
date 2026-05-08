import { z } from 'zod'

export const POLISH_REGIONS = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
] as const

// Польский номер телефона: допускает пробелы/дефисы, нормализует к +48XXXXXXXXX
export const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => /^(\+?48)?\d{9}$/.test(value), {
    message: 'Numer musi być w formacie +48XXXXXXXXX',
  })
  .transform((value) => `+48${value.replace(/^\+?48/, '')}`)

export const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy email').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
  firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki').trim(),
  lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki').trim(),
  phone: phoneSchema,
})

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy email').toLowerCase().trim(),
  password: z.string().min(1, 'Wprowadź hasło'),
})

// Схема для регистрации заводчика (без документов)
export const registerBreederSchema = z.object({
  // Личные данные
  email: z.string().email('Nieprawidłowy email').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
  firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki').trim(),
  lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki').trim(),
  phone: phoneSchema,
  
  // Данные питомника
  kennelName: z.string().min(3, 'Nazwa hodowli musi mieć minimum 3 znaki').max(100).trim(),
  kennelRegistration: z.string().min(5, 'Nieprawidłowy numer rejestracyjny ZKwP').trim(),
  region: z.enum(POLISH_REGIONS, { errorMap: () => ({ message: 'Wybierz województwo' }) }),
  city: z.string().min(2, 'Miasto musi mieć minimum 2 znaki').trim(),
  address: z.string().optional(),
  description: z.string().min(50, 'Opis musi mieć minimum 50 znaków').max(2000),
  website: z.string().url('Nieprawidłowy URL strony').optional().or(z.literal('')),
  socialLinks: z.object({
    facebook: z.string().optional().or(z.literal('')),
    instagram: z.string().optional().or(z.literal('')),
  }).optional(),
  // ObjectId выбранных пород из каталога /breeds
  breeds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Nieprawidłowy identyfikator rasy'))
    .min(1, 'Wybierz przynajmniej jedną rasę'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy email').toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Brak tokenu resetowania'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
})

// Смена пароля из панели (пользователь авторизован, знает текущий пароль)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Wprowadź aktualne hasło'),
    newPassword: z
      .string()
      .min(8, 'Hasło musi mieć minimum 8 znaków')
      .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
      .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Nowe hasło musi różnić się od aktualnego',
    path: ['newPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterBreederInput = z.infer<typeof registerBreederSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
