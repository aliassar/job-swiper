# Optimistic Updates Architecture

This document describes the optimistic UI update system implemented to ensure the Job Swiper app remains responsive even on slow or unreliable networks.

## Overview

The app uses **optimistic updates** for all user actions, meaning the UI updates immediately without waiting for API responses. API requests are queued in the background and retried automatically on failure.

## Core Components

### 1. Request Queue (`lib/requestQueue.js`)

A singleton service that manages all API requests with automatic retry logic.

**Features:**
- Queues API requests for background processing
- Automatic retry up to 3 times on failure
- Exponential backoff between retries (1s, 2s, 4s)
- Persists pending requests to localStorage
- Survives page refresh
- Sequential processing to maintain order
- Sequence ID generation for version tracking

**Usage:**
```javascript
import { getRequestQueue } from '@/lib/requestQueue';

const requestQueue = getRequestQueue();

requestQueue.enqueue({
  type: 'acceptJob',
  sequenceId: requestQueue.getNextSequenceId(),
  apiCall: () => jobsApi.acceptJob(jobId),
  onSuccess: (result) => {
    // Update UI with server response
  },
  onFailure: (error) => {
    // Revert optimistic update and show error
  }
});
```

### 2. LocalStorage Persistence (`lib/localStorage.js`)

Utilities for saving and restoring application state.

**Persisted State:**
- `jobs` - Complete jobs array
- `currentIndex` - Current position in jobs array
- `favorites` - Favorited jobs
- `applications` - Accepted jobs with application status
- `sessionActions` - Actions taken in current session (for rollback)
- `pendingRollback` - State snapshot for rollback recovery

**Key Functions:**
- `saveJobState(state)` - Saves all state to localStorage
- `loadJobState()` - Loads all state from localStorage
- `clearJobState()` - Clears all persisted state

### 3. Toast Notifications (`components/Toast.jsx`, `context/ToastContext.jsx`)

User notifications for errors and important events.

**Features:**
- Only shown when API requests fail after all retries
- Auto-dismiss after 5 seconds
- Manual dismiss option
- Multiple toasts stack vertically
- Three types: success, error, info

**Usage:**
```javascript
import { useToast } from '@/context/ToastContext';

const toast = useToast();

toast.showError('Failed to accept job. Please try again.');
toast.showSuccess('Job accepted successfully!');
toast.showInfo('Syncing with server...');
```

## Optimistic Update Pattern

All job actions follow this pattern:

### 1. Accept Job
```javascript
const acceptJob = (job) => {
  const sequenceId = requestQueue.getNextSequenceId();
  
  // 1. Update UI immediately (optimistic)
  setSessionActions(prev => [...prev, { 
    jobId: job.id, 
    action: 'accepted',
    sequenceId,
    pendingSync: true  // Mark as not yet confirmed by server
  }]);
  setCurrentIndex(prev => prev + 1);  // Move to next job
  setApplications(prev => [optimisticApplication, ...prev]);
  
  // 2. Queue API request in background
  requestQueue.enqueue({
    type: 'acceptJob',
    sequenceId,
    apiCall: () => jobsApi.acceptJob(job.id),
    onSuccess: (result) => {
      // Mark as synced, update with server data
      setSessionActions(prev => 
        prev.map(action => 
          action.sequenceId === sequenceId
            ? { ...action, pendingSync: false }
            : action
        )
      );
    },
    onFailure: (error) => {
      // Revert optimistic updates
      setSessionActions(prev => 
        prev.filter(action => action.sequenceId !== sequenceId)
      );
      setApplications(prev => 
        prev.filter(app => app.jobId !== job.id)
      );
      toast.showError(`Failed to accept job: ${job.position}`);
    }
  });
};
```

### 2. Rollback (Undo)

The most complex operation with state snapshot for recovery:

```javascript
const rollbackLastAction = () => {
  const lastAction = sessionActions[sessionActions.length - 1];
  const sequenceId = requestQueue.getNextSequenceId();
  
  // 1. Save current state (in case rollback fails)
  const stateSnapshot = {
    jobs: [...jobs],
    currentIndex,
    sessionActions: [...sessionActions],
    applications: [...applications]
  };
  setPendingRollback(stateSnapshot);
  
  // 2. Update UI immediately (optimistic rollback)
  setSessionActions(prev => prev.slice(0, -1));
  setCurrentIndex(prev => Math.max(0, prev - 1));  // Go back one job
  if (lastAction.action === 'accepted') {
    setApplications(prev => prev.filter(app => app.jobId !== lastAction.jobId));
  }
  
  // 3. Queue API request
  requestQueue.enqueue({
    type: 'rollback',
    sequenceId,
    apiCall: () => jobsApi.rollbackJob(lastAction.jobId),
    onSuccess: () => {
      setPendingRollback(null);  // Clear snapshot
    },
    onFailure: (error) => {
      // Revert the rollback (restore previous state)
      setJobs(stateSnapshot.jobs);
      setCurrentIndex(stateSnapshot.currentIndex);
      setSessionActions(stateSnapshot.sessionActions);
      setApplications(stateSnapshot.applications);
      setPendingRollback(null);
      toast.showError('Failed to undo action. Restoring previous state.');
    }
  });
};
```

