/**
 * Pure State Machine for Swipe Logic
 * 
 * This implements a deterministic state machine that:
 * - Has NO async logic
 * - Has NO setTimeout
 * - Has NO API dependencies
 * - Is purely synchronous and predictable
 * 
 * UI state is COMPLETELY decoupled from API state.
 */

export const SwipeActionType = {
  ACCEPT: 'accept',
  REJECT: 'reject',
  SKIP: 'skip',
};

// Swipe State Machine Actions
export const SWIPE_ACTIONS = {
  // Core swipe actions
  SWIPE: 'SWIPE',
  ROLLBACK: 'ROLLBACK',

  // Data initialization
  INITIALIZE_JOBS: 'INITIALIZE_JOBS',
  APPEND_JOBS: 'APPEND_JOBS', // For pagination - add more jobs
  SET_TOTAL_COUNT: 'SET_TOTAL_COUNT',

  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

/**
 * Initial state for the swipe state machine
 */
export const initialSwipeState = {
  // Core state machine data
  jobs: [],
  cursor: 0,
  history: [],

  // Server's total job count (for accurate display)
  totalJobCount: 0,

  // Pagination
  hasMore: true,

  // UI lock state
  isLocked: false,

  // Meta state
  loading: true,
  error: null,
};

/**
 * Pure state machine reducer
 * All transitions are synchronous and deterministic
 */
export function swipeReducer(state, action) {
  switch (action.type) {
    case SWIPE_ACTIONS.INITIALIZE_JOBS: {
      const { jobs, totalCount, hasMore } = action.payload;
      return {
        ...state,
        jobs: jobs,
        cursor: 0,
        history: [],
        totalJobCount: totalCount ?? jobs.length,
        hasMore: hasMore ?? true,
        loading: false,
        error: null,
      };
    }

    case SWIPE_ACTIONS.SET_TOTAL_COUNT: {
      return {
        ...state,
        totalJobCount: action.payload,
      };
    }

    case SWIPE_ACTIONS.APPEND_JOBS: {
      // Append new jobs for pagination, avoiding duplicates
      const { jobs: newJobs, hasMore } = action.payload;
      const existingIds = new Set(state.jobs.map(j => j.id));
      const uniqueNewJobs = newJobs.filter(j => !existingIds.has(j.id));
      return {
        ...state,
        jobs: [...state.jobs, ...uniqueNewJobs],
        hasMore: hasMore ?? true,
      };
    }

    case SWIPE_ACTIONS.SET_LOADING: {
      return {
        ...state,
        loading: action.payload,
      };
    }

    case SWIPE_ACTIONS.SET_ERROR: {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }

    case SWIPE_ACTIONS.SWIPE: {
      const { jobId, action: swipeAction } = action.payload;

      // Safety checks
      if (state.isLocked) {
        console.warn('Swipe blocked: action already in progress');
        return state;
      }

      if (state.cursor >= state.jobs.length) {
        console.warn('Swipe blocked: no more jobs');
        return state;
      }

      const currentJob = state.jobs[state.cursor];
      if (currentJob?.id !== jobId) {
        console.warn('Swipe blocked: job mismatch', { currentJob: currentJob?.id, requestedJob: jobId });
        return state;
      }

      // Pure state transition
      return {
        ...state,
        cursor: state.cursor + 1,
        history: [
          ...state.history,
          {
            jobId,
            action: swipeAction,
            timestamp: Date.now(),
          }
        ],
        isLocked: true, // Lock until animation completes
        totalJobCount: Math.max(0, state.totalJobCount - 1), // Decrement total
      };
    }

    case SWIPE_ACTIONS.ROLLBACK: {
      // Safety checks
      if (state.isLocked) {
        console.warn('Rollback blocked: action already in progress');
        return state;
      }

      if (state.history.length === 0) {
        console.warn('Rollback blocked: no history');
        return state;
      }

      if (state.cursor === 0) {
        console.warn('Rollback blocked: cursor at start');
        return state;
      }

      // Pure state transition
      return {
        ...state,
        cursor: state.cursor - 1,
        history: state.history.slice(0, -1),
        isLocked: true, // Lock until animation completes
        totalJobCount: state.totalJobCount + 1, // Increment total on rollback
      };
    }

    case 'UNLOCK': {
      return {
        ...state,
        isLocked: false,
      };
    }

    default:
      return state;
  }
}

/**
 * Selector: Get current job
 */
export function getCurrentJob(state) {
  if (state.cursor >= state.jobs.length) {
    return null;
  }
  return state.jobs[state.cursor];
}

/**
 * Selector: Get remaining jobs count
 */
export function getRemainingJobs(state) {
  return Math.max(0, state.jobs.length - state.cursor);
}

/**
 * Selector: Get next job (preview)
 */
export function getNextJob(state) {
  const nextIndex = state.cursor + 1;
  if (nextIndex >= state.jobs.length) {
    return null;
  }
  return state.jobs[nextIndex];
}

/**
 * Selector: Can rollback
 */
export function canRollback(state) {
  return !state.isLocked && state.history.length > 0 && state.cursor > 0;
}

/**
 * Selector: Can swipe
 */
export function canSwipe(state) {
  return !state.isLocked && state.cursor < state.jobs.length;
}
