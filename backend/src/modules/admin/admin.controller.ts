import { Request, Response, NextFunction } from 'express'
import { adminService } from './admin.service'

export const adminController = {
  /**
   * Статистика платформы
   * GET /api/admin/stats
   */
  getStats: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getStats()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  },
}
