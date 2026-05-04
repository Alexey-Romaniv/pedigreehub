import 'dotenv/config'
import { app } from './app.js'
import { connectDatabase } from './config/database.js'
import { seedBreeds } from './modules/breeds/breed.seed.js'

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectDatabase()
    
    // Инициализация пород при первом запуске
    try {
      await seedBreeds()
    } catch (error) {
      console.warn('Nie udało się zainicjalizować ras:', error)
    }

    app.listen(PORT, () => {
      console.log(`Serwer uruchomiony na http://localhost:${PORT}`)
      console.log(`Dokumentacja API: http://localhost:${PORT}/api-docs`)
    })
  } catch (error) {
    console.error('Błąd uruchamiania serwera:', error)
    process.exit(1)
  }
}

startServer()
