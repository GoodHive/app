# GoodHive Migration Test Suite

## Overview

Comprehensive test suite for the Okto to Thirdweb wallet migration system. This test suite ensures reliability and correctness of all migration components, API endpoints, and integration flows.

## Test Structure

```
tests/
├── setup.ts                           # Global test configuration
├── lib/
│   └── thirdweb/
│       └── config.test.ts             # Thirdweb configuration tests
├── components/
│   └── ThirdwebConnect/
│       ├── HoneyBeeConnectButton.test.tsx    # Connect button tests
│       ├── EmailAuthFlow.test.tsx             # Email authentication tests
│       └── MigrationWizard.test.tsx           # Migration wizard tests
├── api/
│   └── auth/
│       └── thirdweb-verify.test.ts           # API route tests
├── db/
│   └── enhanced-migration-runner.test.ts     # Database migration tests
└── integration/
    └── migration-flow.test.ts                # End-to-end integration tests
```

## Test Categories

### Unit Tests
- **Components**: Individual React component functionality
- **Configuration**: Thirdweb client setup and feature flags
- **API Routes**: Authentication and verification endpoints
- **Database**: Migration runner and schema changes

### Integration Tests
- **Migration Flow**: Complete end-to-end migration scenarios
- **Error Handling**: Failure recovery and retry mechanisms
- **Performance**: Metrics tracking and concurrent operations

## Running Tests

### Basic Commands
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Specific Test Categories
```bash
# Run migration-specific tests
pnpm test:migration

# Run component tests
pnpm test:components

# Run API tests
pnpm test:api
```

### Advanced Options
```bash
# Run tests for specific file
vitest tests/components/ThirdwebConnect/MigrationWizard.test.tsx

# Run tests with specific pattern
vitest --grep "migration"

# Run tests in CI mode
vitest --run
```

## Test Configuration

### Vitest Configuration
- **Environment**: jsdom for React component testing
- **Setup Files**: Global mocks and test utilities
- **Coverage**: v8 provider with comprehensive reporting
- **Timeout**: 10 seconds for async operations

### Mocked Dependencies
- **Thirdweb SDK**: Wallet connections and verification
- **Next.js**: Navigation, headers, and API routes
- **Database**: PostgreSQL connections and queries
- **Browser APIs**: localStorage, cookies, fetch

## Writing Tests

### Component Testing Pattern
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### API Testing Pattern
```typescript
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/api/your-route/route';

describe('/api/your-route', () => {
  it('should handle valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## Test Scenarios Covered

### Migration Flows
- ✅ New user registration with Thirdweb
- ✅ Existing Okto user migration
- ✅ Existing Thirdweb user login
- ✅ Signature verification for external wallets
- ✅ Error handling and recovery
- ✅ Partial migration failures

### Component Functionality
- ✅ Wallet connection states (connected/disconnected/loading)
- ✅ Email authentication flow
- ✅ OTP input and validation
- ✅ Migration wizard step progression
- ✅ Error states and retry mechanisms
- ✅ Honey bee themed styling

### API Endpoints
- ✅ User creation and updates
- ✅ JWT token generation
- ✅ Cookie management
- ✅ Database transactions
- ✅ Error logging and reporting
- ✅ Input validation

### Database Operations
- ✅ Migration file execution
- ✅ Schema version tracking
- ✅ Rollback capabilities
- ✅ Checksum validation
- ✅ Transaction handling

## Mock Strategy

### Thirdweb Mocks
```typescript
vi.mock('thirdweb/react', () => ({
  useActiveAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
}));
```

### Database Mocks
```typescript
vi.mock('postgres', () => {
  const mockSql = vi.fn();
  mockSql.begin = vi.fn();
  return vi.fn(() => mockSql);
});
```

### API Mocks
```typescript
const mockFetch = vi.fn();
global.fetch = mockFetch;
```

## Coverage Targets

- **Components**: 90%+ line coverage
- **API Routes**: 95%+ line coverage
- **Database**: 85%+ line coverage
- **Integration**: 80%+ scenario coverage

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    pnpm install
    pnpm test:coverage
    pnpm test:migration
```

### Test Reports
- Coverage reports in HTML format
- JSON results for CI parsing
- Performance metrics tracking
- Error logs for debugging

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### Async Testing
- Use `waitFor` for async operations
- Mock API responses properly
- Handle loading states
- Test error scenarios

### Component Testing
- Test user interactions
- Verify prop handling
- Check accessibility
- Test responsive behavior

## Troubleshooting

### Common Issues
1. **Mock not working**: Check mock setup in beforeEach
2. **Async timeout**: Increase test timeout in config
3. **DOM not updating**: Use waitFor for state changes
4. **Import errors**: Check module resolution in vitest.config.ts

### Debug Mode
```bash
# Run single test with debug output
vitest --run tests/components/MigrationWizard.test.tsx --reporter=verbose
```

## Contributing

1. Write tests for all new features
2. Maintain coverage targets
3. Follow existing patterns
4. Update documentation
5. Run full test suite before PR

## Migration Testing Checklist

- [ ] Feature flags work correctly
- [ ] All migration steps complete successfully
- [ ] Error states display properly
- [ ] Database transactions are atomic
- [ ] API endpoints handle edge cases
- [ ] Performance metrics are captured
- [ ] Cleanup operations execute
- [ ] User experience is smooth