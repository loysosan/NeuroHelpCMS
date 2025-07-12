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

# Создаем полный config.ini для тестов
RUN echo "[database]" > config.ini && \
    echo "host = test_db" >> config.ini && \
    echo "port = 3306" >> config.ini && \
    echo "user = testuser" >> config.ini && \
    echo "password = testpass" >> config.ini && \
    echo "name = testdb" >> config.ini && \
    echo "" >> config.ini && \
    echo "[auth]" >> config.ini && \
    echo "jwt_admin_secret = test_secret" >> config.ini && \
    echo "jwt_user_secret = test_secret" >> config.ini && \
    echo "jwt_user_refresh_secret = test_secret" >> config.ini

# Создаем директории для результатов
RUN mkdir -p coverage

# Команда по умолчанию
CMD ["go", "test", "./tests/unit_tests/...", "-v"]