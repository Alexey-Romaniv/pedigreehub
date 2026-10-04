# PedigreeHub

Platforma weryfikowanej sprzedaży psów rasowych: aplikacja webowa z wielopoziomową weryfikacją hodowców i dokumentów (praca inżynierska, Uniwersytet Pomorski w Słupsku).

- Aplikacja: https://pedigreehub-2of.pages.dev
- REST API: https://p01--pedigreehub--7c56cq6kyfkf.code.run
- Dokumentacja API (Swagger UI): https://p01--pedigreehub--7c56cq6kyfkf.code.run/api-docs

## Technologie

- **Serwer:** Node.js 22, Express 4, TypeScript, MongoDB 7 + Mongoose 8, Zod, JWT, Cloudinary, Nodemailer, Swagger UI
- **Klient:** React 19, TypeScript, Vite, Chakra UI v3, TanStack Query, Zustand, React Hook Form
- **Testy:** Vitest + Supertest

## Wymagania

- Node.js 22 lub nowszy
- Yarn 1.x (`npm i -g yarn`)
- Docker (baza MongoDB w kontenerze)

## Uruchomienie lokalne

### 1. Baza danych

```bash
docker compose up -d
```

Uruchamia MongoDB 7 na porcie 27017 (kontener `pedigreehub-mongo`, dane w wolumenie `mongo-data`).

### 2. Serwer (REST API)

```bash
cd backend
cp env.example .env
yarn install
yarn dev
```

API działa pod adresem http://localhost:3000, dokumentacja Swagger pod http://localhost:3000/api-docs. Przy pierwszym uruchomieniu automatycznie wypełnia się słownik ras.

W pliku `.env` obowiązkowe są `MONGODB_URI` i `JWT_SECRET` (wartości z `env.example` wystarczą lokalnie). Do przesyłania zdjęć i dokumentów potrzebne są klucze Cloudinary. SMTP jest opcjonalne: bez niego wiadomości e-mail, w tym linki weryfikacyjne, trafiają do konsoli serwera.

### 3. Dane demonstracyjne i konto administratora

W drugim terminalu:

```bash
cd backend
yarn create-admin admin@pedigreehub.pl <hasło>
yarn seed-demo
```

`seed-demo` tworzy trzy zweryfikowane hodowle z ogłoszeniami, kupujących, historię sprzedaży z opiniami i zapytania we wszystkich statusach. Zdjęcia demonstracyjne są już w Cloudinary, więc do przeglądania platformy klucze nie są potrzebne. Skrypt jest idempotentny: usuwa i tworzy wyłącznie własne dane.

### 4. Klient

```bash
cd frontend
cp env.example .env
yarn install
yarn dev
```

Aplikacja działa pod adresem http://localhost:5173 (jeśli port jest zajęty, Vite wybiera kolejny wolny i podaje go w konsoli).

## Testy i pomiary

```bash
cd backend
yarn test              # 79 testów; wymaga uruchomionej bazy z kroku 1 (osobna baza pedigreehub-test)
yarn bench-catalog     # czas odpowiedzi katalogu na stronę 100 ogłoszeń (osobna baza pedigreehub-bench)
```

Kontrola typów i analiza statyczna: `yarn build` oraz `yarn lint` w katalogach `backend` i `frontend`.

## Skrypty pomocnicze (`backend`)

| Polecenie | Działanie |
|---|---|
| `yarn create-admin [email] [hasło]` | Konto administratora |
| `yarn seed-demo` | Dane demonstracyjne |
| `yarn seed-zkwp-cases [--clean]` | Pięć ogłoszeń ze wszystkimi wynikami sprawdzenia w bazie ZKwP |
| `yarn check-chip <numer>` | Sprawdzenie numeru mikroczipa w bazie ZKwP z wiersza poleceń |
| `yarn test-email <adres>` | Kontrola konfiguracji SMTP |
| `yarn backup-db` | Kopia zapasowa bazy |
| `yarn bench-catalog [liczba]` | Pomiar czasu odpowiedzi katalogu |

## Struktura repozytorium

```
backend/    REST API: src/modules/<moduł> (model, serwis, kontroler, trasy, walidacja),
            src/services (Biała Lista VAT, baza ZKwP, Cloudinary, e-mail), tests/
frontend/   aplikacja SPA (Feature-Sliced Design): src/app, pages, modules, shared, store
docs/       źródła i licencje zdjęć demo
```

## Wdrożenie

Klient: Cloudflare Pages, serwer: Northflank (obraz z `backend/Dockerfile`), baza: MongoDB Atlas.
