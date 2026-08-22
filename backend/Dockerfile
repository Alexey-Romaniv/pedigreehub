# PedigreeHub backend — obraz produkcyjny (Northflank / Cloud Run / Railway / własny VPS)

# --- Etap 1: build ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# --- Etap 2: runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=builder /app/dist ./dist

# Хостинг (Cloud Run и др.) подставляет свой PORT — server.ts его читает
ENV PORT=3000
EXPOSE 3000

# Не запускаем от root
USER node

CMD ["node", "dist/server.js"]
