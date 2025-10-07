# Server API Tests

This directory contains API integration tests for the Node.js server using TestCafe.

## 📁 Structure

```
tests/
└── api/
    ├── api-client.ts         # API client utilities
    └── todo-api.test.ts      # tRPC API tests (11 tests)
```

## 🚀 Quick Start

```powershell
# Run all API tests
pnpm test

# Run in headless mode
pnpm test:headless
```

## 📝 Test Files

### `todo-api.test.ts` (11 tests)

Tests for tRPC API endpoints:

- **GET** all todos (`todo.getAll`)
- **POST** create todo (`todo.create`)
- **POST** toggle completion (`todo.toggle`)
- **POST** delete todo (`todo.delete`)
- Input validation
- Response structure validation
- HTTP status codes
- Content-type headers
- Concurrent operations
- Sequential operations
- Response time measurement

### `api-client.ts`

Utilities for API testing:

- tRPC query helpers
- tRPC mutation helpers
- Request logging setup
- Test data generators

## 🛠️ API Client Usage

```typescript
import { ApiClient, ApiTestHelpers } from "./api-client";

// Generate test data
const todoText = ApiTestHelpers.generateTodoText();

// Make API requests (in browser context)
const response = await fetch("http://localhost:3000/trpc/todo.getAll");
const data = await response.json();
```

## ⚙️ Configuration

Tests are configured via `.testcaferc.json`:

- Default browser: Chrome
- Screenshots on failure
- 5s timeouts (APIs are fast)
- Spec and JSON reporters

## 📊 Reports

Test results are saved in:

- `tests/reports/api-report.json` - JSON test results
- `tests/screenshots/` - Failure screenshots

## 🎯 Test Coverage

### tRPC Endpoints

✅ `todo.getAll` - Fetch all todos  
✅ `todo.create` - Create new todo  
✅ `todo.toggle` - Toggle todo completion  
✅ `todo.delete` - Delete todo

### Validation

✅ Input validation (empty text)  
✅ Response structure  
✅ HTTP status codes  
✅ Content-type headers

### Advanced

✅ Concurrent requests  
✅ Sequential operations  
✅ Performance measurement  
✅ Request logging

## 🎯 Running Tests

```powershell
# Run all API tests
cd apps\server
pnpm test

# Run in headless mode
pnpm test:headless

# Run with debug
testcafe chrome tests\api\todo-api.test.ts --debug-mode

# Run single test
testcafe chrome tests\api\todo-api.test.ts -t "Should fetch all todos"
```

## 🔍 Features Demonstrated

1. **Direct HTTP Testing** - Using fetch API
2. **tRPC Testing** - Testing tRPC endpoints
3. **Request Logging** - Monitoring API calls
4. **Response Validation** - Structure and content
5. **Performance Testing** - Response time measurement
6. **Concurrent Testing** - Parallel requests
7. **Error Handling** - Invalid input testing

## 📚 Example Test

```typescript
test("Should create a new todo", async (t) => {
  const todoText = ApiTestHelpers.generateTodoText();

  const response = await fetch("http://localhost:3000/trpc/todo.create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: todoText }),
  });

  await t.expect(response.status).eql(200);

  const data = (await response.json()) as ApiResponse;
  await t.expect(data.result).ok("Should have result");
});
```

## 💡 Best Practices

1. **Generate random data** - Use `ApiTestHelpers`
2. **Validate structure** - Check response format
3. **Test status codes** - Verify HTTP responses
4. **Measure performance** - Track response times
5. **Test concurrency** - Verify parallel handling

## 📚 Documentation

- [Main Testing Guide](../../TESTING.md)
- [Quick Start](../../QUICKSTART-TESTING.md)
- [Test Commands](../../TEST-COMMANDS.md)
