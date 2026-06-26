import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from '../config/env'
import { User } from '../modules/users/user.model'

/**
 * Создание (или обновление до роли admin) учётной записи администратора.
 * Запуск: yarn create-admin [email] [password]
 * По умолчанию: admin@pedigreehub.pl / Admin123!
 */
async function createAdmin() {
  const email = process.argv[2] || 'admin@pedigreehub.pl'
  const password = process.argv[3] || 'Admin123!'

  await mongoose.connect(env.MONGODB_URI)

  const hashedPassword = await bcrypt.hash(password, 12)
  const existing = await User.findOne({ email })

  if (existing) {
    existing.role = 'admin'
    existing.password = hashedPassword
    existing.isEmailVerified = true
    existing.isBlocked = false
    await existing.save()
    console.log(`Istniejący użytkownik ${email} zaktualizowany do roli admin`)
  } else {
    await User.create({
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'PedigreeHub',
      phone: '+48000000000',
      role: 'admin',
      isEmailVerified: true,
      isVerified: true,
    })
    console.log(`Utworzono administratora: ${email}`)
  }

  console.log(`   Hasło: ${password}`)
  await mongoose.disconnect()
}

createAdmin().catch((error) => {
  console.error('Błąd tworzenia administratora:', error)
  process.exit(1)
})
