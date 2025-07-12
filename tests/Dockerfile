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

# Копируем конфигурационный файл
COPY ./tests/config-test.ini ./config.ini

# Создаем директории для результатов
RUN mkdir -p coverage

# Команда по умолчанию
CMD ["go", "test", "./tests/unit_tests/...", "-v"]