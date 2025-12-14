const { test, expect } = require('@playwright/test');

test.describe('Job Swiper - Main Features', () => {
  test('should display job cards with salary information', async ({ page }) => {
    await page.goto('/');
    
    // Wait for job card to load
    await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
    
    // Take screenshot of main page
    await page.screenshot({ path: 'tests/screenshots/01-main-job-card.png', fullPage: true });
    
    // Verify job card elements
    const jobCard = page.locator('[data-testid="job-card"]').first();
    await expect(jobCard).toBeVisible();
    
    // Check if salary badge exists (if available)
    const salaryBadge = jobCard.locator('text=/\\$\\d+/');
    if (await salaryBadge.count() > 0) {
      await expect(salaryBadge.first()).toBeVisible();
    }
  });

  test('should show auto-apply toggle with tooltip', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for auto-apply toggle button
    const autoApplyButton = page.locator('button').filter({ hasText: /auto.*apply/i }).or(
      page.locator('[aria-label*="auto"]')
    );
    
    if (await autoApplyButton.count() > 0) {
      await autoApplyButton.first().screenshot({ path: 'tests/screenshots/02-auto-apply-button.png' });
    }
    
    await page.screenshot({ path: 'tests/screenshots/02-main-with-controls.png', fullPage: true });
  });

  test('should display filter button and modal', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    
    // Look for filter button
    const filterButton = page.locator('button').filter({ hasText: /filter/i }).or(
      page.locator('[aria-label*="filter"]').or(page.locator('[data-testid="filter-button"]'))
    );
    
    if (await filterButton.count() > 0) {
      await filterButton.first().click();
      
      // Wait for modal to appear
      await page.waitForTimeout(500);
      
      // Take screenshot of filter modal
      await page.screenshot({ path: 'tests/screenshots/03-filter-modal.png', fullPage: true });
      
      // Check for salary range inputs
      const minSalaryInput = page.locator('input[placeholder*="min"]').or(
        page.locator('label:has-text("Minimum") + input')
      );
      const maxSalaryInput = page.locator('input[placeholder*="max"]').or(
        page.locator('label:has-text("Maximum") + input')
      );
      
      // Verify filter inputs exist
      if (await minSalaryInput.count() > 0) {
        await expect(minSalaryInput.first()).toBeVisible();
      }
      if (await maxSalaryInput.count() > 0) {
        await expect(maxSalaryInput.first()).toBeVisible();
      }
    }
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/');
    
    // Click hamburger menu
    const menuButton = page.locator('button').filter({ hasText: /menu/i }).or(
      page.locator('[aria-label*="menu"]').or(page.locator('button svg'))
    ).first();
    
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Take screenshot of menu
    await page.screenshot({ path: 'tests/screenshots/04-hamburger-menu.png', fullPage: true });
    
    // Click settings link
    const settingsLink = page.locator('a[href="/settings"]');
    if (await settingsLink.count() > 0) {
      await settingsLink.click();
      await page.waitForURL('**/settings');
      
      // Take screenshot of settings page
      await page.screenshot({ path: 'tests/screenshots/05-settings-page.png', fullPage: true });
    }
  });
});

