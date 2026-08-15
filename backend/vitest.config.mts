import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Оба файла работают с одной тестовой базой — последовательно
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/pedigreehub-test',
      JWT_SECRET: 'test-secret-not-for-production',
      FRONTEND_URL: 'http://localhost:5175',
      // Тесты не ходят на живой zkwp.pl; интеграционный тест включает
      // флаг точечно и мокает fetch (tests/listings.test.ts)
      ZKWP_CHECK_ENABLED: 'false',
    },
  },
})
