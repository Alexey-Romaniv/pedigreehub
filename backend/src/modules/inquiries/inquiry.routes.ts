import { Router, RequestHandler } from 'express'
import { inquiryController } from './inquiry.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Все роуты требуют авторизации
router.use(authMiddleware)

// Отправка запроса (покупатель)

/**
 * @openapi
 * /inquiries:
 *   post:
 *     tags: [Inquiries]
 *     summary: Wysłanie zapytania do ogłoszenia (kupujący)
 *     description: Dozwolone tylko jedno aktywne zapytanie na parę kupujący↔ogłoszenie. Ogłoszenie musi być aktywne i zweryfikowane; nie można pytać o własne ogłoszenie (OWN_LISTING).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId, message]
 *             properties:
 *               listingId: { type: string }
 *               message: { type: string, minLength: 10, maxLength: 2000 }
 *               contactPhone: { type: string, example: "+48123456789" }
 *     responses:
 *       201:
 *         description: "Zapytanie utworzone: { id, status: new }"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Masz już aktywne zapytanie do tego ogłoszenia (INQUIRY_EXISTS)
 */
router.post('/', inquiryController.create as RequestHandler)

// Мои запросы (покупатель) — ДО /:id чтобы не конфликтовало

/**
 * @openapi
 * /inquiries/my:
 *   get:
 *     tags: [Inquiries]
 *     summary: Zapytania wysłane przez zalogowanego kupującego
 *     description: Lista z paginacją (w każdej pozycji tylko ostatnia wiadomość wątku).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Lista zapytań z paginacją
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', inquiryController.getMy as RequestHandler)

// Входящие запросы (заводчик)

/**
 * @openapi
 * /inquiries/received:
 *   get:
 *     tags: [Inquiries]
 *     summary: Zapytania otrzymane przez hodowcę
 *     description: Wymaga profilu hodowcy powiązanego z zalogowanym użytkownikiem.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Lista zapytań z paginacją
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Profil hodowcy nie został znaleziony (BREEDER_NOT_FOUND)
 */
router.get('/received', inquiryController.getReceived as RequestHandler)

// Тред запроса

/**
 * @openapi
 * /inquiries/{id}:
 *   get:
 *     tags: [Inquiries]
 *     summary: Wątek zapytania (pełna korespondencja)
 *     description: Dostęp ma kupujący, hodowca-właściciel lub admin. Oznacza wiadomości jako przeczytane dla przeglądającej strony.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "Wątek zapytania (statusy: new|read|in_progress|closed|purchase_confirmed)"
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', inquiryController.getById as RequestHandler)

// Новое сообщение

/**
 * @openapi
 * /inquiries/{id}/messages:
 *   post:
 *     tags: [Inquiries]
 *     summary: Nowa wiadomość w wątku zapytania
 *     description: Kupujący lub hodowca. Pierwsza odpowiedź hodowcy zmienia status na in_progress. Nie można pisać w zamkniętym zapytaniu.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, minLength: 1, maxLength: 2000 }
 *     responses:
 *       200:
 *         description: Zaktualizowany wątek zapytania
 *       400:
 *         description: Zapytanie jest zamknięte (INQUIRY_CLOSED) lub błąd walidacji
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/messages', inquiryController.addMessage as RequestHandler)

// Закрытие запроса

/**
 * @openapi
 * /inquiries/{id}/status:
 *   patch:
 *     tags: [Inquiries]
 *     summary: Zamknięcie zapytania (kupujący lub hodowca)
 *     description: Dozwolona jest wyłącznie zmiana statusu na "closed". Nie można zamknąć zapytania z potwierdzonym zakupem (PURCHASE_CONFIRMED) ani już zamkniętego (ALREADY_CLOSED).
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
 *               status: { type: string, enum: [closed] }
 *     responses:
 *       200:
 *         description: "Zapytanie zamknięte: { id, status: closed }"
 *       400:
 *         description: Zapytanie już zamknięte lub z potwierdzonym zakupem
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', inquiryController.updateStatus as RequestHandler)

// Подтверждение покупки (только покупатель)

/**
 * @openapi
 * /inquiries/{id}/confirm-purchase:
 *   post:
 *     tags: [Inquiries]
 *     summary: Potwierdzenie zakupu (tylko kupujący)
 *     description: Możliwe wyłącznie ze statusu in_progress — dopiero po odpowiedzi hodowcy (inaczej 400 NO_BREEDER_REPLY). Odblokowuje możliwość wystawienia opinii.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "Zakup potwierdzony: { id, status: purchase_confirmed }"
 *       400:
 *         description: Brak odpowiedzi hodowcy (NO_BREEDER_REPLY), zakup już potwierdzony (ALREADY_CONFIRMED) lub zapytanie zamknięte
 *       403:
 *         description: Tylko kupujący może potwierdzić zakup (BUYER_ONLY)
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/confirm-purchase', inquiryController.confirmPurchase as RequestHandler)

export const inquiryRoutes = router
