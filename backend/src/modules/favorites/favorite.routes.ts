import { Router, RequestHandler } from 'express'
import { favoriteController } from './favorite.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Все роуты требуют авторизации
router.use(authMiddleware)

// ID избранного (для сердечек) — ДО /:listingId, чтобы не конфликтовало

/**
 * @openapi
 * /favorites/ids:
 *   get:
 *     tags: [Favorites]
 *     summary: Same ID ulubionych ogłoszeń (do zaznaczania serduszek)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tablica ID ogłoszeń
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/ids', favoriteController.getIds as RequestHandler)

// Список избранного с объявлениями

/**
 * @openapi
 * /favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Lista ulubionych ogłoszeń zalogowanego użytkownika
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Lista ulubionych z paginacją
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', favoriteController.getMy as RequestHandler)

// Добавить в избранное

/**
 * @openapi
 * /favorites/{listingId}:
 *   post:
 *     tags: [Favorites]
 *     summary: Dodanie ogłoszenia do ulubionych (idempotentne)
 *     description: 201 przy pierwszym dodaniu, 200 jeśli ogłoszenie było już w ulubionych.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: listingId, required: true, schema: { type: string } }
 *     responses:
 *       201:
 *         description: "Dodano: { listingId, favorite: true }"
 *       200:
 *         description: Już było w ulubionych
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/:listingId', favoriteController.add as RequestHandler)

// Убрать из избранного

/**
 * @openapi
 * /favorites/{listingId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Usunięcie ogłoszenia z ulubionych (idempotentne)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: listingId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "Usunięto: { listingId, favorite: false }"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:listingId', favoriteController.remove as RequestHandler)

export const favoriteRoutes = router
