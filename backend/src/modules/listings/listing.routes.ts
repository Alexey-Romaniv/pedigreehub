import { Router, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { listingController } from './listing.controller'
import { uploadListingFiles } from '../../middleware/upload.middleware'
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Лимит на создание объявлений: ставится ПОСЛЕ authMiddleware,
// поэтому ключ — userId (per-user, а не per-IP)
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId as string,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Za dużo prób utworzenia ogłoszenia. Spróbuj ponownie później',
    },
  },
})

// Публичные роуты (не требуют авторизации)

/**
 * @openapi
 * /listings:
 *   get:
 *     tags: [Listings]
 *     summary: Publiczny katalog ogłoszeń
 *     description: >
 *       Zwraca tylko ogłoszenia active + verified. Paginacja w polu pagination.
 *       Wewnętrzne autoChecks nie są zwracane — zamiast nich pole zkwpVerified
 *       (mikroczip znaleziony w publicznej bazie ZKwP wraz z rozpoznanymi danymi psa;
 *       odpowiedź o nierozpoznanej strukturze nie daje tej flagi).
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: breed, schema: { type: string }, description: "ObjectId rasy" }
 *       - { in: query, name: breederId, schema: { type: string }, description: "ObjectId profilu hodowcy" }
 *       - { in: query, name: region, schema: { type: string }, description: "Województwo, np. mazowieckie" }
 *       - { in: query, name: priceMin, schema: { type: number } }
 *       - { in: query, name: priceMax, schema: { type: number } }
 *       - { in: query, name: gender, schema: { type: string, enum: [male, female] } }
 *       - { in: query, name: sort, schema: { type: string, enum: [newest, price_asc, price_desc] } }
 *     responses:
 *       200:
 *         description: "Lista ogłoszeń: { success, data, pagination }"
 *       400:
 *         description: Nieprawidłowy identyfikator rasy lub hodowcy
 */
router.get('/', listingController.getPublicListings as RequestHandler)

// Создание объявления (только для заводчиков)

/**
 * @openapi
 * /listings:
 *   post:
 *     tags: [Listings]
 *     summary: Utworzenie ogłoszenia (tylko hodowca)
 *     description: >
 *       Multipart/form-data. Pola tekstowe przychodzą jako stringi — wartości logiczne jako 'true'/'false',
 *       pola JSON (fatherTitles, motherTitles, videos) jako zserializowane stringi.
 *       Wymagane minimum 3 zdjęcia szczeniaka (photos).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [breed, title, description, price, birthDate, gender, photos]
 *             properties:
 *               breed: { type: string, description: "ObjectId rasy" }
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: string, example: "3500" }
 *               currency: { type: string, default: PLN }
 *               puppyName: { type: string }
 *               birthDate: { type: string, format: date }
 *               gender: { type: string, enum: [male, female] }
 *               color: { type: string }
 *               microchipNumber: { type: string, description: "15 cyfr wg ISO 11784/85" }
 *               hasPedigree: { type: string, enum: ['true', 'false'] }
 *               hasVetPassport: { type: string, enum: ['true', 'false'] }
 *               hasMetric: { type: string, enum: ['true', 'false'] }
 *               fatherName: { type: string }
 *               fatherPedigreeNumber: { type: string }
 *               fatherTitles: { type: string, description: "JSON array jako string" }
 *               motherName: { type: string }
 *               motherPedigreeNumber: { type: string }
 *               motherTitles: { type: string, description: "JSON array jako string" }
 *               videos: { type: string, description: "JSON array URL-i jako string" }
 *               status: { type: string, enum: [draft, pending], default: draft }
 *               photos: { type: array, items: { type: string, format: binary }, description: "3–10 zdjęć szczeniaka (JPG/PNG/WebP)" }
 *               fatherPhoto: { type: string, format: binary }
 *               motherPhoto: { type: string, format: binary }
 *               pedigreeDocument: { type: string, format: binary, description: "PDF lub obraz, wymagany gdy hasPedigree='true'" }
 *               vetPassportDocument: { type: string, format: binary }
 *               metricDocument: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Utworzono ogłoszenie
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authMiddleware, createListingLimiter, uploadListingFiles, listingController.create as RequestHandler)

// Мои объявления (только для заводчиков) - ДО /:id чтобы не конфликтовало

/**
 * @openapi
 * /listings/my:
 *   get:
 *     tags: [Listings]
 *     summary: Moje ogłoszenia (tylko hodowca)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [draft, pending, active, rejected, sold, reserved, archived] } }
 *     responses:
 *       200:
 *         description: Lista ogłoszeń hodowcy
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/my', authMiddleware, listingController.getMyListings as RequestHandler)

// Получение объявления по ID: публичное для active+verified,
// черновики/прочие статусы видят только владелец и админ (токен опционален)

/**
 * @openapi
 * /listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Szczegóły ogłoszenia
 *     description: >
 *       Publicznie dostępne tylko dla ogłoszeń active + verified.
 *       Pozostałe statusy widzi wyłącznie właściciel lub administrator (token opcjonalny).
 *       Publiczne wyświetlenia zwiększają licznik viewsCount.
 *       Odpowiedź publiczna zawiera pole zkwpVerified (mikroczip znaleziony w bazie ZKwP)
 *       i ukrywa autoChecks; właściciel i admin dostają pełne autoChecks (w tym autoChecks.zkwpChip).
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Dane ogłoszenia
 *       404:
 *         description: Ogłoszenie nie istnieje albo nie jest publiczne, a pytający nie jest właścicielem (nie ujawnia istnienia rekordu)
 */
