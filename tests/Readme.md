# API Testing - Little Go CMS

This directory contains unit tests and integration tests for the Content Management System API.

## 🚀 Quick Start

### From tests directory:

```bash
# Navigate to tests directory
cd /Users/olkeksandrkrasila/WORK/LDUA/my-little-go-cms/tests

# Run all tests
make test

# Or use go directly
go test . -v
```

### From project root:

```bash
# Navigate to project root
cd /Users/olkeksandrkrasila/WORK/LDUA/my-little-go-cms

# Run all tests
make test

# Or use go directly
go test ./tests/... -v
```

## 📋 Available Commands

### From tests/ directory:

| Command | Description |
|---------|-------------|
| `make test` | Run all tests |
| `make test-admin` | Run only admin tests |
| `make test-coverage` | Tests with code coverage |
| `make test-verbose` | Detailed test output |
| `make test-race` | Tests with race detection |
| `make test-bench` | Run benchmarks |
| `make test-specific` | Run specific test (interactive) |
| `make clean` | Clean temporary files |
| `make help` | Show available commands |

### From project root:

| Command | Description |
|---------|-------------|
| `make test` | Run all tests |
| `make test-admin` | Run only admin tests |
| `make test-coverage` | Tests with coverage |
| `make check` | Lint and test |
| `make build` | Build application |
| `make run` | Run application |

## 🔧 Usage Examples

### Running Tests

```bash
# From tests directory
cd tests/
make test

# From project root
make test

# Run specific test
cd tests/
make test-specific
# Enter test name when prompted: TestCreateUser_Success

# Run tests with coverage
make test-coverage
open coverage.html  # View coverage report
```

### Development Workflow

```bash
# From project root
make check          # Lint and test
make build          # Build application
make run            # Run application

# Or for development
make dev            # Run in development mode
```

## 📁 Test Structure

```
tests/
├── README.md                   # This file
├── Makefile                    # Commands for running tests
├── admin_handlers_test.go      # Tests for admin handlers
├── admin_news_test.go          # Tests for news functionality
├── test_helpers.go             # Helper functions for testing
└── coverage.html              # Code coverage report (generated)
```

## 📊 Test Statistics

*Updated automatically after running `make test-coverage`*

```
Total tests: XX
Passed: XX
Failed: XX
Code coverage: XX%
Execution time: XX seconds
```

## 🧪 Covered Functionality

### Administrative Functions

#### 👥 User Management
- ✅ `CreateUser` - Creating users
- ✅ `GetAllUsers` - Getting list of users
- ✅ `GetUser` - Getting user by ID
- ✅ `UpdateUser` - Updating user information
- ✅ `DeleteUser` - Deleting user

#### 🛠 Skills Management
- ✅ `CreateSkill` - Creating new skills
- ✅ `GetSkills` - Getting list of skills
- ✅ `UpdateSkill` - Updating skills
- ✅ `DeleteSkill` - Deleting skills
- ✅ `CreateSkillCategory` - Creating skill categories
- ✅ `GetSkillCategories` - Getting categories
- ✅ `UpdateSkillCategory` - Updating categories
- ✅ `DeleteSkillCategory` - Deleting categories

#### 💰 Plans Management
- ✅ `CreatePlan` - Creating subscription plans
- ✅ `GetPlans` - Getting list of plans
- ✅ `DeletePlan` - Deleting plans
- ✅ Checking plans in use

#### 👨‍💼 Administrator Management
- ✅ `CreateAdmin` - Creating administrators
- ✅ `GetAdministrators` - List of administrators
- ✅ `UpdateAdmin` - Updating information
- ✅ `DeleteAdmin` - Deleting administrators
- ✅ Role and access permission checks

#### 📰 News Management
- ✅ `CreateNews` - Creating news
- ✅ `GetAllNews` - Getting all news
- ✅ `UpdateNews` - Editing news
- ✅ `DeleteNews` - Deleting news
- ✅ Authorship and access permission checks

## 🔧 Test Infrastructure

### Test Database
- Uses **SQLite in-memory** for test isolation
- Automatic model migration before tests
- Data cleanup between tests

### Mock Objects
- Middleware for administrator authentication
- Request context simulation
- Mock data for testing

### Test Utilities (`test_helpers.go`)

```go
// Creating test entities
helpers.CreateTestUser(email, role)
helpers.CreateTestAdmin(email, role)
helpers.CreateTestSkill(name, categoryID)
helpers.CreateTestCategory(name)
helpers.CreateTestPlan(name, price)

// Database state verification
helpers.AssertDBCount(model, expectedCount)
helpers.AssertRecordExists(model, condition, args...)
helpers.AssertRecordNotExists(model, condition, args...)

// HTTP testing
helpers.MakeJSONRequest(method, url, data)
helpers.AssertResponseCode(w, expectedCode)
helpers.AssertJSONResponse(w, target)
```

## 📈 Code Coverage Analysis

### Report Generation

```bash
make test-coverage
```

After running, open `coverage.html` in browser for detailed analysis.

### Result Interpretation

