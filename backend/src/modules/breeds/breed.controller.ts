import { Request, Response, NextFunction } from 'express'
import { Breed } from './breed.model'

export const breedController = {
  /**
   * Получение списка активных пород
   * GET /api/breeds
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      // Польская collation, иначе названия с диакритикой (Łajka, Šarplaninac) сортируются в конец
      const breeds = await Breed.find({ isActive: true })
        .select('_id name nameEn')
        .sort({ name: 1 })
        .collation({ locale: 'pl' })
        .lean()

      // Если база пустая, возвращаем пустой массив (не ошибку)
      res.json({
        success: true,
        data: breeds || [],
      })
    } catch (error) {
      next(error)
    }
  },
}

