# Testing Guide for Full Integration & Offline Support

This document outlines comprehensive testing scenarios for the newly implemented features.

## 1. Offline Queue Testing

### Test Scenario 1.1: Basic Offline Swipe
**Steps:**
1. Open browser DevTools and go to Network tab
2. Enable "Offline" mode
3. Swipe right (accept) on a job
4. Swipe left (reject) on another job
5. Verify both actions are queued in localStorage (check Application > localStorage > job_swiper_offline_queue)
6. Disable "Offline" mode
7. Wait for automatic sync

**Expected Results:**
- Actions should be stored in queue with idempotency keys
- UI should update optimistically (jobs disappear immediately)
- Orange "Offline Mode" indicator should appear in header
- Once online, queue should process automatically
- Actions should sync to server in timestamp order

### Test Scenario 1.2: Retry with Exponential Backoff
**Steps:**
1. Mock API endpoint to fail (return 500 error) for 2 retries
2. Swipe on a job while online
3. Observe console logs for retry attempts
4. Allow API to succeed on 3rd attempt

**Expected Results:**
- First retry after 1 second (2^0 * 1000ms)
- Second retry after 2 seconds (2^1 * 1000ms)
- Third retry after 4 seconds (2^2 * 1000ms)
- Action succeeds on 3rd attempt
- Console logs show retry count and delays

### Test Scenario 1.3: Idempotency Key Prevention
**Steps:**
1. Accept a job while offline
2. Check idempotency key in queue
3. Try to accept the same job again (should not be possible in normal flow)
4. Go online and observe server request

**Expected Results:**
- Each action has unique idempotency key (type-id-timestamp)
- Server should use idempotency key to prevent duplicate processing
- No duplicate applications should be created

## 2. Notification System Testing

### Test Scenario 2.1: Notification Polling
**Steps:**
1. Open application
2. Wait 30 seconds
3. Check Network tab for notification API calls
4. Verify polling continues every 30 seconds

**Expected Results:**
- GET /api/notifications called on mount
- Subsequent calls every 30 seconds
- Unread count updates in bell icon
- Red badge shows unread count (or "9+" if more than 9)

### Test Scenario 2.2: Notification Interactions
**Steps:**
1. Click notification bell icon
2. Click on an unread notification
3. Verify navigation to application page
4. Return and check unread count

**Expected Results:**
- Panel opens with all notifications
- Clicking notification marks it as read
- Navigates to associated application
- Unread count decreases by 1
- Blue dot indicator disappears from read notification

### Test Scenario 2.3: Notification Types
**Steps:**
1. Check mock data in /api/notifications/route.js
2. Verify all 7 notification types are represented:
   - cv_ready (📄)
   - message_ready (✉️)
   - status_changed (🔄)
   - follow_up_reminder (⏰)
   - verification_needed (⚠️)
   - generation_failed (❌)
   - apply_failed (⚠️)

**Expected Results:**
- Each type has appropriate icon
- Messages are clear and actionable
- Timestamps show relative time (e.g., "2h ago")

## 3. Saved Jobs Export Testing

### Test Scenario 3.1: CSV Export
**Steps:**
1. Add several jobs to saved list
2. Click "Export CSV" button
3. Open downloaded file

**Expected Results:**
- CSV file downloads with timestamp in filename
- Contains headers: Company, Position, Location, Salary, Skills, Saved At
- Skills are semicolon-separated
- All saved jobs are included
- Opens correctly in Excel/Google Sheets

### Test Scenario 3.2: PDF Export
**Steps:**
1. Add several jobs to saved list
2. Click "Export PDF" button
3. Review print preview
4. Save as PDF or print

**Expected Results:**
- Print dialog opens with styled content
- Jobs are well-formatted with company logos
- Skills appear as tags
- Page breaks appropriately
- Header shows "Saved Jobs - [Date]"

### Test Scenario 3.3: Navigation to Applications
**Steps:**
1. Accept a job (creates application)
2. Save the same job
3. Go to Saved Jobs page
4. Click on the saved job that has an application

**Expected Results:**
- Job shows "📋 View Application" badge
- Clicking navigates to /application/[id] page
- Application details are displayed

## 4. Application Page Testing

### Test Scenario 4.1: API Integration
**Steps:**
1. Accept a job
2. Navigate to application page
3. Check Network tab for API call
4. Verify data matches

**Expected Results:**
- GET /api/applications/[id] is called on mount
- Loading spinner shows while fetching
- Application data displays correctly
- Falls back to context if API fails

### Test Scenario 4.2: Notes Functionality
**Steps:**
1. Open an application
2. Click "Add Notes"
3. Type "Interview scheduled for Monday at 2pm"
4. Click "Save Notes"
5. Refresh page

**Expected Results:**
- Notes section appears with textarea
- Save button shows loading state
- PUT /api/applications/[id]/notes is called
- Notes persist after refresh
- Edit button appears once saved
- Can edit and cancel changes

