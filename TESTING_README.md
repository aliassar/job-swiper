# How to Run Tests

This document explains how to run the comprehensive test suite for the Job Swiper application.

## Prerequisites

- Node.js v18+ installed
- npm installed
- Chromium browser (installed automatically by Playwright)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:ui
```

### Run Tests with Browser Visible
```bash
npm run test:headed
```

### View Test Report
```bash
npm run test:report
```

## Test Suites

The test suite includes 63 comprehensive tests across 6 test files:

### 1. Offline/Online Tests (`tests/offline-online.spec.js`)
Tests offline queue mechanism, idempotency, and sync functionality.
- 7 tests covering offline behavior
- Validates queue persistence and retry logic

### 2. Rollback Tests (`tests/rollback.spec.js`)
Tests rollback functionality with and without generated documents.
- 9 tests covering rollback scenarios
- Validates state restoration and offline rollback

### 3. Multi-Device Tests (`tests/multi-device.spec.js`)
Tests multi-device synchronization and concurrent actions.
- 8 tests simulating multiple devices
- Validates IndexedDB and state sync

### 4. Export Tests (`tests/export.spec.js`)
Tests CSV and PDF export functionality.
- 13 tests covering export features
- Validates file format and content accuracy

### 5. End-to-End Workflows (`tests/e2e-workflows.spec.js`)
Tests complete user journeys through the application.
- 13 tests covering main workflows
- Validates navigation, settings, and responsive design

### 6. UI Features Tests (`tests/ui-features.spec.js`)
Tests UI components and page rendering.
- 14 tests covering UI elements
- Validates responsive design and component visibility

## Test Output

### Screenshots
Test screenshots are saved to:
- `tests/screenshots/` - Test-specific screenshots
- `test-results/` - Test artifacts (gitignored)

### Reports
- HTML report: `playwright-report/` (generated after test run)
- Test results: `test-results/` (gitignored)

### Production Test Report
See `PRODUCTION_TEST_REPORT.md` for comprehensive test results and deployment readiness assessment.

## Continuous Integration

The tests are configured to run in CI environments with:
- Automatic retries (2 retries in CI)
- Single worker in CI for stability
- Automatic browser installation
- Video recording on failure

## Test Configuration

Tests are configured via `playwright.config.js`:
- Base URL: `http://localhost:3000`
- Timeout: 120 seconds for web server startup
- Screenshot on test run
- Video on failure
- Trace on first retry

## Troubleshooting

### Tests Fail to Start
If you see "Cannot find module '@playwright/test'":
```bash
npm install
npx playwright install chromium
```

### Port 3000 Already in Use
Kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill
```

### Browser Not Installed
Install Playwright browsers:
```bash
npx playwright install
```

## Development

### Adding New Tests
1. Create a new `.spec.js` file in the `tests/` directory
2. Follow the existing pattern with `test.describe()` and `test()` blocks
3. Use `await page.screenshot()` to capture important states
4. Add descriptive console.log statements for test output

### Test Best Practices
- Use `data-testid` attributes for stable selectors
- Wait for `networkidle` before interacting
- Add generous timeouts for async operations
- Take screenshots at key moments
- Use descriptive test names

## Test Coverage

Current test coverage includes:
- ✅ Offline functionality and sync
- ✅ Rollback mechanisms
- ✅ Multi-device scenarios
- ✅ Export features (CSV/PDF)
- ✅ End-to-end user workflows
- ✅ Session persistence
- ✅ Error handling
- ✅ Responsive design
- ✅ All major UI components

## Next Steps

After running tests successfully:
1. Review `PRODUCTION_TEST_REPORT.md` for results
2. Check screenshots in `tests/screenshots/`
3. View HTML report: `npm run test:report`
4. Address any failing tests
5. Deploy to production when all tests pass

## Support

For issues or questions about testing:
1. Check the Playwright documentation: https://playwright.dev
2. Review existing test files for examples
3. See test output logs for detailed error messages
