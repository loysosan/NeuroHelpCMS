FROM golang:1.21-alpine AS test-base

# Встановлюємо необхідні утиліти
RUN apk add --no-cache git make gcc musl-dev sqlite

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо go.mod і go.sum з кореневої директорії
COPY go.mod go.sum ./

# Завантажуємо залежності
RUN go mod download

# Встановлюємо додаткові залежності для тестів
RUN go install github.com/stretchr/testify/suite@latest
RUN go install github.com/stretchr/testify/assert@latest
RUN go install gorm.io/driver/sqlite@latest

# Копіюємо весь проект
COPY . .

# Встановлюємо робочу директорію для тестів
WORKDIR /app/tests

# Створюємо директорії для кешу та покриття
RUN mkdir -p cache coverage

# Створюємо користувача для запуску тестів (для безпеки)
RUN adduser -D -s /bin/sh testuser
RUN chown -R testuser:testuser /app
USER testuser

# За замовчуванням запускаємо тести
CMD ["make", "test"]