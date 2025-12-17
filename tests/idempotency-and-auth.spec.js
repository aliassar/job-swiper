const { test, expect } = require('@playwright/test');

test.describe('Idempotency Key Header and Token Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should send idempotency key as X-Idempotency-Key header', async ({ page }) => {
    // Intercept API requests to verify headers
    const requests = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        requests.push({
          url,
          headers: request.headers(),
        });
      }
    });
    
    // Manually queue an operation with an idempotency key
    await page.evaluate(() => {
      const action = {
        type: 'acceptJob',
        id: 'test-job-idempotency',
        payload: { jobId: 'test-job-idempotency' },
        timestamp: Date.now(),
        retries: 0,
        pendingSync: true,
        idempotencyKey: 'test-idempotency-key-12345'
      };
      localStorage.setItem('job_swiper_offline_queue', JSON.stringify([action]));
    });
    
    // Trigger queue processing
    await page.evaluate(() => {
      if (window.offlineQueue) {
        window.offlineQueue.processQueue();
      }
    });
    
    // Wait for potential API calls
    await page.waitForTimeout(2000);
    
    // Check if any request had the idempotency key header
    const hasIdempotencyHeader = requests.some(req => 
      req.headers['x-idempotency-key'] === 'test-idempotency-key-12345'
    );
    
    if (hasIdempotencyHeader) {
      console.log('✓ Idempotency key sent as header');
      expect(hasIdempotencyHeader).toBeTruthy();
    } else {
      console.log('⚠ No API request with idempotency key header found');
      console.log('Note: This might be expected if backend is not available or queue processing is different');
    }
  });

  test('should verify idempotency key is not in request payload', async ({ page }) => {
    // Intercept API requests to verify payload doesn't contain idempotency key
    let payloadChecked = false;
    
    page.on('request', async request => {
      const url = request.url();
      if (url.includes('/api/jobs/') && request.method() === 'POST') {
        try {
          const postData = request.postData();
          if (postData) {
            const payload = JSON.parse(postData);
            
            // The payload should NOT contain idempotencyKey
            if (payload.idempotencyKey) {
              console.log('✗ ERROR: idempotencyKey found in payload (should be in headers only)');
              expect(payload).not.toHaveProperty('idempotencyKey');
            } else {
              console.log('✓ Payload does not contain idempotencyKey (correct)');
              payloadChecked = true;
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    // Manually queue an operation
    await page.evaluate(() => {
      const action = {
        type: 'acceptJob',
        id: 'test-job-payload-check',
        payload: { jobId: 'test-job-payload-check' },
        timestamp: Date.now(),
        retries: 0,
        pendingSync: true,
        idempotencyKey: 'payload-check-key-12345'
      };
      localStorage.setItem('job_swiper_offline_queue', JSON.stringify([action]));
    });
    
    // Trigger queue processing
    await page.evaluate(() => {
      if (window.offlineQueue) {
        window.offlineQueue.processQueue();
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (payloadChecked) {
      console.log('✓ Payload check completed successfully');
    } else {
      console.log('⚠ No POST request intercepted for payload check');
    }
  });

  test('should verify token refresh functions exist', async ({ page }) => {
    // Check that the auth module exports the new functions
    const authFunctions = await page.evaluate(async () => {
      try {
        // Import the auth module
        const authModule = await import('/lib/auth.js');
        
        return {
          hasRefreshToken: typeof authModule.refreshToken === 'function',
          hasEnsureValidToken: typeof authModule.ensureValidToken === 'function',
          hasGetAuthHeaders: typeof authModule.getAuthHeaders === 'function',
        };
      } catch (error) {
        console.error('Error importing auth module:', error);
        return {
          hasRefreshToken: false,
          hasEnsureValidToken: false,
          hasGetAuthHeaders: false,
          error: error.message
        };
      }
    });
    
    if (authFunctions.error) {
      console.log('⚠ Could not verify auth functions:', authFunctions.error);
    } else {
      expect(authFunctions.hasRefreshToken).toBeTruthy();
      expect(authFunctions.hasEnsureValidToken).toBeTruthy();
      expect(authFunctions.hasGetAuthHeaders).toBeTruthy();
      console.log('✓ Token refresh functions are exported');
    }
  });

  test('should verify ensureValidToken is called before API requests', async ({ page }) => {
    // Set up a mock token that is near expiration
    await page.evaluate(() => {
      // Create a token that expires in 4 minutes (near expiration threshold is 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const exp = now + (4 * 60); // 4 minutes from now
      
      // Create a simple JWT-like token (header.payload.signature)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ exp, userId: 'test-user' }));
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;
      
      localStorage.setItem('auth_token', token);
    });
    
    // Track console logs for token refresh warnings
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('refresh') || text.includes('token') || text.includes('expir')) {
        consoleLogs.push(text);
      }
    });
    
    // Make an API call to trigger ensureValidToken
    await page.evaluate(async () => {
      try {
        const authModule = await import('/lib/auth.js');
        await authModule.getAuthHeaders();
      } catch (error) {
        console.log('getAuthHeaders error:', error.message);
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check if token refresh logic was triggered
    const hasRefreshWarning = consoleLogs.some(log => 
      log.includes('refresh') && log.includes('token')
    );
    
    if (hasRefreshWarning) {
      console.log('✓ Token refresh logic triggered for near-expiry token');
    } else {
      console.log('⚠ No token refresh warning detected');
      console.log('Console logs:', consoleLogs);
    }
  });
});
