# Test Organization

This project follows a standard test organization pattern with tests co-located with their source code in `__tests__` directories.

## 📁 Test Structure

### `/lib/service/__tests__/`
Service layer tests for business logic and API clients.
- **payroll-service.test.ts** - Payroll summary API service tests
- **employee-payroll.service.test.ts** - Employee payroll service tests
- **employee.service.test.ts** - Employee management service tests
- **holiday.service.test.ts** - Holiday service tests
- **organization.service.test.ts** - Organization service tests
- **overtime.service.test.ts** - Overtime service tests
- **payroll-calculation.service.test.ts** - Payroll calculation service tests
- **payroll-generation.service.test.ts** - Payroll generation service tests
- **payroll-summary.service.test.ts** - Payroll summary service tests
- **payroll-validation-scenarios.test.ts** - Payroll validation tests
- **ph-deductions.service.test.ts** - PH deductions service tests
- **tax-computation.service.test.ts** - Tax computation service tests
- **user.service.test.ts** - User service tests

### `/lib/controllers/__tests__/`
Controller layer tests for API endpoints and route handlers.
- **payroll-api.test.ts** - Payroll API endpoints tests
- **payroll.controller.test.ts** - Payroll controller tests
- **employee.filter.test.ts** - Employee filter controller tests
- **holiday.controller.test.ts** - Holiday controller tests
- **overtime.controller.test.ts** - Overtime controller tests
- **user.controller.test.ts** - User controller tests

### `/lib/utils/__tests__/`
Utility and component tests.
- **payroll-result-panel.test.tsx** - Payroll UI component integration tests
- **date-utils.test.ts** - Date utility function tests

## 🚀 Running Tests

### Individual Test Suites
```bash
# Service layer tests
pnpm test:payroll-service

# UI component tests
pnpm test:payroll-ui

# Controller/API tests
pnpm test:payroll-api

# All existing tests
pnpm test
```

### Specific Test Files
```bash
# Run specific service tests
pnpm test lib/service/__tests__/payroll-service.test.ts

# Run specific controller tests
pnpm test lib/controllers/__tests__/payroll-api.test.ts

# Run specific utility tests
pnpm test lib/utils/__tests__/payroll-result-panel.test.tsx
```

### All Payroll Tests
```bash
# Run all payroll-related tests (new + existing)
pnpm test:payroll-all
```

### With Coverage
```bash
# Run with coverage report
pnpm test:payroll-all --coverage

# Coverage for all tests
pnpm test --coverage
```

### Watch Mode
```bash
# Run in watch mode for development
pnpm test:payroll-all --watch

# Watch all tests
pnpm test --watch
```

## 📋 Test Coverage Areas

### Service Layer Tests
- ✅ API client methods and HTTP requests
- ✅ Business logic validation
- ✅ Data transformation and processing
- ✅ Error handling and edge cases
- ✅ Bulk operations and pagination

### Controller Layer Tests
- ✅ API endpoint functionality
- ✅ Request/response validation
- ✅ Permission and authorization checks
- ✅ Parameter validation
- ✅ HTTP status codes and error responses

### Utility/Component Tests
- ✅ Data structure validation
- ✅ Component integration
- ✅ Utility function behavior
- ✅ Formatting and display logic

## 🔧 Test Configuration

Tests are configured with:
- **Vitest** as the test runner
- **TypeScript** support
- **Mocking** capabilities for external dependencies
- **Coverage** reporting available

## 📝 Best Practices

1. **Co-location**: Tests are placed near the code they test
2. **Naming**: Test files follow `*.test.ts` or `*.test.tsx` pattern
3. **Structure**: Tests follow AAA pattern (Arrange, Act, Assert)
4. **Mocking**: External dependencies are mocked appropriately
5. **Coverage**: Aim for high coverage of critical paths

## 🚨 Dependencies

For full UI component testing, ensure these are installed:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

## 📊 Integration

The new payroll tests integrate seamlessly with the existing test suite, following the same patterns and conventions used throughout the project.
