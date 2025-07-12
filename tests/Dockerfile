FROM golang:1.23-alpine

# Установка зависимостей
RUN apk add --no-cache git make gcc musl-dev mysql-client

# Рабочая директория
WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./

# Загружаем зависимости
RUN go mod download

# Добавляем недостающие зависимости для тестов
RUN go get github.com/go-ini/ini
RUN go get github.com/stretchr/testify/suite
RUN go get github.com/stretchr/testify/assert

# Копируем весь проект
COPY . .

# Создаем директории для результатов
RUN mkdir -p coverage

# Команда по умолчанию
CMD ["go", "test", "./tests/unit_tests/...", "-v"]