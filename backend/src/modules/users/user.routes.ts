import { Router, RequestHandler } from 'express'
import { userController } from './user.controller'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware'
import { uploadAvatar } from '../../middleware/upload.middleware'

// Роуты личного кабинета (ustawienia konta)
const router = Router()
router.use(authMiddleware)

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Aktualizacja danych własnego konta
 *     description: Zmiana imienia, nazwiska i telefonu. Wszystkie pola opcjonalne, ale przynajmniej jedno musi być podane.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, minLength: 2 }
 *               lastName: { type: string, minLength: 2 }
 *               phone: { type: string, example: "+48123456789" }
 *     responses:
 *       200:
 *         description: Zaktualizowany profil użytkownika
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/me', userController.updateMe as RequestHandler)

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Przesłanie zdjęcia profilowego
 *     description: Plik w polu `avatar` (JPG/PNG/WebP, maks. 2MB). Poprzednie zdjęcie jest usuwane.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Zaktualizowany profil z nowym adresem zdjęcia
 *       400:
 *         description: Brak pliku, nieobsługiwany format lub plik za duży
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Users]
 *     summary: Usunięcie zdjęcia profilowego
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profil bez zdjęcia (wracają inicjały)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/avatar', uploadAvatar, userController.uploadAvatar as RequestHandler)
router.delete('/me/avatar', userController.removeAvatar as RequestHandler)

// Admin роуты
const adminRouter = Router()
adminRouter.use(authMiddleware, adminMiddleware)

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lista użytkowników (panel admina)
 *     description: Wyszukiwanie po e-mailu/imieniu/nazwisku, filtry roli i blokady, paginacja. Dla hodowców dołączane są kennelName i status weryfikacji.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: role, schema: { type: string, enum: [user, breeder, admin] } }
 *       - { in: query, name: search, schema: { type: string }, description: "Szuka w e-mailu, imieniu i nazwisku" }
 *       - { in: query, name: isBlocked, schema: { type: boolean } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Lista użytkowników z paginacją
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/', userController.getUsers as RequestHandler)

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Karta użytkownika (panel admina)
 *     description: >
 *       Dane konta, powiązana hodowla oraz aktywność: liczba ogłoszeń w rozbiciu
 *       na statusy, zapytania (jako kupujący i jako hodowca), opinie, ulubione
 *       i dokumenty. Dodatkowo 5 ostatnich ogłoszeń i 5 ostatnich zapytań.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Karta użytkownika
 *       400:
 *         description: Nieprawidłowy identyfikator (INVALID_ID)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.get('/:id', userController.getUserDetails as RequestHandler)

/**
 * @openapi
 * /admin/users/{id}/block:
 *   post:
 *     tags: [Admin]
 *     summary: Zablokowanie użytkownika
 *     description: Unieważnia sesje (refresh token) blokowanego. Nie można zablokować własnego konta (CANNOT_BLOCK_SELF) ani innego administratora (CANNOT_BLOCK_ADMIN).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "Użytkownik zablokowany: { id, email, isBlocked: true }"
 *       400:
 *         description: Nieprawidłowe ID lub próba zablokowania własnego konta
 *       403:
 *         description: Nie można zablokować administratora (CANNOT_BLOCK_ADMIN)
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/block', userController.blockUser as RequestHandler)

/**
 * @openapi
 * /admin/users/{id}/unblock:
 *   post:
 *     tags: [Admin]
 *     summary: Odblokowanie użytkownika
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "Użytkownik odblokowany: { id, email, isBlocked: false }"
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/unblock', userController.unblockUser as RequestHandler)

export const userRoutes = router
export const adminUserRoutes = adminRouter
