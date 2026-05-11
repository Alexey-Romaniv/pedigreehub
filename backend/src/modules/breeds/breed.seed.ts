import { Breed } from './breed.model'
import { BREEDS_DATA } from './breeds.data'

/**
 * Синхронизация каталога пород с базой при старте сервера.
 * Upsert по `name` с $setOnInsert: недостающие породы досеиваются,
 * существующие записи (в т.ч. правки админа и флаг isActive) не трогаются.
 */
export const seedBreeds = async () => {
  try {
    const result = await Breed.bulkWrite(
      BREEDS_DATA.map((breed) => ({
        updateOne: {
          filter: { name: breed.name },
          update: { $setOnInsert: { ...breed, isActive: true } },
          upsert: true,
        },
      })),
      { ordered: false }
    )

    if (result.upsertedCount > 0) {
      console.log(`Seeded ${result.upsertedCount} new breeds (${BREEDS_DATA.length} in catalog)`)
    } else {
      console.log(`Breeds up to date (${BREEDS_DATA.length} in catalog)`)
    }
  } catch (error) {
    console.error('Error seeding breeds:', error)
    throw error
  }
}