test.describe('Settings Page Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display automation settings section', async ({ page }) => {
    // Check for Application Automation section
    const automationHeading = page.locator('text=/Application Automation/i');
    if (await automationHeading.count() > 0) {
      await expect(automationHeading).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/06-settings-automation.png', fullPage: true });
    
    // Check for specific toggles
    const fakeJobsToggle = page.locator('text=/filter.*fake.*jobs/i');
    const autoFollowUpToggle = page.locator('text=/auto.*follow.*up/i');
    
    if (await fakeJobsToggle.count() > 0) {
      await expect(fakeJobsToggle.first()).toBeVisible();
    }
    if (await autoFollowUpToggle.count() > 0) {
      await expect(autoFollowUpToggle.first()).toBeVisible();
    }
  });

  test('should have document upload section', async ({ page }) => {
    // Look for upload section
    const uploadSection = page.locator('text=/upload/i').or(
      page.locator('text=/document/i')
    );
    
    if (await uploadSection.count() > 0) {
      // Scroll to uploads section
      await uploadSection.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: 'tests/screenshots/07-settings-documents.png', fullPage: true });
    }
  });

  test('should navigate to user settings', async ({ page }) => {
    const userSettingsLink = page.locator('a[href="/user-settings"]').or(
      page.locator('text=/user settings/i')
    );
    
    if (await userSettingsLink.count() > 0) {
      await userSettingsLink.click();
      await page.waitForURL('**/user-settings');
      
      await page.screenshot({ path: 'tests/screenshots/08-user-settings.png', fullPage: true });
      
      // Check for GitHub field
      const githubInput = page.locator('input[placeholder*="github"]');
      if (await githubInput.count() > 0) {
        await expect(githubInput.first()).toBeVisible();
      }
    }
  });

  test('should navigate to email connection page', async ({ page }) => {
    const connectEmailButton = page.locator('button:has-text("Connect Email")').or(
      page.locator('a[href="/connect-email"]')
    );
    
    if (await connectEmailButton.count() > 0) {
      await connectEmailButton.first().click();
      await page.waitForURL('**/connect-email');
      
      await page.screenshot({ path: 'tests/screenshots/09-email-connection.png', fullPage: true });
    }
  });
});

test.describe('Notifications Page', () => {
  test('should display notifications page', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/10-notifications-page.png', fullPage: true });
    
    // Check for notification icon in header (if visible)
    await page.goto('/');
    const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
      page.locator('button').filter({ hasText: /notification/i })
    );
    
    if (await notificationIcon.count() > 0) {
      await page.screenshot({ path: 'tests/screenshots/11-notification-icon.png' });
    }
  });
});

test.describe('Job Details and Application', () => {
  test('should display saved jobs page', async ({ page }) => {
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/12-saved-jobs.png', fullPage: true });
  });

  test('should display job detail page', async ({ page }) => {
    // Try to navigate to a job detail page
    await page.goto('/');
    
    const jobCard = page.locator('[data-testid="job-card"]').or(
      page.locator('article').or(page.locator('[class*="job"]')).first()
    );
    
    if (await jobCard.count() > 0) {
      await jobCard.first().click();
      await page.waitForTimeout(1000);
      
      // Check if we're on job detail page
      const currentUrl = page.url();
      if (currentUrl.includes('/job/')) {
        await page.screenshot({ path: 'tests/screenshots/13-job-detail.png', fullPage: true });
        
        // Check for salary display
        const salaryBadge = page.locator('text=/\\$\\d+/');
        if (await salaryBadge.count() > 0) {
          await salaryBadge.first().screenshot({ path: 'tests/screenshots/14-job-salary-badge.png' });
        }
      }
    }
  });

  test('should display application page with timeline', async ({ page }) => {
    // Navigate to applications list
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/15-applications-list.png', fullPage: true });
    
    // Try to click on first application
    const firstApp = page.locator('a[href*="/application/"]').first();
    if (await firstApp.count() > 0) {
      await firstApp.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of application detail
      await page.screenshot({ path: 'tests/screenshots/16-application-detail.png', fullPage: true });
      
      // Check for timeline
      const timeline = page.locator('[data-testid="timeline"]').or(
        page.locator('text=/timeline/i')
      );
      
      if (await timeline.count() > 0) {
        await timeline.first().screenshot({ path: 'tests/screenshots/17-application-timeline.png' });
      }
      
      // Check for auto-update toggle
      const autoUpdateToggle = page.locator('text=/auto.*update/i');
      if (await autoUpdateToggle.count() > 0) {
        await autoUpdateToggle.first().screenshot({ path: 'tests/screenshots/18-auto-update-toggle.png' });
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/19-mobile-main.png', fullPage: true });
    
    // Test hamburger menu on mobile
    const menuButton = page.locator('button').first();
    await menuButton.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'tests/screenshots/20-mobile-menu.png', fullPage: true });
  });

  test('should display settings correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/screenshots/21-mobile-settings.png', fullPage: true });
  });
});
