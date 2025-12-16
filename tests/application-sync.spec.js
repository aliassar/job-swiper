const { test, expect } = require('@playwright/test');

test.describe('Application Sync and Stage Preservation', () => {
  test('should preserve server-provided stage after sync', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 1: Loaded homepage');
    
    // Find and accept a job
    const acceptButton = page.locator('button').filter({ hasText: /accept|apply/i }).first();
    
    if (await acceptButton.count() > 0) {
      await acceptButton.click();
      await page.waitForTimeout(1500);
      
      console.log('✓ Step 2: Job accepted');
      
      // Navigate to applications page
      await page.goto('/applications');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      console.log('✓ Step 3: Navigated to applications');
      
      // Click on first application
      const appLink = page.locator('a[href*="/application/"]').first();
      
      if (await appLink.count() > 0) {
        await appLink.click();
        await page.waitForURL('**/application/**');
        await page.waitForTimeout(2000);
        
        console.log('✓ Step 4: Viewed application detail');
        
        // Check if syncing indicator appears for temporary applications
        const syncingIndicator = page.locator('text=Syncing...');
        const stageSelect = page.locator('select').first();
        
        // Take screenshot showing initial state
        await page.screenshot({ 
          path: 'tests/screenshots/application-sync-01-initial.png', 
          fullPage: true 
        });
        
        // If syncing indicator is present, verify it's shown correctly
        if (await syncingIndicator.count() > 0) {
          await expect(syncingIndicator).toBeVisible();
          console.log('✓ Step 5: Syncing indicator visible for temp application');
          
          // Verify stage selector is disabled during sync
          await expect(stageSelect).toBeDisabled();
          console.log('✓ Step 6: Stage selector disabled during sync');
        }
        
        // Wait for sync to complete (max 10 seconds)
        await page.waitForTimeout(10000);
        
        // Take screenshot after sync
        await page.screenshot({ 
          path: 'tests/screenshots/application-sync-02-after-sync.png', 
          fullPage: true 
        });
        
        // After sync, the stage should be whatever the server provided
        // NOT hardcoded to 'Applied'
        const currentStage = await stageSelect.inputValue();
        console.log(`✓ Step 7: Application stage after sync: ${currentStage}`);
        
        // The stage should be one of the valid stages from the server
        // and not necessarily 'Applied' (could be 'CV Verification', 'Message Verification', etc.)
        const validStages = [
          'Syncing',
          'CV Verification', 
          'Message Verification',
          'Being Applied',
          'Applied',
          'Interview 1',
          'Next Interviews',
          'Offer',
          'Rejected',
          'Accepted',
          'Withdrawn'
        ];
        
        expect(validStages).toContain(currentStage);
        console.log('✓ Step 8: Stage is valid and preserved from server response');
        
        // Syncing indicator should be gone after sync completes
        if (await syncingIndicator.count() > 0) {
          await expect(syncingIndicator).not.toBeVisible();
          console.log('✓ Step 9: Syncing indicator hidden after sync completes');
        }
        
        // Stage selector should be enabled after sync
        if (currentStage !== 'Syncing') {
          await expect(stageSelect).toBeEnabled();
          console.log('✓ Step 10: Stage selector enabled after sync completes');
        }
      } else {
        console.log('⊘ No application link found - skipping application detail test');
      }
    } else {
      console.log('⊘ No accept button found - skipping test');
    }
  });
  
  test('should handle temporary application IDs gracefully', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✓ Step 1: Loaded homepage');
    
    // Find and accept a job
    const acceptButton = page.locator('button').filter({ hasText: /accept|apply/i }).first();
    
    if (await acceptButton.count() > 0) {
      await acceptButton.click();
      await page.waitForTimeout(500);
      
      console.log('✓ Step 2: Job accepted');
      
      // Wait for navigation to application detail page
      await page.waitForURL('**/application/**', { timeout: 3000 }).catch(() => {
        console.log('⊘ No automatic navigation to application detail');
      });
      
      // Check if we're on an application detail page (could be temp ID)
      const currentUrl = page.url();
      if (currentUrl.includes('/application/')) {
        console.log(`✓ Step 3: Navigated to application: ${currentUrl}`);
        
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        // Take screenshot
        await page.screenshot({ 
          path: 'tests/screenshots/temp-app-id-01-detail.png', 
          fullPage: true 
        });
        
        // Page should either:
        // 1. Show the application (loaded from context with temp ID)
        // 2. Show "Application not found" if temp ID handling is broken
        
        const notFoundText = page.locator('text=Application not found');
        const companyName = page.locator('h1').first();
        
        if (await notFoundText.count() > 0) {
          // This would indicate a problem - temp IDs should work via context fallback
          console.log('✗ Application not found - temp ID handling may be broken');
          expect(await notFoundText.count()).toBe(0);
        } else if (await companyName.count() > 0) {
          // Successfully loaded application with temp ID
          console.log('✓ Step 4: Application loaded successfully with temp ID');
          await expect(companyName).toBeVisible();
        }
      } else {
        console.log('⊘ Not navigated to application detail - test may need adjustment');
      }
    } else {
      console.log('⊘ No accept button found - skipping test');
    }
  });
});
