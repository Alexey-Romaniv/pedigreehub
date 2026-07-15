import { z } from 'zod'
import { phoneSchema } from '@/shared/validation'

// === API Types ===
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  data: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      phone?: string
      avatar?: string
      role: 'user' | 'breeder' | 'admin'
      isVerified: boolean
      isEmailVerified: boolean
    }
    breeder?: {
      id: string
      kennelName: string
      verificationStatus: 'pending' | 'verified' | 'rejected'
      verificationLevel: 'new' | 'verified' | 'trusted' | 'professional'
      badges: string[]
    }
  }
}

export interface CheckEmailResponse {
  success: boolean
  data: { available: boolean }
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

export interface AuthMessageResponse {
  success: boolean
  message: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
  data: { email: string }
}

export interface RegisterBreederData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  kennelName: string
  kennelRegistration: string
  region: string
  city: string
  address?: string
  description: string
  website?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
  }
  breeds: string[]
}

export interface RegisterBreederResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: string
    }
    breeder: {
      id: string
      kennelName: string
      verificationStatus: string
    }
  }
}

// === Form Schemas ===
export const step1Schema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy email'),
  phone: phoneSchema,
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
})

export const step2Schema = z.object({
  kennelName: z.string().min(3, 'Nazwa hodowli musi mieć minimum 3 znaki'),
  kennelRegistration: z.string().min(5, 'Nieprawidłowy numer rejestracyjny ZKwP'),
  region: z.string().min(1, 'Wybierz województwo'),
  city: z.string().min(2, 'Miasto musi mieć minimum 2 znaki'),
  address: z.string().optional(),
  description: z.string().min(50, 'Opis musi mieć minimum 50 znaków'),
  website: z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  breeds: z.array(z.string()).min(1, 'Wybierz przynajmniej jedną rasę'),
})

export type Step1FormData = z.infer<typeof step1Schema>
export type Step2FormData = z.infer<typeof step2Schema>

// Store types (без confirmPassword)
export interface Step1Data {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

export interface Step2Data {
  kennelName: string
  kennelRegistration: string
  region: string
  city: string
  address?: string
  description: string
  website?: string
  facebook?: string
  instagram?: string
  breeds: string[]
}

