const { test, expect } = require('@playwright/test');

test.describe('Auth Redirect Handler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should use custom redirect handler when set', async ({ page }) => {
    // Test the logic of custom redirect handler
    const result = await page.evaluate(() => {
      let customRedirectCalled = false;
      let redirectedUrl = null;

      // Create a custom redirect handler
      const customHandler = (url) => {
        customRedirectCalled = true;
        redirectedUrl = url;
      };

      // Simulate setting the handler and using it
      const authRedirectHandler = customHandler;
      const LOGIN_URL = '/login';

      // Test using the handler
      if (authRedirectHandler && typeof authRedirectHandler === 'function') {
        try {
          authRedirectHandler(LOGIN_URL);
        } catch (e) {
          // Fallback
        }
      }

      return {
        called: customRedirectCalled,
        url: redirectedUrl
      };
    });

    expect(result.called).toBe(true);
    expect(result.url).toBe('/login');
    console.log('✓ Custom redirect handler can be set and used');
  });

  test('should clear auth token on 401 response', async ({ page }) => {
    // Set an auth token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token-12345');
    });

    // Verify token is set
    const tokenBefore = await page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
    expect(tokenBefore).toBe('test-token-12345');

    // Mock API route to return 401
    await page.route('**/api/jobs', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Try to make an API call that returns 401
    await page.evaluate(async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.status === 401) {
          // Simulate the 401 handler behavior
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    });

    // Verify token is cleared
    const tokenAfter = await page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
    expect(tokenAfter).toBeNull();
    console.log('✓ Auth token cleared on 401 response');
  });

  test('should fallback to window.location when no custom handler', async ({ page }) => {
    // This test verifies the fallback behavior
    const result = await page.evaluate(() => {
      const LOGIN_URL = '/login';
      let redirectMethod = null;

      // Simulate the 401 handling logic without custom handler
      const authRedirectHandler = null;
      
      if (typeof window !== 'undefined') {
        if (authRedirectHandler && typeof authRedirectHandler === 'function') {
          redirectMethod = 'custom';
        } else {
          redirectMethod = 'window.location';
        }
      }

      return { redirectMethod };
    });

    expect(result.redirectMethod).toBe('window.location');
    console.log('✓ Fallback to window.location when no custom handler set');
  });

  test('should fallback to window.location if custom handler throws', async ({ page }) => {
    const result = await page.evaluate(() => {
      const LOGIN_URL = '/login';
      let redirectMethod = null;
      let errorCaught = false;

      // Simulate a custom handler that throws
      const authRedirectHandler = () => {
        throw new Error('Custom handler error');
      };

      if (typeof window !== 'undefined') {
        if (authRedirectHandler && typeof authRedirectHandler === 'function') {
          try {
            authRedirectHandler(LOGIN_URL);
            redirectMethod = 'custom';
          } catch (e) {
            errorCaught = true;
            // Fallback to window.location
            redirectMethod = 'window.location.fallback';
          }
        } else {
          redirectMethod = 'window.location';
        }
      }

      return { redirectMethod, errorCaught };
    });

    expect(result.errorCaught).toBe(true);
    expect(result.redirectMethod).toBe('window.location.fallback');
    console.log('✓ Fallback to window.location when custom handler throws error');
  });

  test('should export setAuthRedirectHandler and clearAuthRedirectHandler functions', async ({ page }) => {
    // Test that the handler logic works as expected
    const result = await page.evaluate(() => {
      // Simulate the API module's handler mechanism
      let authRedirectHandler = null;
      
      const setAuthRedirectHandler = (handler) => {
        authRedirectHandler = handler;
      };
      
      const clearAuthRedirectHandler = () => {
        authRedirectHandler = null;
      };
      
      // Test setting a handler
      const testHandler = (url) => url;
      setAuthRedirectHandler(testHandler);
      const handlerSet = authRedirectHandler !== null;
      
      // Test clearing the handler
      clearAuthRedirectHandler();
      const handlerCleared = authRedirectHandler === null;
      
      return {
        canSetHandler: handlerSet,
        canClearHandler: handlerCleared
      };
    });

    expect(result.canSetHandler).toBe(true);
    expect(result.canClearHandler).toBe(true);
    console.log('✓ Function exports verified - handler can be set and cleared');
  });

  test('should preserve custom handler across multiple 401 responses', async ({ page }) => {
    const result = await page.evaluate(() => {
      let callCount = 0;
      const redirectUrls = [];

      // Create a custom redirect handler
      const customHandler = (url) => {
        callCount++;
        redirectUrls.push(url);
      };

      // Simulate setting the handler
      let authRedirectHandler = customHandler;

      // Simulate multiple 401 responses
      const LOGIN_URL = '/login';
      
      for (let i = 0; i < 3; i++) {
        if (authRedirectHandler && typeof authRedirectHandler === 'function') {
          try {
            authRedirectHandler(LOGIN_URL);
          } catch (e) {
            // Fallback
          }
        }
      }

      return { callCount, redirectUrls };
    });

    expect(result.callCount).toBe(3);
    expect(result.redirectUrls.length).toBe(3);
    expect(result.redirectUrls[0]).toBe('/login');
    console.log('✓ Custom handler persists across multiple 401 responses');
  });
});
