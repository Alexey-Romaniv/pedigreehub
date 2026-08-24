/**
 * Проверка конфигурации SMTP: соединение + реальная отправка письма.
 *
 *   yarn test-email adres@przyklad.pl
 *
 * Без настроенных SMTP_HOST/SMTP_USER/SMTP_PASS сервис работает в dev-режиме
 * (письма только в консоль) — скрипт об этом сообщает и выходит с ошибкой.
 */
import 'dotenv/config'
import { emailService } from '../services/email.service'
import { env } from '../config/env'

const main = async () => {
  const to = process.argv[2]

  if (!to) {
    console.error('Podaj adres odbiorcy: yarn test-email adres@przyklad.pl')
    process.exit(1)
  }

  console.log('Konfiguracja:')
  console.log(`  SMTP_HOST:    ${env.SMTP_HOST || '(brak)'}`)
  console.log(`  SMTP_PORT:    ${env.SMTP_PORT || '(brak, domyślnie 587)'}`)
  console.log(`  SMTP_USER:    ${env.SMTP_USER || '(brak)'}`)
  console.log(`  SMTP_PASS:    ${env.SMTP_PASS ? '***' : '(brak)'}`)
  console.log(`  EMAIL_FROM:   ${env.EMAIL_FROM || 'noreply@pedigreehub.pl (domyślny)'}`)
  console.log(`  FRONTEND_URL: ${env.FRONTEND_URL}`)
  console.log('')

  if (!emailService.isConfigured) {
    console.error('SMTP nie jest skonfigurowany — uzupełnij SMTP_HOST, SMTP_USER i SMTP_PASS w .env')
    process.exit(1)
  }

  console.log('Sprawdzanie połączenia z serwerem SMTP...')
  const connection = await emailService.verifyConnection()
  if (!connection.ok) {
    console.error(`Połączenie nieudane: ${connection.error}`)
    process.exit(1)
  }
  console.log('Połączenie OK')

  console.log(`Wysyłanie wiadomości testowej na ${to}...`)
  try {
    await emailService.sendTestEmail(to)
    console.log('Wysłano. Sprawdź skrzynkę (także folder spam).')
  } catch (error) {
    console.error('Błąd wysyłki:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
