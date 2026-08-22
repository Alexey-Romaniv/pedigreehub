# Деплой PedigreeHub (бесплатно)

## ✅ Актуальное состояние (2026-08-21)

| Часть | Адрес |
|---|---|
| Фронтенд | **https://pedigreehub-2of.pages.dev** (Cloudflare Pages, проект `pedigreehub-2of`) |
| Бэкенд | **https://p01--pedigreehub--7c56cq6kyfkf.code.run** (Northflank, Europe-West London) |
| Swagger | https://p01--pedigreehub--7c56cq6kyfkf.code.run/api-docs |
| База | MongoDB Atlas M0 `pedigreeCluster`, регион London |
| Репозиторий | https://github.com/Alexey-Romaniv/pedigreehub (публичный, CI на push в `main`) |

Проверено на проде: `/health` 200, каталог отдаёт 7 объявлений, логин выдаёт JWT,
preflight CORS 204, SPA-фолбэк на прямых ссылках, загрузка файла в Cloudinary.

Оба сервиса пересобираются автоматически при push в `main`.
Пароли и доступы — в локальном `ACCOUNTS.md` (не в репозитории).

### Грабли, на которые уже наступили

- **Northflank:** Build context обязан быть `/backend`, Dockerfile location — `/backend/Dockerfile`.
  При значениях по умолчанию (`/` и `/Dockerfile`) сборка падает: в корне монорепо нет `package.json`.
- **Northflank:** первый билд не стартует сам — нужно нажать **New build**. Дальше CI работает на каждый push.
- **Cloudflare Pages:** активирует Yarn 4, который отказывается ставить `yarn.lock` формата Yarn 1
  (`YN0028: lockfile would have been modified`). Лечится `"packageManager": "yarn@1.22.22"`
  в `frontend/package.json` (и/или переменной `YARN_VERSION=1.22.22`).
- **Cloudflare Pages:** имя `pedigreehub` было занято, проект получил суффикс — `pedigreehub-2of`.
  Поэтому CORS в `app.ts` матчит `pedigreehub*.pages.dev` вместе с preview-деплоями.
- **Адрес API** вшивается в бандл на этапе сборки. Лежит в `frontend/.env.production`,
  чтобы не зависеть от переменных в панели хостинга.

---

Документ описывает разворачивание проекта на бесплатных тарифах — с прицелом на защиту диплома,
где главное требование: **приложение должно отвечать мгновенно в любой момент, без «просыпания» сервера**.

## Из чего состоит деплой

| Часть | Где | Стоимость | Засыпает? |
|---|---|---|---|
| Frontend (Vite SPA → статика) | Cloudflare Pages *(или Vercel)* | бесплатно | нет, это CDN |
| Backend (Express) | Northflank *(варианты ниже)* | бесплатно | **нет** |
| MongoDB | MongoDB Atlas M0, регион London | бесплатно (512 MB) | пауза только после 60 дней простоя |
| Картинки/документы | Cloudinary | бесплатно (25 GB) | — |
| Почта | SMTP (Gmail app password / Brevo) | бесплатно | — |

> **Важно:** Vercel/Netlify Functions для бэкенда **не подходят** — там нет долгоживущего процесса,
> а лимит тела запроса (~4.5 MB) ломает загрузку фото через `multer` + multipart.
> Бэкенду нужен обычный контейнер/инстанс.

---

## Шаг 1. База данных — MongoDB Atlas

