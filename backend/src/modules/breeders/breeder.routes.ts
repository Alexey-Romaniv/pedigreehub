import { Router } from 'express'
import { breederController } from './breeder.controller'
import { uploadDocument, uploadImage } from '../../middleware/upload.middleware'
import { authMiddleware, breederMiddleware, adminMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// PROTECTED роуты (для заводчика) - ВАЖНО: до /:id

/**
 * @openapi
 * /breeders/me:
 *   get:
 *     tags: [Breeders]
 *     summary: Mój profil hodowcy
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profil hodowcy zalogowanego użytkownika
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/me', authMiddleware, breederMiddleware, breederController.getMyProfile)

/**
 * @openapi
 * /breeders/me/stats:
 *   get:
 *     tags: [Breeders]
 *     summary: Statystyki hodowcy (dashboard)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Statystyki ogłoszeń i profilu
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/me/stats', authMiddleware, breederMiddleware, breederController.getMyStats)

/**
 * @openapi
 * /breeders/me:
 *   patch:
 *     tags: [Breeders]
 *     summary: Aktualizacja mojego profilu hodowcy
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kennelName: { type: string }
 *               region: { type: string, example: "mazowieckie" }
 *               city: { type: string }
 *               address: { type: string }
 *               description: { type: string }
 *               website: { type: string }
 *               socialLinks: { type: object }
 *               breeds: { type: array, items: { type: string }, description: "Tablica ID ras" }
 *     responses:
 *       200:
 *         description: Zaktualizowany profil
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/me', authMiddleware, breederMiddleware, breederController.updateMyProfile)

/**
 * @openapi
 * /breeders/me/documents/zkwp:
 *   post:
 *     tags: [Breeders]
 *     summary: Przesłanie certyfikatu ZKwP
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary, description: "PDF/JPG/PNG/WebP" }
 *     responses:
 *       201:
 *         description: Dokument przesłany
 *       400:
 *         description: Brak pliku lub nieprawidłowy format
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/documents/zkwp', authMiddleware, breederMiddleware, uploadDocument, breederController.uploadZkwpDocument)

/**
 * @openapi
 * /breeders/me/documents/identity:
 *   post:
 *     tags: [Breeders]
 *     summary: Przesłanie dokumentu tożsamości
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary, description: "PDF/JPG/PNG/WebP" }
 *     responses:
 *       201:
 *         description: Dokument przesłany
 *       400:
 *         description: Brak pliku lub nieprawidłowy format
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/documents/identity', authMiddleware, breederMiddleware, uploadDocument, breederController.uploadIdentityDocument)

/**
 * @openapi
 * /breeders/me/verify-nip:
 *   post:
 *     tags: [Breeders]
 *     summary: Weryfikacja NIP w Białej Liście VAT
 *     description: Sprawdza NIP w rejestrze Ministerstwa Finansów i zapisuje wynik w profilu.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nip]
 *             properties:
 *               nip: { type: string, example: "5252248481" }
 *     responses:
 *       200:
 *         description: Wynik weryfikacji NIP
 *       400:
 *         description: Brak NIP lub nieprawidłowy format
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/verify-nip', authMiddleware, breederMiddleware, breederController.verifyNIP)

/**
 * @openapi
 * /breeders/me/photos:
 *   post:
 *     tags: [Breeders]
 *     summary: Przesłanie zdjęcia hodowli (max 10)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary, description: "Obraz JPG/PNG/WebP" }
 *     responses:
 *       201:
 *         description: "Zwraca { url } przesłanego zdjęcia"
 *       400:
 *         description: Brak pliku lub przekroczony limit 10 zdjęć
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Breeders]
 *     summary: Usunięcie zdjęcia hodowli
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url: { type: string, description: "URL zdjęcia do usunięcia" }
 *     responses:
 *       200:
 *         description: Zdjęcie usunięte
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/me/photos', authMiddleware, breederMiddleware, uploadImage, breederController.uploadKennelPhoto)
router.delete('/me/photos', authMiddleware, breederMiddleware, breederController.removeKennelPhoto)

/**
 * @openapi
 * /breeders/me/breeding-dogs:
 *   post:
 *     tags: [Breeders]
 *     summary: Dodanie reproduktora (psa hodowlanego)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               pedigreeNumber: { type: string }
 *               pedigreeDocumentId: { type: string, description: "ID wcześniej przesłanego dokumentu rodowodu" }
 *     responses:
 *       201:
 *         description: Zaktualizowana lista reproduktorów
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/me/breeding-dogs', authMiddleware, breederMiddleware, breederController.addBreedingDog)

/**
 * @openapi
 * /breeders/me/awards:
 *   post:
 *     tags: [Breeders]
 *     summary: Dodanie nagrody / osiągnięcia
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               year: { type: number, example: 2024 }
 *               documentId: { type: string, description: "ID dokumentu potwierdzającego" }
 *     responses:
 *       201:
 *         description: Zaktualizowana lista nagród
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/me/awards', authMiddleware, breederMiddleware, breederController.addAward)

// PUBLIC роуты

/**
 * @openapi
 * /breeders:
 *   get:
 *     tags: [Breeders]
 *     summary: Publiczna lista zweryfikowanych hodowców
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: region
 *         schema: { type: string, example: "mazowieckie" }
 *       - in: query
 *         name: breed
 *         schema: { type: string, description: "ID rasy" }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Wyszukiwanie po nazwie hodowli" }
 *     responses:
 *       200:
 *         description: Lista hodowców z paginacją
 */
router.get('/', breederController.getList)

/**
 * @openapi
 * /breeders/{id}:
 *   get:
 *     tags: [Breeders]
 *     summary: Publiczny profil hodowcy
 *     description: Dane prywatne (NIP, dokument tożsamości) są ukryte.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Profil hodowcy
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', breederController.getPublicProfile)

export const breederRoutes = router

// ADMIN роуты

const adminRouter = Router()

adminRouter.use(authMiddleware, adminMiddleware)

/**
 * @openapi
 * /admin/breeders/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Kolejka hodowców oczekujących na weryfikację
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista hodowców z paginacją
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get('/pending', breederController.getPendingVerification)

/**
 * @openapi
 * /admin/breeders/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Zatwierdzenie hodowcy (status verified)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Zaktualizowany hodowca
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/approve', breederController.approveBreeder)

/**
 * @openapi
 * /admin/breeders/{id}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Odrzucenie hodowcy z podaniem powodu
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, description: "Powód odrzucenia" }
 *     responses:
 *       200:
 *         description: Zaktualizowany hodowca
 *       400:
 *         description: Brak powodu odrzucenia
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.post('/:id/reject', breederController.rejectBreeder)

/**
 * @openapi
 * /admin/breeders/{id}/verify-identity:
 *   post:
 *     tags: [Admin]
 *     summary: Potwierdzenie tożsamości hodowcy
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Zaktualizowany hodowca
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/verify-identity', breederController.verifyIdentity)

/**
 * @openapi
 * /admin/breeders/{id}/verify-breeding-dog/{dogIndex}:
 *   post:
 *     tags: [Admin]
 *     summary: Weryfikacja reproduktora hodowcy
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: dogIndex
 *         required: true
 *         schema: { type: integer, description: "Indeks psa na liście reproduktorów" }
 *     responses:
 *       200:
 *         description: Zaktualizowany hodowca
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/verify-breeding-dog/:dogIndex', breederController.verifyBreedingDog)

/**
 * @openapi
 * /admin/breeders/{id}/verify-award/{awardIndex}:
 *   post:
 *     tags: [Admin]
 *     summary: Weryfikacja nagrody hodowcy
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: awardIndex
 *         required: true
 *         schema: { type: integer, description: "Indeks nagrody na liście" }
 *     responses:
 *       200:
 *         description: Zaktualizowany hodowca
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.post('/:id/verify-award/:awardIndex', breederController.verifyAward)

export const adminBreederRoutes = adminRouter
