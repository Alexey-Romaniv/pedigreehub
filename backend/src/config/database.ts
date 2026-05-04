import mongoose from 'mongoose'

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pedigreehub'

  try {
    await mongoose.connect(uri)
    console.log('Połączono z MongoDB')
  } catch (error) {
    console.error('Błąd połączenia z MongoDB:', error)
    throw error
  }

  mongoose.connection.on('error', (error) => {
    console.error('Błąd MongoDB:', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB rozłączone')
  })
}
