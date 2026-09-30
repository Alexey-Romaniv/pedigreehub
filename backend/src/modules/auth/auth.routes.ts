import { Router, Request } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from './auth.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

export const authRoutes = Router()

// Лимит на повторную отправку письма: ставится ПОСЛЕ authMiddleware,
// поэтому ключ — userId (per-user, а не per-IP)
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.userId as string,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Za dużo próśb o link weryfikacyjny. Spróbuj ponownie za kilka minut',
    },
  },
})

// Лимиты против перебора паролей и токенов. Роуты публичные, поэтому ключ —
// IP (+ email, чтобы атакующий не блокировал вход другим пользователям с того же NAT)
const rateLimitedResponse = (message: string) => ({
  success: false,
  error: { code: 'RATE_LIMITED', message },
})

const emailKey = (req: Request) =>
  `${req.ip}:${String(req.body?.email ?? '').trim().toLowerCase()}`

// Считаются только неудачные попытки: 10 ошибок за 15 минут на пару IP + email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: emailKey,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedResponse('Za dużo nieudanych prób logowania. Spróbuj ponownie za 15 minut'),
})

// Каждый запрос шлёт письмо — ограничиваем и спам, и перебор адресов
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: emailKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedResponse('Za dużo próśb o reset hasła. Spróbuj ponownie za godzinę'),
})

// Перебор токена сброса: 10 неудачных попыток за 15 минут с одного IP
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedResponse('Za dużo prób ustawienia hasła. Spróbuj ponownie za 15 minut'),
})

// Публичные роуты

/**
 * @openapi
 * /auth/check-email:
 *   post:
 *     tags: [Auth]
 *     summary: Sprawdzenie, czy e-mail jest już zarejestrowany
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: "Wynik: { exists: boolean }"
 */
authRoutes.post('/check-email', authController.checkEmail)

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Rejestracja kupującego (rola user)
 *     description: Wysyła e-mail z linkiem weryfikacyjnym (TTL 24h).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, description: "Min. 8 znaków, wielka litera i cyfra" }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string, example: "+48123456789" }
 *     responses:
 *       201:
 *         description: Utworzono konto, zwraca użytkownika i tokeny
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
authRoutes.post('/register', authController.register)

/**
 * @openapi
 * /auth/register/breeder:
 *   post:
 *     tags: [Auth]
 *     summary: Rejestracja hodowcy (rola breeder) z profilem hodowli
 *     description: Tworzy konto + profil Breeder (kennelName, NIP, rasy). Weryfikacja NIP i zatwierdzenie przez administratora odbywa się później.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, kennelName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               kennelName: { type: string }
 *               nip: { type: string, example: "5252248481" }
 *               region: { type: string, example: "mazowieckie" }
 *               city: { type: string }
 *               breedNames: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Utworzono konto hodowcy, zwraca użytkownika i tokeny
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
authRoutes.post('/register/breeder', authController.registerBreeder)

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Logowanie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: "Zwraca { user, accessToken, refreshToken }"
 *       401:
 *         description: Nieprawidłowe dane logowania lub konto zablokowane (ACCOUNT_BLOCKED)
 *       429:
 *         description: 10 nieudanych prób w ciągu 15 minut (RATE_LIMITED)
 */
authRoutes.post('/login', loginLimiter, authController.login)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Odświeżenie access tokena
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nowa para tokenów
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRoutes.post('/refresh', authController.refreshToken)

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Wysłanie linku resetu hasła
 *     description: Zawsze zwraca 200 (nie ujawnia istnienia adresu). Link ważny 1h.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Zawsze sukces
 *       429:
 *         description: Więcej niż 5 próśb w ciągu godziny (RATE_LIMITED)
 */
authRoutes.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword)

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Ustawienie nowego hasła tokenem z e-maila
 *     description: Unieważnia wszystkie sesje (refresh tokeny). Token jednorazowy.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Hasło zmienione
 *       400:
 *         description: Token nieprawidłowy/wykorzystany lub hasło za słabe
 *       429:
 *         description: 10 nieudanych prób w ciągu 15 minut (RATE_LIMITED)
 */
authRoutes.post('/reset-password', resetPasswordLimiter, authController.resetPassword)

/**
 * @openapi
 * /auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Potwierdzenie adresu e-mail tokenem z wiadomości
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: E-mail potwierdzony
 *       400:
 *         description: Token nieprawidłowy lub przeterminowany (INVALID_VERIFICATION_TOKEN)
 */
authRoutes.get('/verify-email/:token', authController.verifyEmail)

// Защищённые роуты

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Dane zalogowanego użytkownika
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profil użytkownika
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRoutes.get('/me', authMiddleware, authController.me)

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Ponowne wysłanie linku weryfikacyjnego e-mail
 *     description: >
 *       Generuje nowy token (TTL 24h) i wysyła e-mail na adres zalogowanego użytkownika.
 *       Poprzedni link przestaje działać. Limit: 3 próby na 15 minut na użytkownika.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Link został wysłany ponownie
 *       400:
 *         description: E-mail jest już potwierdzony (EMAIL_ALREADY_VERIFIED)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Za dużo próśb (RATE_LIMITED)
 */
authRoutes.post(
  '/resend-verification',
  authMiddleware,
  resendVerificationLimiter,
  authController.resendVerification
)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Wylogowanie (unieważnienie refresh tokena)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Wylogowano
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRoutes.post('/logout', authMiddleware, authController.logout)

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Zmiana hasła z panelu użytkownika
 *     description: Wymaga podania aktualnego hasła. Unieważnia pozostałe sesje i zwraca nową parę tokenów dla bieżącej sesji.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8, description: "Min. 8 znaków, wielka litera i cyfra" }
 *     responses:
 *       200:
 *         description: "Hasło zmienione, zwraca { accessToken, refreshToken }"
 *       400:
 *         description: Nieprawidłowe aktualne hasło (INVALID_CURRENT_PASSWORD) lub słabe nowe hasło
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
authRoutes.post('/change-password', authMiddleware, authController.changePassword)
