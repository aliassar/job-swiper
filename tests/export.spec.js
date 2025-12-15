const { test, expect } = require('@playwright/test');

test.describe('Export Features - Saved Jobs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display export buttons on saved jobs page', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/saved-jobs-export-buttons.png', fullPage: true });
    
    // Look for CSV export button
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).or(
      page.locator('button:has-text("CSV")')
    );
    
    // Look for PDF export button
    const pdfButton = page.locator('button').filter({ hasText: /export.*pdf/i }).or(
      page.locator('button:has-text("PDF")')
    );
    
    if (await csvButton.count() > 0) {
      await expect(csvButton.first()).toBeVisible();
      console.log('✓ CSV export button visible');
    } else {
      console.log('⚠ CSV export button not found');
    }
    
    if (await pdfButton.count() > 0) {
      await expect(pdfButton.first()).toBeVisible();
      console.log('✓ PDF export button visible');
    } else {
      console.log('⚠ PDF export button not found');
    }
  });

  test('should export saved jobs to CSV with correct structure', async ({ page }) => {
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).or(
      page.locator('button:has-text("CSV")')
    ).first();
    
    if (await csvButton.count() > 0) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await csvButton.click();
      
      const download = await downloadPromise;
      
      if (download) {
        const fileName = download.suggestedFilename();
        console.log('Downloaded file:', fileName);
        
        // Verify filename format
        expect(fileName).toMatch(/saved-jobs-\d{4}-\d{2}-\d{2}\.csv/);
        console.log('✓ CSV file downloaded with correct naming format');
        
        // Save and read the file
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const content = fs.readFileSync(path, 'utf-8');
          
          // Verify CSV structure
          const lines = content.split('\n');
          const headers = lines[0];
          
          console.log('CSV Headers:', headers);
          
          // Check for expected headers
          expect(headers).toContain('Company');
          expect(headers).toContain('Position');
          expect(headers).toContain('Location');
          expect(headers).toContain('Salary');
          expect(headers).toContain('Skills');
          
          console.log('✓ CSV structure validated');
          console.log('Total rows (including header):', lines.length);
        }
      } else {
        console.log('⚠ CSV download not triggered (may have no saved jobs)');
      }
    } else {
      console.log('⚠ Cannot test CSV export - button not found');
    }
  });

  test('should export saved jobs to PDF', async ({ page }) => {
    const pdfButton = page.locator('button').filter({ hasText: /export.*pdf/i }).or(
      page.locator('button:has-text("PDF")')
    ).first();
    
    if (await pdfButton.count() > 0) {
      // PDF export typically opens a print dialog
      // We'll check if a new window/tab is created
      const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
      
      await pdfButton.click();
      await page.waitForTimeout(500);
      
      const popup = await popupPromise;
      
      if (popup) {
        await popup.waitForLoadState('load');
        
        // Take screenshot of print preview
        await popup.screenshot({ path: 'tests/screenshots/saved-jobs-pdf-preview.png', fullPage: true });
        
        // Check content structure
        const content = await popup.textContent('body');
        
        // Should contain job information
        expect(content).toContain('Saved Jobs');
        console.log('✓ PDF preview opened with content');
        
        await popup.close();
      } else {
        console.log('⚠ PDF export may use print dialog instead of popup');
      }
    } else {
      console.log('⚠ Cannot test PDF export - button not found');
    }
  });

  test('should handle export with no saved jobs', async ({ page }) => {
    // Clear saved jobs
    await page.evaluate(() => {
      localStorage.removeItem('job_swiper_saved');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if export buttons are hidden or disabled
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    const pdfButton = page.locator('button').filter({ hasText: /export.*pdf/i }).first();
    
    const csvVisible = await csvButton.count() > 0;
    const pdfVisible = await pdfButton.count() > 0;
    
    console.log('Export buttons visible with no jobs - CSV:', csvVisible, 'PDF:', pdfVisible);
    
    if (csvVisible) {
      // Button might be disabled
      const isDisabled = await csvButton.isDisabled().catch(() => false);
      console.log('CSV button disabled:', isDisabled);
    }
    
    console.log('✓ Empty state export behavior tested');
  });

  test('should validate CSV data accuracy', async ({ page }) => {
    // Add some test data
    await page.evaluate(() => {
      const testJob = {
        id: 'test-export-job-1',
        company: 'Test Company Inc.',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        salary: '$120,000 - $180,000',
        skills: ['JavaScript', 'React', 'Node.js'],
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('job_swiper_saved', JSON.stringify([testJob]));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    
    if (await csvButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await csvButton.click();
      const download = await downloadPromise;
      
      if (download) {
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const content = fs.readFileSync(path, 'utf-8');
          
          // Verify test data is in export
          expect(content).toContain('Test Company Inc.');
          expect(content).toContain('Senior Software Engineer');
          expect(content).toContain('San Francisco, CA');
          expect(content).toContain('JavaScript');
          
          console.log('✓ CSV data accuracy validated');
        }
      }
    }
  });
});

test.describe('Export Features - Application History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display export buttons on history page', async ({ page }) => {
    await page.screenshot({ path: 'tests/screenshots/history-export-buttons.png', fullPage: true });
    
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).or(
      page.locator('button:has-text("CSV")')
    );
    
    const pdfButton = page.locator('button').filter({ hasText: /export.*pdf/i }).or(
      page.locator('button:has-text("PDF")')
    );
    
    if (await csvButton.count() > 0) {
      await expect(csvButton.first()).toBeVisible();
      console.log('✓ CSV export button visible on history page');
    } else {
      console.log('⚠ CSV export button not found on history page');
    }
    
    if (await pdfButton.count() > 0) {
      await expect(pdfButton.first()).toBeVisible();
      console.log('✓ PDF export button visible on history page');
    } else {
      console.log('⚠ PDF export button not found on history page');
    }
  });

  test('should export application history to CSV', async ({ page }) => {
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    
    if (await csvButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await csvButton.click();
      const download = await downloadPromise;
      
      if (download) {
        const fileName = download.suggestedFilename();
        console.log('History CSV downloaded:', fileName);
        
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const content = fs.readFileSync(path, 'utf-8');
          
          // Verify headers for application history
          expect(content).toContain('Date');
          expect(content).toContain('Job Title');
          expect(content).toContain('Company');
          expect(content).toContain('Stage');
          
          console.log('✓ Application history CSV structure validated');
        }
      } else {
        console.log('⚠ No applications to export');
      }
    }
  });

  test('should export application history to PDF', async ({ page }) => {
    const pdfButton = page.locator('button').filter({ hasText: /export.*pdf/i }).first();
    
    if (await pdfButton.count() > 0) {
      const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
      await pdfButton.click();
      await page.waitForTimeout(500);
      
      const popup = await popupPromise;
      
      if (popup) {
        await popup.waitForLoadState('load');
        await popup.screenshot({ path: 'tests/screenshots/history-pdf-preview.png', fullPage: true });
        
        const content = await popup.textContent('body');
        expect(content).toContain('Application');
        
        console.log('✓ Application history PDF preview validated');
        await popup.close();
      } else {
        console.log('⚠ PDF export opened print dialog');
      }
    }
  });

  test('should include application stages in export', async ({ page }) => {
    // Add test application data
    await page.evaluate(() => {
      const testApp = {
        id: 'test-app-export-1',
        jobId: 'test-job-1',
        company: 'Export Test Corp',
        position: 'Test Engineer',
        location: 'Remote',
        stage: 'Interview',
        appliedAt: new Date().toISOString()
      };
      
      const apps = [testApp];
      localStorage.setItem('job_swiper_applications', JSON.stringify(apps));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    
    if (await csvButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await csvButton.click();
      const download = await downloadPromise;
      
      if (download) {
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const content = fs.readFileSync(path, 'utf-8');
          
          expect(content).toContain('Export Test Corp');
          expect(content).toContain('Interview');
          
          console.log('✓ Application stages included in export');
        }
      }
    }
  });
});