## State Management

### JobContext (`context/JobContext.jsx`)

Central state management for all job-related data.

**Key State:**
- `jobs` - All jobs from server
- `currentIndex` - Current position in jobs array
- `favorites` - User's favorited jobs
- `applications` - Accepted jobs with application tracking
- `sessionActions` - Actions taken (for rollback), includes `pendingSync` flag
- `pendingRollback` - Snapshot for rollback recovery
- `loading` - Initial load state

**Initialization Flow:**
1. Load state from localStorage immediately (instant UI)
2. Fetch from server in background
3. Update UI when server data arrives
4. Auto-save to localStorage on any state change

### SwipeContainer (`components/SwipeContainer.jsx`)

**Important Implementation Details:**
- Uses `currentIndex` directly from context (don't recalculate)
- Conditional key for animations: `isTopCard ? job.id : '${job.id}-${index}'`
- This prevents animation glitches during rollback
- Visible jobs are always `jobs.slice(currentIndex, currentIndex + 3)`

## Sequence IDs and Version Tracking

Each action gets a monotonically increasing sequence ID:

```javascript
const sequenceId = requestQueue.getNextSequenceId();
```

**Purpose:**
- Server can ignore stale operations
- Helps track which operations are pending
- Useful for debugging and logging

**Example:**
User accepts 3 jobs quickly (IDs: 1, 2, 3), then rollback arrives for job 2. Server can check sequence IDs to ensure operations are applied in correct order.

## Error Handling

### Retry Strategy
1. Initial request fails → wait 1s, retry
2. First retry fails → wait 2s, retry
3. Second retry fails → wait 4s, retry
4. Third retry fails → give up, call onFailure

### User Notifications
- No notification during retries (silent)
- Only show toast when all retries exhausted
- Clear error messages with action context

### State Recovery
- Optimistic updates are reverted on final failure
- For rollback, original state is restored from snapshot
- localStorage ensures state survives page refresh

## Testing Considerations

### Simulating Slow Network
- Use browser DevTools to throttle network (Slow 3G)
- Disable cache to force real API calls
- Verify UI updates immediately
- Check that actions complete in background

### Testing Rollback
1. Accept a job (UI updates instantly)
2. Click rollback (UI reverts instantly)
3. Verify job returns to top of stack
4. Check localStorage has correct state

### Testing Persistence
1. Accept some jobs
2. Refresh page
3. Verify state is restored from localStorage
4. Check that pending operations continue processing

## Future Enhancements

- Progress indicator for pending sync operations
- Conflict resolution for concurrent edits
- Optimistic updates for additional entities
- Background sync when app returns online
- Analytics for retry success rates

## Migration Guide

When adding new actions:

1. **Update UI immediately** - Don't wait for API
2. **Use request queue** - All API calls through getRequestQueue()
3. **Add sequence ID** - For version tracking
4. **Implement onFailure** - Revert optimistic update
5. **Update localStorage** - Include new state fields
6. **Show toast on error** - User feedback for failures

Example template:
```javascript
const myNewAction = (data) => {
  const sequenceId = requestQueue.getNextSequenceId();
  
  // Optimistic update
  setMyState(newValue);
  
  // Queue API call
  requestQueue.enqueue({
    type: 'myAction',
    sequenceId,
    apiCall: () => api.myAction(data),
    onSuccess: () => {
      // Optional: update with server data
    },
    onFailure: (error) => {
      // Revert optimistic update
      setMyState(oldValue);
      toast.showError('Action failed');
    }
  });
};
```

## Troubleshooting

### UI doesn't update immediately
- Check that state is updated before enqueuing request
- Verify useCallback dependencies are correct
- Check React DevTools for state changes

### API calls not retrying
- Check browser console for errors
- Verify requestQueue is properly initialized
- Check localStorage for queued requests

### State not persisting
- Verify localStorage is enabled in browser
- Check saveJobState is called after state changes
- Review useEffect dependencies

### Rollback not working
- Verify currentIndex is exported from context
- Check that stateSnapshot includes all necessary state
- Ensure conditional key is used for top card animation
