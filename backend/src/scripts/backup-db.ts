import 'dotenv/config'
import fs from 'node:fs'
import mongoose from 'mongoose'
import { env } from '../config/env'

/**
 * Дамп всех коллекций в один JSON — страховка перед сидом/чисткой прод-базы.
 * Запуск: yarn backup-db [ścieżka.json]
 *         MONGODB_URI="$(grep '^MONGODB_URI=' .env.prod | cut -d= -f2-)" yarn backup-db prod.json
 */

async function backup() {
  const target = process.argv[2] ?? `backup-${new Date().toISOString().slice(0, 10)}.json`
  await mongoose.connect(env.MONGODB_URI)
  const db = mongoose.connection.db!

  const dump: Record<string, unknown[]> = {}
  for (const { name } of await db.listCollections().toArray()) {
    dump[name] = await db.collection(name).find({}).toArray()
    console.log(`  ${name}: ${dump[name].length}`)
  }

  fs.writeFileSync(target, JSON.stringify(dump, null, 2))
  console.log(`\nKopia zapasowa: ${target}`)
  await mongoose.disconnect()
}

backup().catch((error) => {
  console.error('Błąd kopii zapasowej:', error)
  process.exit(1)
})