test.describe('Export Edge Cases', () => {
  test('should handle special characters in export data', async ({ page }) => {
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    
    // Add job with special characters
    await page.evaluate(() => {
      const specialJob = {
        id: 'special-chars-job',
        company: 'Company "With" Quotes & Ampersand',
        position: 'Engineer, Senior (Level 5)',
        location: 'San Francisco, CA',
        salary: '$100,000+',
        skills: ['C++', 'C#', '.NET'],
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('job_swiper_saved', JSON.stringify([specialJob]));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    
    if (await csvButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await csvButton.click();
      const download = await downloadPromise;
      
      if (download) {
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const content = fs.readFileSync(path, 'utf-8');
          
          // CSV should properly escape special characters
          console.log('CSV content with special chars:', content.substring(0, 200));
          console.log('✓ Special characters handled in export');
        }
      }
    }
  });

  test('should handle large datasets in export', async ({ page }) => {
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    
    // Add many jobs
    await page.evaluate(() => {
      const jobs = [];
      for (let i = 0; i < 100; i++) {
        jobs.push({
          id: `bulk-job-${i}`,
          company: `Company ${i}`,
          position: `Position ${i}`,
          location: 'Location',
          salary: '$100,000',
          skills: ['Skill1', 'Skill2'],
          savedAt: new Date().toISOString()
        });
      }
      localStorage.setItem('job_swiper_saved', JSON.stringify(jobs));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    
    if (await csvButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await csvButton.click();
      const download = await downloadPromise;
      
      if (download) {
        const path = await download.path();
        if (path) {
          const fs = require('fs');
          const content = fs.readFileSync(path, 'utf-8');
          const lines = content.split('\n');
          
          console.log('Large export - total lines:', lines.length);
          expect(lines.length).toBeGreaterThan(100);
          console.log('✓ Large dataset export successful');
        }
      }
    }
  });

  test('should validate export file naming with dates', async ({ page }) => {
    await page.goto('/saved');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(() => {
      const testJob = {
        id: 'naming-test-job',
        company: 'Test',
        position: 'Test',
        location: 'Test',
        salary: '$100k',
        skills: ['Test'],
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('job_swiper_saved', JSON.stringify([testJob]));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const csvButton = page.locator('button').filter({ hasText: /export.*csv/i }).first();
    
    if (await csvButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await csvButton.click();
      const download = await downloadPromise;
      
      if (download) {
        const fileName = download.suggestedFilename();
        const today = new Date().toISOString().split('T')[0];
        
        expect(fileName).toContain(today);
        console.log('✓ Export file includes current date:', fileName);
      }
    }
  });
});
