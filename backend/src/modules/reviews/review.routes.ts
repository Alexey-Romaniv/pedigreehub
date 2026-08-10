import { Router, RequestHandler } from 'express'
import { reviewController } from './review.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Публичный список отзывов заводчика

/**
 * @openapi
 * /reviews/breeder/{breederId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Publiczna lista opinii o hodowcy
 *     parameters:
 *       - { in: path, name: breederId, required: true, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Lista opinii z paginacją (autor tylko imię, nazwisko, avatar)
 *       400:
 *         description: Nieprawidłowy identyfikator hodowcy (INVALID_ID)
 */
router.get('/breeder/:breederId', reviewController.getForBreeder as RequestHandler)

// Право текущего пользователя на отзыв

/**
 * @openapi
 * /reviews/eligibility/{breederId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Czy zalogowany użytkownik może wystawić opinię hodowcy
 *     description: "Zwraca { canReview, reason? } — reason: NO_CONFIRMED_PURCHASE lub ALREADY_REVIEWED."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: breederId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "Wynik: { canReview: boolean, reason?: string }"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/eligibility/:breederId',
  authMiddleware,
  reviewController.getEligibility as RequestHandler
)

// Создание отзыва (после подтверждённой покупки)

/**
 * @openapi
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Wystawienie opinii hodowcy
 *     description: Możliwe tylko po zapytaniu ze statusem purchase_confirmed; jedna opinia na parę kupujący↔hodowca. Po zapisie przeliczany jest rating hodowcy.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [breederId, rating, text]
 *             properties:
 *               breederId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               text: { type: string, minLength: 10, maxLength: 2000 }
 *     responses:
 *       201:
 *         description: "Opinia utworzona: { id, rating }"
 *       403:
 *         description: Brak potwierdzonego zakupu (NO_CONFIRMED_PURCHASE)
 *       409:
 *         description: Opinia dla tego hodowcy została już wystawiona (ALREADY_REVIEWED)
 */
router.post('/', authMiddleware, reviewController.create as RequestHandler)

export const reviewRoutes = router
