/**
 * Hook for Swipe State Machine with API Side Effects
 * 
 * This hook:
 * - Manages the pure swipe state machine
 * - Triggers API calls as side effects (NOT blocking UI)
 * - Provides a clean interface for the UI
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

export function useSwipeStateMachine() {
  const [state, dispatch] = useReducer(swipeReducer, initialSwipeState);
  const offlineQueue = useRef(getOfflineQueue()).current;
  
  // API side effect queue
  const apiQueueRef = useRef([]);
  
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
    
    return true;
  }, [state]);
  
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
    
    return true;
  }, [state]);
  
  /**
   * Unlock the state machine after animation completes
   */
  const unlock = useCallback(() => {
    dispatch({ type: 'UNLOCK' });
  }, []);
  
  /**
   * Side effect: Queue API calls when history changes
   * This runs AFTER the UI state has updated
   * API calls do NOT block the UI
   */
  useEffect(() => {
    const lastSwipe = state.history[state.history.length - 1];
    if (!lastSwipe) return;
    
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
  }, [state.history, offlineQueue]);
  
  /**
   * Side effect: Queue rollback API calls
   * Only when history decreases (rollback occurred)
   */
  const prevHistoryLengthRef = useRef(0);
  useEffect(() => {
    const currentLength = state.history.length;
    const prevLength = prevHistoryLengthRef.current;
    
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
  }, [state.history.length, state.cursor, state.jobs, offlineQueue]);
  
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
