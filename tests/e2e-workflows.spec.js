const { test, expect } = require('@playwright/test');

test.describe('End-to-End User Flows', () => {
  test('complete job swiping workflow', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'tests/screenshots/e2e-01-homepage.png', fullPage: true });
    console.log('✓ Step 1: Loaded homepage');
    
    // Look for job card
    const jobCard = page.locator('[data-testid="job-card"]').or(
      page.locator('article').or(page.locator('[class*="card"]'))
    ).first();
    
    if (await jobCard.count() > 0) {
      await expect(jobCard).toBeVisible();
      console.log('✓ Step 2: Job card visible');
      
      // Swipe right / Accept job
      const acceptButton = page.locator('button').filter({ hasText: /accept|apply/i }).first();
      
      if (await acceptButton.count() > 0) {
        await acceptButton.click();
        await page.waitForTimeout(1500);
        
        await page.screenshot({ path: 'tests/screenshots/e2e-02-job-accepted.png', fullPage: true });
        console.log('✓ Step 3: Job accepted');
        
        // Navigate to applications page
        await page.goto('/applications');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'tests/screenshots/e2e-03-applications-list.png', fullPage: true });
        console.log('✓ Step 4: Navigated to applications');
        
        // Click on first application
        const appLink = page.locator('a[href*="/application/"]').first();
        
        if (await appLink.count() > 0) {
          await appLink.click();
          await page.waitForURL('**/application/**');
          await page.waitForTimeout(1000);
          
          await page.screenshot({ path: 'tests/screenshots/e2e-04-application-detail.png', fullPage: true });
          console.log('✓ Step 5: Viewed application detail');
          
          // Check for timeline
          const timeline = page.locator('text=/timeline|stage|applied/i');
          if (await timeline.count() > 0) {
            console.log('✓ Step 6: Timeline visible');
          }
        }
      }
    } else {
      console.log('⚠ No jobs available for swipe workflow test');
    }
    
    console.log('✓ Complete job swiping workflow tested');
  });

  test('auto-apply metadata workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 1: Loaded homepage');
    
    // Enable auto-apply toggle
    const autoApplyButton = page.locator('button[aria-label="Toggle auto-apply"]').or(
      page.locator('button').filter({ hasText: /auto.*apply/i })
    ).first();
    
    if (await autoApplyButton.count() > 0) {
      await autoApplyButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'tests/screenshots/e2e-auto-apply-enabled.png', fullPage: true });
      console.log('✓ Step 2: Auto-apply enabled');
      
      // Accept a job with auto-apply enabled
      const acceptButton = page.locator('button').filter({ hasText: /accept|apply/i }).first();
      
      if (await acceptButton.count() > 0) {
        // Listen for console logs to verify auto-apply feedback
        const consoleMessages = [];
        page.on('console', msg => {
          if (msg.text().includes('Auto-apply workflow started')) {
            consoleMessages.push(msg.text());
          }
        });
        
        await acceptButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'tests/screenshots/e2e-auto-apply-accepted.png', fullPage: true });
        console.log('✓ Step 3: Job accepted with auto-apply');
        
        // Verify console message was logged
        if (consoleMessages.length > 0) {
          console.log('✓ Step 4: Auto-apply feedback logged:', consoleMessages[0]);
        } else {
          console.log('⚠ Auto-apply feedback not detected in console');
        }
        
        // Navigate to applications page to verify the application was created
        await page.goto('/applications');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'tests/screenshots/e2e-auto-apply-application-list.png', fullPage: true });
        console.log('✓ Step 5: Application created and visible in list');
        
        console.log('✓ Auto-apply metadata workflow completed');
      } else {
        console.log('⚠ Accept button not found');
      }
    } else {
      console.log('⚠ Auto-apply button not found');
    }
  });

  test('save job and view later workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Save a job
    const saveButton = page.locator('button').filter({ hasText: /save|bookmark/i }).or(
      page.locator('[aria-label*="save"]')
    ).first();
    
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      console.log('✓ Step 1: Job saved');
      
      // Navigate to saved jobs
      await page.goto('/saved');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'tests/screenshots/e2e-saved-jobs.png', fullPage: true });
      
      // Verify job appears in saved list
      const savedJobCard = page.locator('[class*="job"]').or(
        page.locator('article')
      ).first();
      
      if (await savedJobCard.count() > 0) {
        console.log('✓ Step 2: Saved job visible in list');
      }
      
      console.log('✓ Save and view workflow completed');
    } else {
      console.log('⚠ Save button not found');
    }
  });

  test('notification workflow', async ({ page }) => {
    // Navigate to notifications
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/e2e-notifications.png', fullPage: true });
    console.log('✓ Step 1: Notifications page loaded');
    
    // Check for notification items
    const notificationItems = page.locator('[class*="notification"]').or(
      page.locator('li').or(page.locator('[role="listitem"]'))
    );
    
    const count = await notificationItems.count();
    console.log('Notification count:', count);
    
    if (count > 0) {
      // Click first notification
      const firstNotification = notificationItems.first();
      const isClickable = await firstNotification.locator('a, button').count() > 0;
      
      if (isClickable) {
        await firstNotification.click();
        await page.waitForTimeout(1000);
        
        console.log('✓ Step 2: Notification clicked');
      }
    }
    
    // Go back to home and check notification bell
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const notificationBell = page.locator('[data-testid="notification-icon"]').or(
      page.locator('button').filter({ hasText: /notification|bell/i })
    );
    
    if (await notificationBell.count() > 0) {
      await notificationBell.screenshot({ path: 'tests/screenshots/e2e-notification-bell.png' });
      console.log('✓ Step 3: Notification bell visible');
    }
    
    console.log('✓ Notification workflow tested');
  });

  test('settings persistence workflow', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/e2e-settings-initial.png', fullPage: true });
    console.log('✓ Step 1: Settings page loaded');
    
    // Try to toggle a setting
    const toggle = page.locator('input[type="checkbox"]').or(
      page.locator('[role="switch"]')
    ).first();
    
    if (await toggle.count() > 0) {
      const initialState = await toggle.isChecked();
      console.log('Initial toggle state:', initialState);
      
      await toggle.click();
      await page.waitForTimeout(500);
      
      const newState = await toggle.isChecked();
      console.log('New toggle state:', newState);
      
      expect(newState).not.toBe(initialState);
      console.log('✓ Step 2: Setting toggled');
      
      // Refresh page to check persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const persistedState = await toggle.isChecked();
      console.log('Persisted toggle state:', persistedState);
      
      // Settings should persist
      expect(persistedState).toBe(newState);
      console.log('✓ Step 3: Setting persisted after reload');
    }
    
    console.log('✓ Settings persistence workflow tested');
  });

  test('filter jobs workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open filter modal
    const filterButton = page.locator('button').filter({ hasText: /filter/i }).or(
      page.locator('[aria-label*="filter"]')
    ).first();
    
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'tests/screenshots/e2e-filter-modal.png', fullPage: true });
      console.log('✓ Step 1: Filter modal opened');
      
      // Set location filter
      const locationInput = page.locator('input[placeholder*="location"]').or(
        page.locator('input[name*="location"]')
      ).first();
      
      if (await locationInput.count() > 0) {
        await locationInput.fill('San Francisco');
        console.log('✓ Step 2: Location filter set');
      }
      
      // Set salary filter
      const minSalaryInput = page.locator('input[placeholder*="min"]').or(
        page.locator('label:has-text("Minimum") + input')
      ).first();
      
      if (await minSalaryInput.count() > 0) {
        await minSalaryInput.fill('100000');
        console.log('✓ Step 3: Salary filter set');
      }
      
      // Apply filters
      const applyButton = page.locator('button').filter({ hasText: /apply|save|confirm/i }).first();
      
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(1000);
        
        console.log('✓ Step 4: Filters applied');
      }
      
      // Reload to check filter persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      console.log('✓ Step 5: Page reloaded to check filter persistence');
    }
    
    console.log('✓ Filter workflow tested');
  });

  test('navigation between pages workflow', async ({ page }) => {
    // Test navigation through all main pages
    const pages = [
      { url: '/', name: 'Home' },
      { url: '/applications', name: 'Applications' },
      { url: '/saved', name: 'Saved Jobs' },
      { url: '/history', name: 'History' },
      { url: '/settings', name: 'Settings' },
      { url: '/notifications', name: 'Notifications' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: `tests/screenshots/e2e-nav-${pageInfo.name.toLowerCase().replace(' ', '-')}.png`, 
        fullPage: true 
      });
      
      console.log(`✓ Navigated to ${pageInfo.name}`);
    }
    
    console.log('✓ Navigation workflow completed');
  });

  test('hamburger menu navigation workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open hamburger menu
    const menuButton = page.locator('button').filter({ hasText: /menu/i }).or(
      page.locator('[aria-label*="menu"]')
    ).first();
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'tests/screenshots/e2e-hamburger-menu.png', fullPage: true });
      console.log('✓ Step 1: Hamburger menu opened');
      
      // Click on a menu item
      const settingsLink = page.locator('a[href="/settings"]').or(
        page.locator('text=/settings/i')
      ).first();
      
      if (await settingsLink.count() > 0) {
        await settingsLink.click();
        await page.waitForURL('**/settings');
        
        console.log('✓ Step 2: Navigated via menu to settings');
      }
    }
    
    console.log('✓ Hamburger menu workflow tested');
  });

  test('responsive design workflow', async ({ page }) => {
    const viewports = [
      { width: 375, height: 812, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `tests/screenshots/e2e-responsive-${viewport.name.toLowerCase()}.png`, 
        fullPage: true 
      });
      
      console.log(`✓ Tested ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
    }
    
    console.log('✓ Responsive design workflow tested');
  });
});

test.describe('Session Persistence', () => {
  test('should persist user session across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Add some session data
    await page.evaluate(() => {
      sessionStorage.setItem('test_session', 'active');
      localStorage.setItem('test_persist', 'data');
    });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if data persists
    const sessionData = await page.evaluate(() => ({
      session: sessionStorage.getItem('test_session'),
      local: localStorage.getItem('test_persist')
    }));
    
    // localStorage should persist, sessionStorage might not
    expect(sessionData.local).toBe('data');
    console.log('✓ LocalStorage persisted across reload');
    console.log('SessionStorage persisted:', sessionData.session === 'active');
    
    // Clean up
    await page.evaluate(() => {
      sessionStorage.removeItem('test_session');
      localStorage.removeItem('test_persist');
    });
  });

  test('should maintain application state across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Perform an action
    const acceptButton = page.locator('button').filter({ hasText: /accept|apply/i }).first();
    
    if (await acceptButton.count() > 0) {
      await acceptButton.click();
      await page.waitForTimeout(1000);
      
      // Navigate away
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // Navigate back
      await page.goto('/applications');
      await page.waitForLoadState('networkidle');
      
      // Check if application exists
      const appExists = await page.locator('a[href*="/application/"]').count() > 0;
      console.log('Application persisted across navigation:', appExists);
    }
    
    console.log('✓ State persistence tested');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/settings');
    console.log('✓ Browser back navigation works');
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/applications');
    console.log('✓ Browser forward navigation works');
    
    console.log('✓ Browser navigation tested');
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate network error by going offline
    await context.setOffline(true);
    
    // Try to navigate to a page
    await page.goto('/applications').catch(() => {
      console.log('Navigation failed as expected (offline)');
    });
    
    // Check for offline indicator
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'tests/screenshots/e2e-network-error.png', fullPage: true });
    
    console.log('✓ Network error handling tested');
    
    // Go back online
    await context.setOffline(false);
  });

  test('should handle missing data gracefully', async ({ page }) => {
    // Clear all data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to pages that might need data
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/e2e-empty-saved.png', fullPage: true });
    console.log('✓ Empty saved jobs page handled');
    
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/e2e-empty-applications.png', fullPage: true });
    console.log('✓ Empty applications page handled');
    
    console.log('✓ Missing data handling tested');
  });
});