router.get('/:id', optionalAuthMiddleware, listingController.getById as RequestHandler)

// Обновление объявления

/**
 * @openapi
 * /listings/{id}:
 *   patch:
 *     tags: [Listings]
 *     summary: Aktualizacja ogłoszenia (właściciel)
 *     description: Aktualizacja pól tekstowych (bez plików). JSON body z polami do zmiany.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Zaktualizowane ogłoszenie
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', authMiddleware, uploadListingFiles, listingController.update as RequestHandler)

// Изменение статуса

/**
 * @openapi
 * /listings/{id}/status:
 *   patch:
 *     tags: [Listings]
 *     summary: Zmiana statusu ogłoszenia (właściciel)
 *     description: >
 *       Typowe przejścia: draft→pending (wysłanie do moderacji, ustawia publishedAt i verificationStatus=pending),
 *       active→reserved/sold/archived. Status sold ustawia soldAt.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [draft, pending, active, rejected, sold, reserved, archived] }
 *     responses:
 *       200:
 *         description: Ogłoszenie ze zmienionym statusem
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', authMiddleware, listingController.updateStatus as RequestHandler)

// Удаление объявления

/**
 * @openapi
 * /listings/{id}:
 *   delete:
 *     tags: [Listings]
 *     summary: Usunięcie ogłoszenia (właściciel)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Ogłoszenie usunięte
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authMiddleware, listingController.delete as RequestHandler)

// Admin роуты (отдельный роутер)
const adminRouter = Router()
adminRouter.use(authMiddleware, adminMiddleware)

/**
 * @openapi
 * /admin/listings/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Lista ogłoszeń do moderacji
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, active, rejected, all] } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Lista ogłoszeń z paginacją
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/pending', listingController.getModerationListings as RequestHandler)

/**
 * @openapi
 * /admin/listings/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Szczegóły ogłoszenia dla administratora (dowolny status)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Dane ogłoszenia
 *       404:
 *         description: Ogłoszenie nie istnieje albo nie jest publiczne, a pytający nie jest właścicielem (nie ujawnia istnienia rekordu)
 */
adminRouter.get('/:id', listingController.getByIdForAdmin as RequestHandler)

/**
 * @openapi
 * /admin/listings/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Zatwierdzenie ogłoszenia (verificationStatus=verified)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Zatwierdzone ogłoszenie
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/approve', listingController.approveListing as RequestHandler)

/**
 * @openapi
 * /admin/listings/{id}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Odrzucenie ogłoszenia z podaniem powodu
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, description: "Powód odrzucenia" }
 *     responses:
 *       200:
 *         description: Odrzucone ogłoszenie
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/reject', listingController.rejectListing as RequestHandler)

export const listingRoutes = router
export const adminListingRoutes = adminRouter
