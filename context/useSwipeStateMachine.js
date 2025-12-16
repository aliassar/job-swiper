/**
 * Hook for Swipe State Machine
 * 
 * This hook:
 * - Manages the pure swipe state machine for UI state only
 * - Does NOT handle API calls (delegated to JobContext)
 * - Provides a clean interface for the UI
 * - Implements timeout-based unlock for error recovery
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  swipeReducer,
  initialSwipeState,
  SWIPE_ACTIONS,
  getCurrentJob,
  getRemainingJobs,
  getNextJob,
  canRollback,
  canSwipe,
} from './swipeStateMachine';

// Re-export SwipeActionType for convenience
export { SwipeActionType } from './swipeStateMachine';

// Timeout for unlocking state machine if animation fails (5 seconds)
const UNLOCK_TIMEOUT_MS = 5000;

export function useSwipeStateMachine() {
  const [state, dispatch] = useReducer(swipeReducer, initialSwipeState);
  
  // Timeout reference for automatic unlock
  const unlockTimeoutRef = useRef(null);
  
  /**
   * Clear any pending unlock timeout
   */
  const clearUnlockTimeout = useCallback(() => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = null;
    }
  }, []);
  
  /**
   * Set a timeout to automatically unlock if animation fails
   */
  const setUnlockTimeout = useCallback(() => {
    clearUnlockTimeout();
    unlockTimeoutRef.current = setTimeout(() => {
      console.warn('State machine unlock timeout triggered - forcing unlock');
      dispatch({ type: 'UNLOCK' });
    }, UNLOCK_TIMEOUT_MS);
  }, [clearUnlockTimeout]);
  
  /**
   * Initialize jobs data
   */
  const initializeJobs = useCallback((jobs) => {
    dispatch({
      type: SWIPE_ACTIONS.INITIALIZE_JOBS,
      payload: jobs,
    });
  }, []);
  
  /**
   * Set loading state
   */
  const setLoading = useCallback((loading) => {
    dispatch({
      type: SWIPE_ACTIONS.SET_LOADING,
      payload: loading,
    });
  }, []);
  
  /**
   * Set error state
   */
  const setError = useCallback((error) => {
    dispatch({
      type: SWIPE_ACTIONS.SET_ERROR,
      payload: error,
    });
  }, []);
  
  /**
   * Perform a swipe action (UI only, synchronous)
   * Returns true if swipe was successful
   */
  const swipe = useCallback((jobId, action) => {
    if (!canSwipe(state)) {
      return false;
    }
    
    dispatch({
      type: SWIPE_ACTIONS.SWIPE,
      payload: { jobId, action },
    });
    
    // Set timeout to unlock if animation fails
    setUnlockTimeout();
    
    return true;
  }, [state, setUnlockTimeout]);
  
  /**
   * Perform a rollback (UI only, synchronous)
   * Returns true if rollback was successful
   */
  const rollback = useCallback(() => {
    if (!canRollback(state)) {
      return false;
    }
    
    dispatch({
      type: SWIPE_ACTIONS.ROLLBACK,
    });
    
    // Set timeout to unlock if animation fails
    setUnlockTimeout();
    
    return true;
  }, [state, setUnlockTimeout]);
  
  /**
   * Unlock the state machine after animation completes
   */
  const unlock = useCallback(() => {
    clearUnlockTimeout();
    dispatch({ type: 'UNLOCK' });
  }, [clearUnlockTimeout]);
  
  /**
   * Side effect: Queue API calls when history grows (new swipe)
   * This runs AFTER the UI state has updated
   * API calls do NOT block the UI
   * 
   * NOTE: This has been simplified to NOT queue API calls directly.
   * Instead, SwipeContainer is responsible for calling JobContext methods
   * (acceptJob, rejectJob, skipJob) which handle API persistence.
   * This prevents duplicate API calls and ensures JobContext is the
   * single source of truth for persistence.
   */
  const prevHistoryLengthRef = useRef(0);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending unlock timeout
      clearUnlockTimeout();
    };
  }, [clearUnlockTimeout]);
  
  // Computed values
  const currentJob = getCurrentJob(state);
  const nextJob = getNextJob(state);
  const remainingJobs = getRemainingJobs(state);
  const canPerformRollback = canRollback(state);
  const canPerformSwipe = canSwipe(state);
  
  return {
    // State
    jobs: state.jobs,
    cursor: state.cursor,
    history: state.history,
    isLocked: state.isLocked,
    loading: state.loading,
    error: state.error,
    
    // Computed
    currentJob,
    nextJob,
    remainingJobs,
    canRollback: canPerformRollback,
    canSwipe: canPerformSwipe,
    
    // Actions
    initializeJobs,
    setLoading,
    setError,
    swipe,
    rollback,
    unlock,
  };
}