- **Green**: Code covered by tests
- **Red**: Code not covered by tests  
- **Gray**: Unreachable code

### Target Metrics

| Component | Target Coverage |
|-----------|----------------|
| Handlers | > 90% |
| Utilities | > 85% |
| Models | > 80% |
| Overall | > 85% |

## 🎯 Testing Scenarios

### Example User Creation Test

```go
func (suite *AdminHandlersTestSuite) TestCreateUser_Success() {
    // Arrange - prepare data
    userData := map[string]interface{}{
        "firstName": "New",
        "lastName":  "User",
        "email":     "new@user.com",
        "role":      "client",
        "password":  "password123",
    }

    // Act - execute request
    body, _ := json.Marshal(userData)
    req := httptest.NewRequest("POST", "/api/admin/users", bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    suite.router.ServeHTTP(w, req)

    // Assert - verify result
    assert.Equal(suite.T(), http.StatusCreated, w.Code)
    
    // Verify in database
    var user models.User
    err := suite.db.Where("email = ?", "new@user.com").First(&user).Error
    assert.NoError(suite.T(), err)
    assert.Equal(suite.T(), "New", user.FirstName)
}
```

## 🐛 Test Debugging

### Detailed Error Output

```bash
go test ./tests/... -v -count=1
```

### Running Specific Test with Debugging

```bash
go test ./tests/ -run TestCreateUser_Success -v -count=1
```

### Test Profiling

```bash
go test ./tests/... -cpuprofile=cpu.prof -memprofile=mem.prof
go tool pprof cpu.prof
```

## 🔄 Continuous Integration

### GitHub Actions (example)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
          go-version: 1.21
      - run: make test-coverage
      - run: go tool cover -func=coverage.out
```

## 📝 Recommendations

### Writing New Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test**: Each test should focus on one aspect
3. **Descriptive names**: `TestCreateUser_WithValidData_Success`
4. **Data cleanup**: Each test should be independent

### Test Organization

```go
func (suite *TestSuite) TestFeature_Scenario_ExpectedResult() {
    // Arrange - prepare data
    data := prepareTestData()
    
    // Act - perform action
    result := performAction(data)
    
    // Assert - verify result
    assert.Equal(suite.T(), expected, result)
}
```

### Useful Patterns

- **Table-driven tests** for multiple scenarios
- **Test fixtures** for complex data
- **Custom matchers** for specific validations

## 🚨 Troubleshooting

### Common Issues

1. **Database locked**
   ```bash
   # Clean temporary files
   make clean
   ```

2. **Port conflicts**
   ```bash
   # Use different port for tests
   export TEST_PORT=8081
   ```

3. **Dependency issues**
   ```bash
   go mod tidy
   go mod download
   ```

## 📞 Support

When encountering test issues:

1. Check test logs: `go test ./tests/... -v`
2. Review test code to understand expected behavior
3. Use debugging: add `fmt.Printf` at critical points
4. Check code coverage to identify untested paths

---

## 🏗 Architecture Overview

### Test Suite Structure

```
AdminHandlersTestSuite
├── SetupSuite()          # Database initialization
├── SetupTest()           # Data cleanup before each test
├── TearDownSuite()       # Cleanup after all tests
├── mockAdminMiddleware() # Authentication simulation
└── setupRoutes()         # Route configuration
```

### Test Categories

- **Unit Tests**: Individual handler functions
- **Integration Tests**: Handler + Database interactions
- **End-to-End Tests**: Complete request-response cycles
- **Security Tests**: Authentication and authorization

## 🔍 Best Practices

### Test Naming Convention

```go
// Pattern: TestMethod_Scenario_ExpectedResult
TestCreateUser_Success()
TestCreateUser_InvalidJSON()
TestCreateUser_DuplicateEmail()
TestGetUser_NotFound()
TestDeleteUser_Forbidden()
```

### Test Data Management

```go
// Use factories for consistent test data
func createTestUser() *models.User {
    return &models.User{
        FirstName: "Test",
        LastName:  "User",
        Email:     "test@example.com",
        Role:      "client",
        Status:    "active",
    }
}
```

### Assertion Strategies

```go
// Prefer specific assertions
assert.Equal(t, http.StatusCreated, w.Code)
assert.Contains(t, w.Body.String(), "success")
assert.Len(t, users, 1)

// Use custom error messages
assert.NoError(t, err, "Database operation should succeed")
```

## 🎭 Mock Strategies

### Authentication Mocking

```go
func (suite *TestSuite) mockAdminMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := context.WithValue(r.Context(), "admin", suite.admin)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### Database Mocking

```go
// Using in-memory SQLite for realistic database interactions
testDB, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
```

## 📋 Test Checklist

Before submitting code:

- [ ] All tests pass locally
- [ ] New features have corresponding tests
- [ ] Edge cases are covered
- [ ] Error conditions are tested
- [ ] Code coverage meets targets
- [ ] No hardcoded test data in production paths
- [ ] Tests are deterministic (no race conditions)

---

*Created for Little Go CMS Test Suite*
*Last updated: June 30, 2025*