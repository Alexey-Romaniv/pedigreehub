#!/bin/bash

# Быстрый тест API для объявлений
# Использование: ./test-quick.sh

BASE_URL="http://localhost:3000/api"

echo "Тестирование API объявлений"
echo "================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка что сервер запущен
echo "Проверка доступности сервера..."
if curl -s -f "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}Сервер доступен${NC}"
else
    echo -e "${RED}Сервер не доступен. Запусти: yarn dev${NC}"
    exit 1
fi

echo ""
echo "Для полного тестирования нужно:"
echo "1. Зарегистрировать заводчика"
echo "2. Залогиниться и получить токен"
echo "3. Загрузить документы ZKwP"
echo "4. Одобрить документы как админ"
echo "5. Создать объявление"
echo ""
echo "Используй Postman/Thunder Client или смотри docs/TESTING.md"
echo ""
echo "Примеры запросов:"
echo ""
echo "1. Регистрация заводчика:"
echo "curl -X POST $BASE_URL/auth/register/breeder \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@test.com\",\"password\":\"Test123456\",...}'"
echo ""
echo "2. Вход:"
echo "curl -X POST $BASE_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@test.com\",\"password\":\"Test123456\"}'"
echo ""
echo "3. Создание объявления (нужен токен и файлы):"
echo "curl -X POST $BASE_URL/listings \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -F 'title=Test' -F 'breed=ID' ..."
echo ""
echo "Полная инструкция: docs/TESTING.md"

