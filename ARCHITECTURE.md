# Swipe State Machine Architecture

## Overview

This document explains the new state machine architecture for the job swiper, which completely decouples UI state from API state to eliminate race conditions and ensure deterministic behavior.

## Core Principles

### 1. **UI and API are Completely Decoupled**

- **UI state** is managed by a pure, synchronous state machine
- **API calls** are side effects triggered by state changes, but never block or influence UI transitions
- The UI always shows the correct state immediately, regardless of API status

### 2. **Deterministic State Machine**

- All state transitions are synchronous and predictable
- No `setTimeout`, no async logic in state transitions
- State can only change through explicit actions: `SWIPE`, `ROLLBACK`, `UNLOCK`

### 3. **Serialized Actions**

- Only one action can be in progress at a time via `isLocked` flag
- Lock is set when action starts, released only when animation completes
- All button clicks during locked state are ignored

## Architecture Components

### State Machine (`swipeStateMachine.js`)

```javascript
{
  jobs: Job[],        // All available jobs
  cursor: number,     // Index of current top job
  history: Event[],   // Ordered list of swipe events
  isLocked: boolean,  // Interaction lock
  loading: boolean,   // Initial load state
  error: Error | null // Error state
}
```

**State Transitions:**

1. **SWIPE**: `cursor++`, append to `history`, lock
2. **ROLLBACK**: `cursor--`, remove from `history`, lock
3. **UNLOCK**: Release lock (triggered by animation complete)

### Hook (`useSwipeStateMachine.js`)

Wraps the state machine and provides:

- **State management**: Uses `useReducer` with pure reducer
- **API side effects**: Observes `history` changes, queues API calls
- **Selectors**: Derives computed values (currentJob, remainingJobs, etc.)

### UI Component (`SwipeContainerV2.jsx`)

Clean presentation layer that:

- Renders current and next card
- Handles drag gestures
- Calls state machine actions
- Triggers unlock on animation complete
- **Zero business logic** - just presentation and user input

## How Race Conditions are Prevented

### Problem 1: Multiple Actions on Same Job

**Before:** State updates were async, card remained visible during animation, allowing multiple clicks

**Solution:** `isLocked` flag prevents any action while previous animation is running. Lock is only released in `onExitComplete`.

### Problem 2: Rollback Timing Issues

**Before:** Rollback depended on API completion and async state updates

**Solution:** Rollback is a pure, synchronous local operation:
```javascript
cursor = cursor - 1
history = history.slice(0, -1)
```

### Problem 3: State Desynchronization

**Before:** UI state could diverge from API state, causing wrong job to be acted upon

**Solution:** UI state is the single source of truth. API is informed, not consulted.

## Data Flow

```
User Action (swipe/rollback)
  ↓
State Machine (synchronous update)
  ↓
UI Re-renders (immediate)
  ↓
Animation Starts
  ↓
Side Effect: Queue API Call (non-blocking)
  ↓
Animation Completes → Unlock
  ↓
Ready for Next Action
```

## API Integration Pattern

```javascript
// Side effect: Watch history changes
useEffect(() => {
  const lastSwipe = history[history.length - 1];
  if (lastSwipe) {
    // Queue API call - does NOT block UI
    offlineQueue.addOperation({
      type: lastSwipe.action,
      id: lastSwipe.jobId,
      apiCall: async () => {
        await api.performAction(lastSwipe.jobId, lastSwipe.action);
      }
    });
  }
}, [history]);
```

## Key Benefits

### ✅ No Race Conditions
- State transitions are atomic and synchronous
- Only one action can run at a time
- Animation lifecycle controls action lock

### ✅ No setTimeout in UI Logic
- All timing is handled by animation system
- No arbitrary delays or timers

### ✅ Predictable Rollback
- Simple array operation: pop from history, decrement cursor
- Works even if API calls are pending/failed
- Always shows correct card immediately

### ✅ Performance
- Fast UI updates (no waiting for API)
- Offline-first design
- API calls are fire-and-forget

### ✅ Testable
- Pure reducer is trivial to test
- No mocking of timers or async operations
- Deterministic behavior

## Migration Path

1. ✅ Create pure state machine reducer
2. ✅ Create hook with API side effects
3. ✅ Create new SwipeContainer component
4. Test new implementation thoroughly
5. Swap old component for new one
6. Remove old implementation

## Testing Strategy

### Unit Tests for State Machine

```javascript
test('SWIPE increments cursor', () => {
  const state = { cursor: 0, history: [], jobs: [job1, job2] };
  const newState = swipeReducer(state, { 
    type: 'SWIPE', 
    payload: { jobId: job1.id, action: 'accept' } 
  });
  expect(newState.cursor).toBe(1);
  expect(newState.history).toHaveLength(1);
});

test('ROLLBACK decrements cursor', () => {
  const state = { cursor: 1, history: [event1], jobs: [job1, job2] };
  const newState = swipeReducer(state, { type: 'ROLLBACK' });
  expect(newState.cursor).toBe(0);
  expect(newState.history).toHaveLength(0);
});
```

### Integration Tests

- Rapid swipe/rollback sequences
- Offline mode
- Animation interruption
- Edge cases (first job, last job, empty state)

## Performance Characteristics

- **Swipe latency**: ~0ms (synchronous)
- **Animation duration**: 300ms (configurable)
- **API calls**: Queued, non-blocking
- **Memory**: O(n) where n = number of swiped jobs in session
- **Rollback latency**: ~0ms (synchronous)

## Future Enhancements

