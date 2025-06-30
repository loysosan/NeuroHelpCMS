.PHONY: test test-admin test-coverage test-verbose clean test-docker help build run

# Збірка проєкту
build:
    go build -o bin/cms cmd/main.go

# Запуск сервера
run:
    go run cmd/main.go

# Запуск всіх тестів
test:
    cd tests/admin_tests && go test . -v

# Запуск тільки адмінських тестів
test-admin:
    cd tests/admin_tests && go test . -run TestAdminBackend -v

# Запуск тестів новин
test-news:
    cd tests/admin_tests && go test . -run TestAdminNews -v

# Тести з покриттям коду
test-coverage:
    cd tests/admin_tests && go test . -coverprofile=coverage.out
    cd tests/admin_tests && go tool cover -html=coverage.out -o coverage.html
    @echo "Coverage report generated: tests/admin_tests/coverage.html"

# Запуск тестів з деталями
test-verbose:
    cd tests/admin_tests && go test . -v -count=1

# Запуск тестів з race detection
test-race:
    cd tests/admin_tests && go test . -race -v

# Запуск бенчмарків
test-bench:
    cd tests/admin_tests && go test . -bench=. -benchmem

# Очищення тестових файлів
clean:
    rm -f tests/admin_tests/coverage.out tests/admin_tests/coverage.html
    rm -f tests/admin_tests/*.prof
    rm -f bin/*

# Docker команди
docker-test:
    cd tests && ./run-tests.sh test

docker-coverage:
    cd tests && ./run-tests.sh coverage

docker-all:
    cd tests && ./run-tests.sh all

docker-clean:
    cd tests && ./run-tests.sh clean

# Перевірка коду
lint:
    go vet ./...
    go fmt ./...

# Модулі
mod-tidy:
    go mod tidy
    go mod download

# Повна перевірка
check: lint test

# Розробка (запуск у режимі розробки)
dev:
    go run cmd/main.go

# Показати доступні команди
help:
    @echo "Available commands:"
    @echo ""
    @echo "Build & Run:"
    @echo "  build               - Build the application"
    @echo "  run                 - Run the application"
    @echo "  dev                 - Run in development mode"
    @echo ""
    @echo "Testing:"
    @echo "  test                - Run all tests"
    @echo "  test-admin          - Run admin backend tests"
    @echo "  test-news           - Run news tests"
    @echo "  test-coverage       - Run tests with coverage"
    @echo "  test-verbose        - Run tests with verbose output"
    @echo "  test-race           - Run tests with race detection"
    @echo "  test-bench          - Run benchmarks"
    @echo ""
    @echo "Docker Testing:"
    @echo "  docker-test         - Run tests in Docker"
    @echo "  docker-coverage     - Run coverage tests in Docker"
    @echo "  docker-all          - Run all tests in Docker"
    @echo "  docker-clean        - Clean Docker resources"
    @echo ""
    @echo "Code Quality:"
    @echo "  lint                - Run linting"
    @echo "  check               - Run linting and tests"
    @echo "  mod-tidy            - Tidy Go modules"
    @echo ""
    @echo "Utilities:"
    @echo "  clean               - Clean temporary files"
    @echo "  help                - Show this help"

# За замовчуванням показати допомогу
.DEFAULT_GOAL := help