1. Создать бесплатный кластер **M0** на [cloud.mongodb.com](https://cloud.mongodb.com).
2. Регион — **London (aws eu-west-2)**, под проект Northflank в Europe-West (London).
   Бэкенд и БД обязаны быть в одном регионе, иначе каждый запрос ловит +50–100 мс.

> **Почему не бесплатная БД внутри Northflank:** она расходует ту же бесплатную аллокацию (~$3/мес),
> что и сервис бэкенда. Atlas M0 бесплатен отдельно и не тарифицируется — так риск случайного списания нулевой.

> **Про «Atlas мёртв» из `TZ.md`:** прошлый кластер отвалился не из-за DNS (SRV-запросы с машины
> резолвятся корректно — проверено), а потому что Atlas приостанавливает кластеры M0 после 60 дней
> простоя и со временем удаляет. Новый кластер работает нормально.
3. Database Access → создать пользователя с паролем.
4. Network Access → добавить `0.0.0.0/0` (бесплатные хостинги не дают статичных IP).
5. Скопировать строку подключения и дописать имя базы:
   `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/pedigreehub?retryWrites=true&w=majority`

Локальные данные при желании переносятся так:

```bash
mongodump --uri="mongodb://localhost:27017/pedigreehub" --out=./dump
mongorestore --uri="<ATLAS_URI>" --nsFrom="pedigreehub.*" --nsTo="pedigreehub.*" ./dump
```

Либо просто пересоздать демо-данные уже на проде — см. шаг 5.

---

## Шаг 2. Backend

В репозитории есть `backend/Dockerfile` (multi-stage, Node 22 Alpine) — он подходит для
Northflank, Cloud Run, Railway и собственного VPS.

### Вариант A — Northflank (рекомендуемый)

Бесплатный тариф даёт 2 сервиса, 1 БД и 2 cron-задания, и они **не засыпают**.
Регистрация возможна **без карты** — так надёжнее: если карта привязана и бесплатная
аллокация (~$3/мес) исчерпана, Northflank выставляет счёт и списывает автоматически.
Если карта уже добавлена — выставь низкий *billing threshold* в разделе Billing.

Репозиторий: **`Alexey-Romaniv/pedigreehub`**, ветка `main`.

1. В проекте: **Create Service → Combined service** (build + deploy в одном).
2. Подключить GitHub (Account settings → Git integrations), выбрать репозиторий и ветку `main`.
3. Build:
   - Build type: **Dockerfile**
   - Dockerfile path: `/backend/Dockerfile`
   - **Build context: `/backend`** — критично, иначе Docker не найдёт `package.json`
4. Resources: выбрать **самый маленький план** (≈0.2 vCPU / 512 MB) — только он влезает в бесплатную аллокацию.
5. Networking: порт `3000`, протокол HTTP, **публичный** — Northflank выдаст домен `*.code.run`.
6. Health check: HTTP GET `/health`, порт 3000.
7. Переменные окружения — шаг 4.

### Вариант B — Render + внешний пинг (без карты)

Free web service засыпает через 15 минут простоя и просыпается ~минуту. Лечится внешним пингом.

1. New → Web Service, root directory `backend`, build `yarn install && yarn build`, start `node dist/server.js`.
2. Переменные окружения — шаг 4.
3. На [cron-job.org](https://cron-job.org) завести задание: `GET https://<твой-домен>/health` каждые **10 минут**.

⚠️ Лимит Render — **750 instance-hours в месяц на весь workspace**. Круглосуточный пинг съедает ~730 ч,
на второй сервис уже не останется. Безопаснее ограничить расписание пинга окном 08:00–24:00 (~490 ч).

⚠️ Это не даёт стопроцентной гарантии: после передеплоя или пропущенного пинга первый запрос всё равно
будет ждать минуту. Для демо на защите вариант A надёжнее.

### Вариант C — Google Cloud Run

Карта обязательна, но free tier (2 млн запросов/мес) на дипломный проект не исчерпать.
Scale-to-zero остаётся, но холодный старт Node-контейнера — **1–3 секунды**, а не минута.

```bash
gcloud run deploy pedigreehub-api \
  --source=backend \
  --region=europe-central2 \
  --allow-unauthenticated \
  --set-env-vars="MONGODB_URI=...,JWT_SECRET=...,FRONTEND_URL=..."
```

Если холодный старт не нужен вовсе — `--min-instances=1`, но это уже платно (~$5–7/мес).

### Вариант D — Oracle Cloud Always Free

ARM-машина 4 vCPU / 24 GB бесплатно навсегда, туда же можно поставить и MongoDB.
Максимум контроля, но настройка руками: docker, nginx как reverse proxy, certbot для HTTPS.
Частая проблема — «out of capacity» в популярных регионах.

---

## Шаг 3. Frontend

### Cloudflare Pages

- Build command: `yarn build`
- Build output directory: `dist`
- Root directory: `frontend`
- Переменная окружения: `VITE_API_URL=https://<домен-бэка>/api`

SPA-фолбэк для React Router обеспечивает `frontend/public/_redirects`.

### Vercel

Настройки уже лежат в `frontend/vercel.json` (build, output, rewrites).
Root Directory в проекте укажи `frontend`, добавь `VITE_API_URL`.

> `VITE_API_URL` вшивается в бандл **на этапе сборки**. После смены домена бэка фронт нужно пересобрать.

---

## Шаг 4. Переменные окружения бэкенда

Обязательные (без них сервер не стартует — валидация Zod в `src/config/env.ts`):

| Переменная | Значение на проде |
|---|---|
| `MONGODB_URI` | строка подключения к Atlas |
| `JWT_SECRET` | длинная случайная строка, **не та, что локально** |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://<домен-фронта>` — используется в CORS и ссылках в письмах |

Остальные — `CLOUDINARY_*` (иначе не работает загрузка файлов), `SMTP_*` и `EMAIL_FROM` (письма),
`CEIDG_TOKEN`, `ZKWP_CHECK_ENABLED`.

Сгенерировать секрет: `openssl rand -base64 48`

⚠️ CORS настроен на **один** origin (`app.ts`). Если фронт будет доступен и по кастомному домену,
и по домену хостинга — в `FRONTEND_URL` нужно класть тот, с которого реально ходят, либо расширять конфиг.

---

## Шаг 5. Аккаунты на проде

```bash
# локально, с MONGODB_URI, указывающим на Atlas
cd backend
# ⚠️ репозиторий публичный — на проде задай СВОЙ пароль админа, не дефолтный
MONGODB_URI="<ATLAS_URI>" yarn create-admin admin@pedigreehub.pl '<свой-пароль>'
MONGODB_URI="<ATLAS_URI>" yarn seed-demo
```

Демо-логины — в локальном `ACCOUNTS.md` (в репозиторий не попадает).
Породы (`seedBreeds`) подтягиваются автоматически при первом старте сервера.

Демо-аккаунты заводчиков и покупателя специально остаются с известными паролями — комиссия
должна иметь возможность зайти. Опасен только админ, поэтому его пароль задаётся вручную.

---

## Известные ограничения бесплатных тарифов

- **512 MB RAM** на free-инстансе. `multer` держит файлы в памяти (`memoryStorage`) перед отправкой в
  Cloudinary, а `uploadListingFiles` допускает до 20 файлов по 10 MB. Реальный сценарий (10 фото по 2–5 MB)
  проходит, но одновременные тяжёлые загрузки могут выбить OOM. При проблемах — снизить лимиты в
  `src/middleware/upload.middleware.ts`.
- **Atlas M0** — 512 MB и общий CPU. Для демо-объёма данных достаточно с большим запасом.
- **Cloudinary free** — 25 GB хранилища и 25 GB трафика в месяц.
- Swagger на `/api-docs` открыт публично — для дипломной защиты это скорее плюс, но перед реальным
  продом стоит закрыть.

---

## Чек-лист перед защитой

- [ ] Открыть сайт с телефона (не только с ноутбука) — проверить, что домен и HTTPS живые
- [ ] Залогиниться каждым демо-аккаунтом из `ACCOUNTS.md`
- [ ] Создать объявление с загрузкой фото — проверить, что Cloudinary настроен
- [ ] Пройти сценарий переписки покупатель → заводчик
- [ ] Открыть админку и подтвердить объявление
- [ ] Проверить, что письма доходят (или заранее сказать, что SMTP отключён)
- [ ] Сделать локальную резервную копию: `mongodump --uri="<ATLAS_URI>"`
- [ ] Записать видео-демо на случай, если на защите не будет интернета
