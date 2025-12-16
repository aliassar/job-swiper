/**
 * Hook for Swipe State Machine with API Side Effects
 * 
 * This hook:
 * - Manages the pure swipe state machine
 * - Triggers API calls as side effects (NOT blocking UI)
 * - Provides a clean interface for the UI
 * - Implements timeout-based unlock for error recovery
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  swipeReducer,
  initialSwipeState,
  SWIPE_ACTIONS,
  SwipeActionType,
  getCurrentJob,
  getRemainingJobs,
  getNextJob,
  canRollback,
  canSwipe,
} from './swipeStateMachine';
import { getOfflineQueue } from '@/lib/offlineQueue';
import { jobsApi } from '@/lib/api';

// Timeout for unlocking state machine if animation fails (5 seconds)
const UNLOCK_TIMEOUT_MS = 5000;

export function useSwipeStateMachine() {
  const [state, dispatch] = useReducer(swipeReducer, initialSwipeState);
  const offlineQueue = useRef(getOfflineQueue()).current;
  
  // API side effect queue
  const apiQueueRef = useRef([]);
  
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
   */
  const prevHistoryLengthRef = useRef(0);
  const processedSwipesRef = useRef(new Set());
  
  // Cleanup processed swipes periodically to prevent memory leak
  useEffect(() => {
    const MAX_PROCESSED_SWIPES = 1000; // Keep only last 1000 processed swipes
    
    if (processedSwipesRef.current.size > MAX_PROCESSED_SWIPES) {
      // Convert to array, keep last MAX_PROCESSED_SWIPES items, convert back to Set
      const swipesArray = Array.from(processedSwipesRef.current);
      processedSwipesRef.current = new Set(swipesArray.slice(-MAX_PROCESSED_SWIPES));
      console.log('Cleaned up old processed swipes, retained last', MAX_PROCESSED_SWIPES);
    }
  }, [state.history.length]); // Run when history changes
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear processed swipes set on unmount
      processedSwipesRef.current.clear();
      // Clear any pending unlock timeout
      clearUnlockTimeout();
    };
  }, [clearUnlockTimeout]);
  
  useEffect(() => {
    const currentLength = state.history.length;
    const prevLength = prevHistoryLengthRef.current;
    
    // Only process when history grows (new swipe added)
    if (currentLength > prevLength) {
      const lastSwipe = state.history[state.history.length - 1];
      if (!lastSwipe) return;
      
      // Create unique key for this swipe event
      const swipeKey = `${lastSwipe.jobId}-${lastSwipe.action}-${lastSwipe.timestamp}`;
      
      // Only process if we haven't seen this exact swipe before
      if (!processedSwipesRef.current.has(swipeKey)) {
        processedSwipesRef.current.add(swipeKey);
        
        // Queue API call (non-blocking)
        const { jobId, action } = lastSwipe;
        
        offlineQueue.addOperation({
          type: action,
          id: jobId,
          payload: { jobId },
          apiCall: async (payload) => {
            switch (action) {
              case SwipeActionType.ACCEPT:
                await jobsApi.acceptJob(payload.jobId);
                break;
              case SwipeActionType.REJECT:
                await jobsApi.rejectJob(payload.jobId);
                break;
              case SwipeActionType.SKIP:
                await jobsApi.skipJob(payload.jobId);
                break;
            }
          },
        }).catch(error => {
          console.error('Error queuing API call:', error);
        });
      }
    }
    
    // Handle rollback (history shrinks)
    if (currentLength < prevLength) {
      // Rollback occurred
      const rolledBackJob = state.jobs[state.cursor];
      if (rolledBackJob) {
        offlineQueue.addOperation({
          type: 'rollback',
          id: rolledBackJob.id,
          payload: { jobId: rolledBackJob.id },
          apiCall: async (payload) => {
            await jobsApi.rollbackJob(payload.jobId);
          },
        }).catch(error => {
          console.error('Error queuing rollback API call:', error);
        });
      }
    }
    
    prevHistoryLengthRef.current = currentLength;
  }, [state.history.length, state.cursor, state.jobs, state.history, offlineQueue]);
  
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
