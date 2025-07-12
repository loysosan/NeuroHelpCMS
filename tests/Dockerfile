FROM golang:1.23-alpine

# Установка зависимостей
RUN apk add --no-cache git make gcc musl-dev mysql-client

# Рабочая директория
WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./

# Загружаем зависимости
RUN go mod download

# Копируем весь проект
COPY . .

# Копируем тестовый конфигурационный файл в корень
COPY tests/config-test.ini ./config.ini

# Отладочная информация
RUN echo "=== Contents of /app directory ===" && ls -la /app/
RUN echo "=== Config file contents ===" && cat /app/config.ini || echo "config.ini not found"
RUN echo "=== Working directory ===" && pwd

# Создаем директории для результатов
RUN mkdir -p coverage

# Команда по умолчанию - запускаем тесты из корневой директории
CMD ["sh", "-c", "echo 'Starting tests...' && pwd && ls -la config.ini && go test ./tests/unit_tests/... -v -count=1"]