## 5. Rollback Enhancement Testing

### Test Scenario 5.1: Rollback Retry on Failure
**Steps:**
1. Accept a job
2. Click rollback/undo button
3. Mock rollback API to fail temporarily
4. Observe retry behavior

**Expected Results:**
- Rollback queued to offline queue
- Retries with exponential backoff
- Console logs show retry attempts
- Eventually succeeds and syncs to server
- Job returns to pending state

## 6. Filters and Job Count Testing

### Test Scenario 6.1: Filter Persistence
**Steps:**
1. Open filter panel
2. Set location to "San Francisco"
3. Set min salary to "100000"
4. Apply filters
5. Refresh page

**Expected Results:**
- Filters persist in localStorage
- Jobs are filtered correctly
- Remaining count updates
- Filters remain active after refresh

### Test Scenario 6.2: Job Count API
**Steps:**
1. Check Network tab
2. Look for /api/jobs?countOnly=true call

**Expected Results:**
- API returns { count: X }
- Count matches number of pending jobs
- Respects active filters

## 7. Edge Cases and Error Handling

### Test Scenario 7.1: Offline to Online Transition
**Steps:**
1. Go offline
2. Perform 5-10 swipe actions
3. Go online mid-action
4. Observe sync behavior

**Expected Results:**
- All queued actions sync in order
- No duplicate submissions
- UI remains responsive
- Offline indicator disappears

### Test Scenario 7.2: Queue Maximum Age
**Steps:**
1. Add action to queue
2. Manually modify timestamp to be 8 days old
3. Reload page

**Expected Results:**
- Old action is discarded (> 7 days)
- Console log shows discard message
- Queue only contains recent actions

### Test Scenario 7.3: Maximum Retries
**Steps:**
1. Mock API to always fail
2. Perform a swipe action
3. Wait for all retries to exhaust

**Expected Results:**
- Retries 3 times (MAX_QUEUE_RETRIES)
- After 3 failures, action is removed from queue
- Error logged to console
- User could be notified (toast - to be implemented)

## 8. Multi-Device Scenarios

### Test Scenario 8.1: Same Account, Different Devices
**Steps:**
1. Accept job on Device A
2. Open same account on Device B
3. Refresh applications list

**Expected Results:**
- Application appears on Device B
- No duplicate applications
- Server is source of truth
- IndexedDB syncs with server data

## 9. Performance Testing

### Test Scenario 9.1: Large Queue Processing
**Steps:**
1. Go offline
2. Perform 50+ swipe actions
3. Go online
4. Monitor queue processing

**Expected Results:**
- Queue processes all actions
- No browser freezing
- Progress visible in console
- All actions complete successfully

### Test Scenario 9.2: Notification Polling Impact
**Steps:**
1. Keep app open for 10 minutes
2. Monitor Network tab
3. Check memory usage

**Expected Results:**
- Polling doesn't cause memory leaks
- Network requests are lightweight
- No duplicate polling intervals
- Performance remains stable

## 10. Visual Testing

### Test Scenario 10.1: UI States
**Steps:**
1. Check all "pendingSync" indicators
2. Verify offline mode indicator
3. Test notification badge at various counts
4. Review export buttons

**Expected Results:**
- Sync indicators show spinning icon
- Offline indicator is orange with WiFi icon
- Badge shows "9+" for counts > 9
- Export buttons have download icons
- All UI elements are accessible

## Manual Test Checklist

- [ ] Offline queue stores actions correctly
- [ ] Retry logic works with exponential backoff
- [ ] Idempotency keys prevent duplicates
- [ ] Notifications poll every 30 seconds
- [ ] All 7 notification types display correctly
- [ ] CSV export downloads and opens properly
- [ ] PDF export prints with correct formatting
- [ ] Saved jobs navigate to applications
- [ ] Application page fetches from API
- [ ] Notes can be added, edited, and saved
- [ ] Rollback retries on server failure
- [ ] Filters persist across sessions
- [ ] Job count API returns correct value
- [ ] Offline to online transition is smooth
- [ ] Old queue items are discarded
- [ ] Max retries removes failed actions
- [ ] Multi-device sync works correctly
- [ ] Large queues process without freezing
- [ ] UI shows all pending sync states

## Automated Testing Recommendations

For future automated testing, consider adding:

1. **Unit Tests:**
   - Offline queue methods (add, process, rollback)
   - Idempotency key generation
   - Retry backoff calculation
   - Export data formatting

2. **Integration Tests:**
   - API endpoint responses
   - Notification polling
   - Queue processing with mock server

3. **E2E Tests (Playwright):**
   - Complete offline workflow
   - Multi-step application process
   - Filter and export flows
   - Notification interactions

## Notes

- Some features require backend implementation:
  - Multi-device conflict resolution
  - SSE for real-time notifications
  - Document recovery warnings
  - Timed rollback restrictions

- Current implementation uses mock APIs
- All frontend infrastructure is complete and ready for backend integration
