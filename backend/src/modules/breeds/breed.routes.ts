import { Router } from 'express'
import { breedController } from './breed.controller'

export const breedRoutes = Router()

/**
 * @openapi
 * /breeds:
 *   get:
 *     tags: [Breeds]
 *     summary: Lista aktywnych ras psów
 *     description: Publiczny endpoint. Zwraca rasy posortowane alfabetycznie (pola _id, name, nameEn).
 *     responses:
 *       200:
 *         description: Tablica ras (może być pusta)
 */
breedRoutes.get('/', breedController.getList)

