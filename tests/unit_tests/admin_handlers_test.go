package unit_tests

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type AdminHandlersTestSuite struct {
	suite.Suite
	db *gorm.DB
}

func (suite *AdminHandlersTestSuite) SetupSuite() {
	// Получаем параметры БД из переменных окружения
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "testuser"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "testpass"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "testdb"
	}

	// Подключение к тестовой базе данных
	dsn := dbUser + ":" + dbPassword + "@tcp(" + dbHost + ":3306)/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"
	testDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	suite.Require().NoError(err)

	suite.db = testDB
}

func (suite *AdminHandlersTestSuite) TestDatabaseConnection() {
	// Проверяем, что мы можем подключиться к БД
	var count int64
	err := suite.db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ?", "testdb").Scan(&count).Error
	assert.NoError(suite.T(), err)
	assert.GreaterOrEqual(suite.T(), count, int64(0))
}

func (suite *AdminHandlersTestSuite) TearDownSuite() {
	// Очистка после всех тестов
	if suite.db != nil {
		sqlDB, _ := suite.db.DB()
		sqlDB.Close()
	}
}

// Запуск тестов
func TestAdminHandlersTestSuite(t *testing.T) {
	suite.Run(t, new(AdminHandlersTestSuite))
}
