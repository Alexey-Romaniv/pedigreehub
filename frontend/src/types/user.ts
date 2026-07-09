export interface IBreeder {
  id: string
  kennelName: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationLevel: 'new' | 'verified' | 'trusted' | 'professional'
  badges: string[]
}

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'user' | 'breeder' | 'admin'
  isVerified: boolean
  isEmailVerified: boolean
  breeder?: IBreeder
}

