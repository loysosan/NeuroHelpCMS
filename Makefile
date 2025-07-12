.PHONY: test-unit test-integration build-test clean-test help

# Переменные для тестов
DOCKER := docker
DOCKER_COMPOSE := docker-compose
TEST_IMAGE_NAME := my-little-go-cms:test

# Сборка тестового образа
build-test:
	$(DOCKER) build -f tests/Dockerfile -t $(TEST_IMAGE_NAME) .

# Запуск unit тестов
test-unit: build-test
	$(DOCKER_COMPOSE) -f docker-compose-test.yml run --rm unit_test

# Запуск интеграционных тестов  
test-integration: build-test
	$(DOCKER_COMPOSE) -f docker-compose-test.yml run --rm integration_test

# Запуск всех тестов
test-all: build-test
	$(DOCKER_COMPOSE) -f docker-compose-test.yml run --rm unit_test
	$(DOCKER_COMPOSE) -f docker-compose-test.yml run --rm integration_test

# Очистка тестовых ресурсов
clean-test:
	$(DOCKER) stop my-little-go-cms_test_unit my-little-go-cms_test_integration my-little-go-cms_test_db || true
	$(DOCKER) rm my-little-go-cms_test_unit my-little-go-cms_test_integration my-little-go-cms_test_db || true
	$(DOCKER) volume rm my-little-go-cms_test_db_data my-little-go-cms_test_coverage || true
	$(DOCKER) rmi $(TEST_IMAGE_NAME) || true

# Тесты с покрытием
test-coverage: build-test
	$(DOCKER_COMPOSE) -f docker-compose-test.yml run --rm unit_test go test ./tests/unit_tests/... -coverprofile=coverage/coverage.out -v
	$(DOCKER_COMPOSE) -f docker-compose-test.yml run --rm unit_test go tool cover -html=coverage/coverage.out -o coverage/coverage.html

# Показать помощь
help:
	@echo "Available commands:"
	@echo "  build-test        - Build test Docker image"
	@echo "  test-unit         - Run unit tests"
	@echo "  test-integration  - Run integration tests"
	@echo "  test-all          - Run all tests"
	@echo "  clean-test        - Clean test resources"
	@echo "  help              - Show this help"