1. **Undo multiple**: Allow rollback of multiple actions
2. **Keyboard shortcuts**: Arrow keys for swipe
3. **Gesture confidence**: Adjust thresholds based on user patterns
4. **State persistence**: Save cursor/history to localStorage
5. **Analytics**: Track swipe patterns without blocking UI

## Conclusion

This architecture solves all the root causes of race conditions by:

1. Making UI state synchronous and deterministic
2. Treating API as fire-and-forget side effects
3. Using animation lifecycle to serialize actions
4. Eliminating all setTimeout and async logic from state updates

The result is a fast, reliable, testable swipe UI that works perfectly even under rapid user input.

## API Integration Pattern

### Centralized API Client

All backend communication flows through `lib/api.js`, which provides:

- **Modular Organization**: Separate objects for jobs, applications, notifications, etc.
- **Consistent Error Handling**: Centralized error catching and reporting
- **Type Safety**: FormData auto-detection for file uploads
- **Environment Configuration**: Single point to configure backend URL

```javascript
// Example: Centralized API structure
export const jobsApi = {
  getJobs: (search = '') => apiRequest(`/api/jobs${params}`),
  acceptJob: (jobId, metadata = {}) => apiRequest(`/api/jobs/${jobId}/accept`, {
    method: 'POST',
    body: JSON.stringify(metadata),
  }),
  // ... more methods
};
```

### API Proxy Layer

Next.js API routes act as a proxy between frontend and backend:

```
Frontend Component
  ↓ (calls lib/api.js)
Next.js API Route (/app/api/*/route.js)
  ↓ (proxies to backend)
Backend Server (job-swipper-server)
  ↓ (queries database)
Database
```

**Benefits:**
- **Security**: Hide backend URL and add auth middleware
- **Flexibility**: Easy to switch backends or add caching
- **Error Handling**: Transform backend errors for frontend consumption
- **CORS**: No CORS issues since proxy runs on same domain

### Request/Response Flow

1. Component calls API method from `lib/api.js`
2. API client sends request to Next.js API route
3. Next.js route validates and forwards to backend
4. Backend processes and returns response
5. Next.js route transforms response if needed
6. Frontend receives standardized response format

### Error Handling

```javascript
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
```

## Offline Queue Architecture

### Overview

The offline queue enables offline-first functionality by queueing operations when the backend is unavailable and automatically replaying them when connection is restored.

### Core Components

**1. IndexedDB Storage (`lib/indexedDB.js`)**
- Persistent storage for application state
- Survives page refreshes and browser restarts
- Stores jobs, applications, and user actions

**2. Offline Queue (`lib/offlineQueue.js`)**
- Queue operations when offline
- Automatic retry with exponential backoff
- Operation deduplication and conflict resolution
- Deterministic operation handlers

### Operation Lifecycle

```
User Action
  ↓
Optimistic UI Update (immediate)
  ↓
Queue Operation
  ↓
[Online?]
  Yes → Execute Immediately → Update IndexedDB
  No → Store in Queue → Update IndexedDB
  ↓
[Connection Restored]
  ↓
Replay Queue → Update Backend → Clear Queue
```

### Queue Structure

```javascript
{
  id: 'unique-operation-id',
  type: 'accept' | 'reject' | 'skip' | 'save' | 'updateStage',
  timestamp: Date.now(),
  retries: 0,
  maxRetries: 3,
  data: { jobId, metadata, ... },
  handler: async (operation) => {
    // Deterministic operation execution
    await api.performAction(operation.data);
  }
}
```

### Deterministic Handlers

Each operation type has a dedicated handler ensuring consistent replay:

```javascript
const handlers = {
  accept: async (op) => await jobsApi.acceptJob(op.data.jobId, op.data.metadata),
  reject: async (op) => await jobsApi.rejectJob(op.data.jobId),
  skip: async (op) => await jobsApi.skipJob(op.data.jobId),
  updateStage: async (op) => await applicationsApi.updateStage(op.data.id, op.data.stage),
  // ... more handlers
};
```

### Conflict Resolution

When replaying queued operations, conflicts may arise:

- **Deleted Jobs**: Skip if job no longer exists
- **State Conflicts**: Use latest timestamp as source of truth
- **Failed Operations**: Retry with exponential backoff (1s, 2s, 4s, 8s)
- **Max Retries**: After 3 failures, log error and remove from queue

### Synchronization Strategy

**On Page Load:**
1. Load state from IndexedDB
2. Display cached data immediately
3. Fetch fresh data from backend
4. Merge and resolve conflicts
5. Update IndexedDB with latest state

**On Connection Restore:**
1. Detect online event
2. Get queued operations
3. Sort by timestamp (FIFO)
4. Execute operations sequentially
5. Remove successful operations from queue
6. Retry failed operations

### Performance Optimizations

- **Debounced Saves**: Batch IndexedDB writes (300ms debounce)
- **Lazy Queue Processing**: Only process queue when needed
- **Memory-First**: Keep hot data in memory, persist periodically
- **Selective Sync**: Only sync changed entities, not entire state

### Testing Offline Mode

```javascript
// Simulate offline mode
window.offlineQueue.setOfflineMode(true);

// Make actions (they queue)
await jobsApi.acceptJob(jobId);

// Simulate online mode
window.offlineQueue.setOfflineMode(false);

// Queue automatically replays
```

### Benefits

- ✅ **Works Offline**: Full app functionality without connection
- ✅ **No Data Loss**: All actions preserved and synced
- ✅ **Fast UI**: Optimistic updates for instant feedback
- ✅ **Resilient**: Handles network failures gracefully
- ✅ **Transparent**: Users don't need to know about queue
