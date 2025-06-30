#!/bin/bash

# Скрипт для запуску тестів в Docker

set -e

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функція для виводу повідомлень
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Перевірка Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker не встановлений!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не встановлений!"
        exit 1
    fi
}

# Збірка образу
build_image() {
    log "Збирання Docker образу для тестів..."
    docker-compose -f docker-compose.yaml build
    log "Образ зібрано успішно!"
}

# Запуск тестів
run_tests() {
    local test_type=${1:-"basic"}
    
    case $test_type in
        "basic")
            log "Запуск базових тестів..."
            docker-compose -f docker-compose.yaml up test-runner
            ;;
        "coverage")
            log "Запуск тестів з покриттям коду..."
            docker-compose -f docker-compose.yaml --profile coverage up test-coverage
            ;;
        "bench")
            log "Запуск бенчмарків..."
            docker-compose -f docker-compose.yaml --profile bench up test-bench
            ;;
        "race")
            log "Запуск тестів з race detection..."
            docker-compose -f docker-compose.yaml --profile race up test-race
            ;;
        "news")
            log "Запуск тестів для новин..."
            docker-compose -f docker-compose.yaml --profile news up test-news
            ;;
        "all")
            log "Запуск всіх типів тестів..."
            run_tests "basic"
            run_tests "coverage"
            run_tests "news"
            run_tests "bench"
            run_tests "race"
            ;;
        *)
            error "Невідомий тип тестів: $test_type"
            show_usage
            exit 1
            ;;
    esac
}

# Очищення
cleanup() {
    log "Очищення Docker ресурсів..."
    docker-compose -f docker-compose.yaml down --volumes --remove-orphans
    docker system prune -f
    log "Очищення завершено!"
}

# Показати використання
show_usage() {
    echo "Використання: $0 [КОМАНДА]"
    echo ""
    echo "Команди:"
    echo "  build      - Зібрати Docker образ"
    echo "  test       - Запустити базові тести"
    echo "  coverage   - Запустити тести з покриттям"
    echo "  bench      - Запустити бенчмарки"
    echo "  race       - Запустити тести з race detection"
    echo "  news       - Запустити тести для новин"
    echo "  all        - Запустити всі типи тестів"
    echo "  clean      - Очистити Docker ресурси"
    echo "  shell      - Відкрити інтерактивну оболонку"
    echo "  help       - Показати цю довідку"
}

# Інтерактивна оболонка
open_shell() {
    log "Відкриття інтерактивної оболонки..."
    docker-compose -f docker-compose.yaml run --rm test-runner sh
}

# Головна функція
main() {
    check_docker
    
    case ${1:-"help"} in
        "build")
            build_image
            ;;
        "test")
            build_image
            run_tests "basic"
            ;;
        "coverage")
            build_image
            run_tests "coverage"
            ;;
        "bench")
            build_image
            run_tests "bench"
            ;;
        "race")
            build_image
            run_tests "race"
            ;;
        "news")
            build_image
            run_tests "news"
            ;;
        "all")
            build_image
            run_tests "all"
            ;;
        "clean")
            cleanup
            ;;
        "shell")
            build_image
            open_shell
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            error "Невідома команда: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Обробка сигналів переривання
trap cleanup EXIT

# Запуск
main "$@"