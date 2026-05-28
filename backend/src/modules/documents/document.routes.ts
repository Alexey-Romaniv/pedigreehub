import { Router } from 'express'
import { documentController } from './document.controller'
import { uploadDocument } from '../../middleware/upload.middleware'
import { authMiddleware, adminMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Защищённые роуты (требуют авторизации)
router.use(authMiddleware)

// Загрузка документа

/**
 * @openapi
 * /documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Przesłanie dokumentu do weryfikacji
 *     description: Multipart/form-data. Plik w polu `file` (PDF/JPG/PNG/WebP, max 10MB). Dokument trafia do moderacji ze statusem pending.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, type]
 *             properties:
 *               file: { type: string, format: binary }
 *               type:
 *                 type: string
 *                 enum: [zkwp_certificate, identity, pedigree, award, kennel_photo, puppy_photo, vet_passport, metric, other]
 *     responses:
 *       201:
 *         description: Dokument przesłany
 *       400:
 *         description: Brak pliku, niedozwolony format lub brak typu dokumentu
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/upload', uploadDocument, documentController.upload)

// Мои документы

/**
 * @openapi
 * /documents/my:
 *   get:
 *     tags: [Documents]
 *     summary: Moje dokumenty
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [zkwp_certificate, identity, pedigree, award, kennel_photo, puppy_photo, vet_passport, metric, other]
 *     responses:
 *       200:
 *         description: Lista dokumentów użytkownika
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', documentController.getMyDocuments)

// Получение документа по ID

/**
 * @openapi
 * /documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Szczegóły dokumentu (właściciel lub admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Dane dokumentu
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', documentController.getById)

// Удаление документа

/**
 * @openapi
 * /documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Usunięcie dokumentu (właściciel)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Dokument usunięty
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', documentController.delete)

export const documentRoutes = router

// Admin роуты (отдельный роутер)

const adminRouter = Router()

adminRouter.use(authMiddleware, adminMiddleware)

// Документы на модерацию

/**
 * @openapi
 * /admin/documents/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Dokumenty oczekujące na moderację
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [zkwp_certificate, identity, pedigree, award, kennel_photo, puppy_photo, vet_passport, metric, other]
 *     responses:
 *       200:
 *         description: Lista dokumentów z paginacją
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/pending', documentController.getPending)

// Одобрить документ

/**
 * @openapi
 * /admin/documents/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Zatwierdzenie dokumentu (status=approved)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Zatwierdzony dokument
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/approve', documentController.approve)

// Отклонить документ

/**
 * @openapi
 * /admin/documents/{id}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Odrzucenie dokumentu z podaniem powodu
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
 *         description: Odrzucony dokument
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/reject', documentController.reject)

export const adminDocumentRoutes = adminRouter
