.PHONY: test test-admin test-coverage test-verbose clean test-docker help

# Запуск всіх тестів
test:
    go test . -v

# Запуск тільки адмінських тестів
test-admin:
    go test . -run TestAdminHandlers -v

# Тести з покриттям коду
test-coverage:
    go test . -coverprofile=coverage.out
    go tool cover -html=coverage.out -o coverage.html
    @echo "Coverage report generated: coverage.html"

# Запуск тестів з деталями
test-verbose:
    go test . -v -count=1

# Запуск тестів з бенчмарками
test-bench:
    go test . -bench=. -benchmem

# Запуск тестів з race detection
test-race:
    go test . -race -v

# Запуск конкретного тесту
test-specific:
    @read -p "Enter test name: " test_name; \
    go test . -run $$test_name -v

# Тести з детальним покриттям
test-coverage-detail:
    go test . -coverprofile=coverage.out -covermode=count
    go tool cover -func=coverage.out
    go tool cover -html=coverage.out -o coverage.html
    @echo "Coverage report generated: coverage.html"

# Очищення тестових файлів
clean:
    rm -f coverage.out coverage.html
    rm -f *.prof

# Показати доступні команди
help:
    @echo "Available commands:"
    @echo "  test                - Run all tests"
    @echo "  test-admin          - Run only admin tests"
    @echo "  test-coverage       - Run tests with coverage"
    @echo "  test-coverage-detail- Run tests with detailed coverage"
    @echo "  test-verbose        - Run tests with verbose output"
    @echo "  test-bench          - Run benchmarks"
    @echo "  test-race           - Run tests with race detection"
    @echo "  test-specific       - Run specific test (interactive)"
    @echo "  clean               - Clean temporary files"
    @echo "  help                - Show this help"

# За замовчуванням показати допомогу
.DEFAULT_GOAL := help
