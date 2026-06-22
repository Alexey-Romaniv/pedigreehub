import swaggerJsdoc from 'swagger-jsdoc'

// Спецификация собирается из JSDoc-аннотаций @openapi в файлах *.routes.ts
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PedigreeHub API',
      version: '0.1.0',
      description:
        'API platformy legalnej sprzedaży psów rasowych w Polsce. ' +
        'Weryfikacja hodowców (NIP / Biała Lista VAT) i ogłoszeń (mikroczip, rodowód ZKwP) — zatwierdzenie przez administratora.',
    },
    servers: [{ url: '/api', description: 'API root' }],
    tags: [
      { name: 'Auth', description: 'Rejestracja, logowanie, tokeny, e-mail' },
      { name: 'Breeders', description: 'Profile hodowców i weryfikacja' },
      { name: 'Listings', description: 'Ogłoszenia szczeniąt' },
      { name: 'Breeds', description: 'Słownik ras' },
      { name: 'Documents', description: 'Dokumenty weryfikacyjne' },
      { name: 'Inquiries', description: 'Zapytania i korespondencja kupujący–hodowca' },
      { name: 'Reviews', description: 'Opinie o hodowcach' },
      { name: 'Favorites', description: 'Ulubione ogłoszenia' },
      { name: 'Admin', description: 'Panel administratora (rola admin)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token z /auth/login w nagłówku Authorization',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Ogłoszenie nie zostało znalezione' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Brak lub nieprawidłowy token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Brak uprawnień',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Nie znaleziono',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        ValidationError: {
          description: 'Błąd walidacji',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },
  // Глобы и для tsx (src), и для собранного dist (tsc сохраняет комментарии)
  apis: ['src/modules/**/*.routes.ts', 'dist/modules/**/*.routes.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
