/**
 * Живая проверка интеграции с базой mikroczipów ZKwP (zkwp.pl/baza_chip.php).
 *
 *   yarn check-chip 616093712840517
 *   yarn check-chip 616093712840517 616000090000001   (несколько номеров подряд)
 *
 * Обращается к реальному сайту ZKwP через zkwp.service — тот же путь, которым
 * идёт проверка при отправке объявления на модерацию. База и формат ответа не
 * задокументированы, поэтому скрипт печатает и распознанный статус, и то, что
 * удалось разобрать из HTML.
 */
import 'dotenv/config'
import { zkwpService } from '../services/zkwp.service'
import { validateMicrochipFormat } from '../modules/listings/listing.validation'

const STATUS_HINT: Record<string, string> = {
  found: 'pies jest w bazie ZKwP — mocny pozytywny sygnał, publiczna pieczęć na ogłoszeniu',
  not_found: 'brak w bazie — sygnał neutralny (szczeniak mógł jeszcze nie trafić do bazy)',
  unavailable: 'baza niedostępna lub odpowiedź nierozpoznana — weryfikacji nie wykonano',
}

const main = async () => {
  const chips = process.argv.slice(2)

  if (chips.length === 0) {
    console.error('Podaj numer mikroczipa: yarn check-chip 616093712840517')
    process.exit(1)
  }

  for (const chip of chips) {
    console.log(`\nMikroczip: ${chip}`)

    // Формат проверяется тем же валидатором, что и при создании объявления
    const format = validateMicrochipFormat(chip.replace(/[\s-]/g, ''))
    console.log(`  Format:  ${format.valid ? 'OK' : `BŁĄD — ${format.error}`}`)

    // Numer o złym formacie nie jest wysyłany do ZKwP — w aplikacji odrzuca go
    // walidacja ogłoszenia, więc nie pokazujemy tu statusu z bazy
    if (!format.valid) {
      console.log('  Status:  — (zapytanie do ZKwP nie zostało wysłane)')
      continue
    }

    const startedAt = Date.now()
    const result = await zkwpService.checkMicrochip(chip)
    const elapsed = Date.now() - startedAt

    console.log(`  Status:  ${result.status} (${elapsed} ms)`)
    console.log(`           ${STATUS_HINT[result.status] ?? ''}`)

    if (result.error) {
      console.log(`  Błąd:    ${result.error}`)
    }

    if (result.dog) {
      const { rawText, ...fields } = result.dog
      for (const [key, value] of Object.entries(fields)) {
        console.log(`  ${key.padEnd(8)} ${value}`)
      }
      if (rawText) {
        console.log('  rawText  (struktury nie rozpoznano, dane surowe dla admina):')
        console.log(`           ${rawText.replace(/\n/g, '\n           ')}`)
      }
    }
  }

  console.log(
    '\nUwaga: status unavailable przy pierwszym uruchomieniu oznacza problem z siecią' +
      '\nlub zmianę strony ZKwP — sprawdź, czy https://zkwp.pl/baza_chip.php otwiera się w przeglądarce.'
  )
}

main()
