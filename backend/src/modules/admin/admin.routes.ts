import { Router, RequestHandler } from 'express'
import { adminController } from './admin.controller'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware'

const adminRouter = Router()
adminRouter.use(authMiddleware, adminMiddleware)

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Statystyki platformy dla panelu admina
 *     description: "Agregaty: users (byRole, blocked, newLast7Days), listings (byStatus, publiclyVisible), breeders (pending/verified), moderationQueue (listings, breeders, documents), inquiries (total, purchasesConfirmed), reviews (total, avgRating)."
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Obiekt statystyk platformy
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/', adminController.getStats as RequestHandler)

export const adminStatsRoutes = adminRouter
