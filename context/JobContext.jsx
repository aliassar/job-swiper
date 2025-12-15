'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useReducer } from 'react';
import { jobsApi, savedJobsApi, applicationsApi, reportedApi } from '@/lib/api';
import { getOfflineQueue } from '@/lib/offlineQueue';
import { MAX_FETCH_RETRIES } from '@/lib/constants';
import { debounce } from '@/lib/utils';
import { saveAppState, loadAppState } from '@/lib/indexedDB';
import { jobReducer, initialState, ACTIONS } from './jobReducer';

const JobContext = createContext();

export function JobProvider({ children }) {
  // Optimization 9: useReducer for complex state management
  const [state, dispatch] = useReducer(jobReducer, initialState);

  // Bug Fix 3: Track retry timeout for cleanup
  const retryTimeoutRef = useRef(null);

  // Bug Fix 1 & Optimization 5: Memoize offlineQueue to prevent recreation
  const offlineQueue = useMemo(() => getOfflineQueue(), []);

  // Optimization 8: useCallback for fetch functions (defined before useEffects that use them)
  const fetchJobs = useCallback(async (retryAttempt = 0, search = '') => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.SET_FETCH_ERROR, payload: null });
    
    try {
      const data = await jobsApi.getJobs(search);
      dispatch({ type: ACTIONS.SET_JOBS, payload: data.jobs });
      dispatch({ type: ACTIONS.SET_RETRY_COUNT, payload: 0 });
      dispatch({ type: ACTIONS.SET_FETCH_ERROR, payload: null });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error(`Error fetching jobs (attempt ${retryAttempt + 1}):`, error);
      
      if (retryAttempt < MAX_FETCH_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, retryAttempt) * 1000;
        console.log(`Retrying in ${delay / 1000}s...`);
        dispatch({ type: ACTIONS.SET_RETRY_COUNT, payload: retryAttempt + 1 });
        
        // Bug Fix 3: Store timeout reference for cleanup
        retryTimeoutRef.current = setTimeout(() => {
          fetchJobs(retryAttempt + 1, search);
        }, delay);
      } else {
        // Max retries reached
        dispatch({ type: ACTIONS.SET_FETCH_ERROR, payload: {
          message: 'Unable to load jobs. Please check your connection and try again.',
          canRetry: true,
        }});
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }
  }, []); // Empty deps - uses dispatch

  const fetchSavedJobs = useCallback(async (search = '') => {
    try {
      const data = await savedJobsApi.getSaveds(search);
      dispatch({ type: ACTIONS.SET_SAVED_JOBS, payload: data.saveds });
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  }, []);

  const fetchApplications = useCallback(async (search = '') => {
    try {
      const data = await applicationsApi.getApplications(search);
      dispatch({ type: ACTIONS.SET_APPLICATIONS, payload: data.applications });
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, []);

  const fetchReportedJobs = useCallback(async (search = '') => {
    try {
      const data = await reportedApi.getReportedJobs(search);
      dispatch({ type: ACTIONS.SET_REPORTED_JOBS, payload: data.reportedJobs });
    } catch (error) {
      console.error('Error fetching reported jobs:', error);
    }
  }, []);

  const fetchSkippedJobs = useCallback(async (search = '') => {
    try {
      const data = await jobsApi.getSkippedJobs(search);
      // Merge with local skippedJobs, prioritizing local ones
      const serverSkipped = data.jobs.map(job => ({ ...job, pendingSync: false }));
      dispatch({ type: ACTIONS.MERGE_SKIPPED_JOBS, payload: serverSkipped });
    } catch (error) {
      console.error('Error fetching skipped jobs:', error);
    }
  }, []);

  // Feature 19: Load persisted state from IndexedDB on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedState = await loadAppState();
        if (persistedState && persistedState.timestamp) {
          // Check if state is not too old (e.g., less than 24 hours)
          const ageInHours = (Date.now() - persistedState.timestamp) / (1000 * 60 * 60);
          if (ageInHours < 24) {
            console.log('Restoring persisted state from IndexedDB');
            if (persistedState.applications) dispatch({ type: ACTIONS.SET_APPLICATIONS, payload: persistedState.applications });
            if (persistedState.savedJobs) dispatch({ type: ACTIONS.SET_SAVED_JOBS, payload: persistedState.savedJobs });
            if (persistedState.reportedJobs) dispatch({ type: ACTIONS.SET_REPORTED_JOBS, payload: persistedState.reportedJobs });
            if (persistedState.skippedJobs) dispatch({ type: ACTIONS.SET_SKIPPED_JOBS, payload: persistedState.skippedJobs });
            if (typeof persistedState.currentIndex === 'number') dispatch({ type: ACTIONS.SET_CURRENT_INDEX, payload: persistedState.currentIndex });
          }
        }
      } catch (error) {
        console.error('Error loading persisted state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Fetch jobs and saved jobs on mount
  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
    fetchApplications();
    fetchReportedJobs();
    fetchSkippedJobs();
    
    // Subscribe to queue updates
    const unsubscribe = offlineQueue.subscribe((event, data) => {
      dispatch({ type: ACTIONS.SET_QUEUE_STATUS, payload: offlineQueue.getQueueStatus() });
      
      if (event === 'failed') {
        // Handle failed operation
        console.error('Operation failed:', data);
        // Could show user notification here
      }
    });

    // Bug Fix 3: Cleanup function for retry timeout
    return () => {
      unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [offlineQueue, fetchJobs, fetchSavedJobs, fetchApplications, fetchReportedJobs, fetchSkippedJobs]);

  // Feature 19: Persist state to IndexedDB when it changes
  useEffect(() => {
    const persistState = async () => {
      try {
        await saveAppState({
          applications: state.applications,
          savedJobs: state.savedJobs,
          reportedJobs: state.reportedJobs,
          skippedJobs: state.skippedJobs,
          currentIndex: state.currentIndex,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(persistState, 1000);
    return () => clearTimeout(timeoutId);
  }, [state.applications, state.savedJobs, state.reportedJobs, state.skippedJobs, state.currentIndex]);

  const acceptJob = async (job) => {
    // Create initial application with "Syncing" stage
    const tempApplication = {
      id: `temp-${job.id}-${Date.now()}`,
      jobId: job.id,
      company: job.company,
      position: job.position,
      location: job.location,
      skills: job.skills,
      stage: 'Syncing',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: true,
    };
    
    // Optimistic UI update
    dispatch({ type: ACTIONS.ADD_APPLICATION, payload: tempApplication });
    
    dispatch({ type: ACTIONS.ADD_SESSION_ACTION, payload: { 
      jobId: job.id, 
      action: 'accepted', 
      timestamp: new Date().toISOString(),
      job: job,
      pendingSync: true,
    }});
    
    // Move to next job immediately
    dispatch({ type: ACTIONS.INCREMENT_INDEX });
    
    // Add to offline queue
    try {
      await offlineQueue.addOperation({
        type: 'accept',
        id: job.id,
        payload: { jobId: job.id },
        apiCall: async (payload) => {
          const result = await jobsApi.acceptJob(payload.jobId);
          
          // Update applications on success - use server response for stage and real ID
          if (result.application) {
            dispatch({ type: ACTIONS.UPDATE_APPLICATION_WITH_RESULT, payload: {
              jobId: payload.jobId,
              application: result.application
            }});
          }
          
          // Mark as synced
          dispatch({ type: ACTIONS.MARK_SESSION_ACTION_SYNCED, payload: {
            jobId: payload.jobId,
            action: 'accepted'
          }});
        },
      });
    } catch (error) {
      console.error('Error queuing accept:', error);
    }
    
    // Return the temporary application ID for navigation
    return tempApplication.id;
  };

  const rejectJob = async (job) => {
    // Optimistic UI update
    dispatch({ type: ACTIONS.ADD_SESSION_ACTION, payload: { 
      jobId: job.id, 
      action: 'rejected', 
      timestamp: new Date().toISOString(),
      job: job,
      pendingSync: true,
    }});
    
    // Move to next job immediately
    dispatch({ type: ACTIONS.INCREMENT_INDEX });
    
    // Add to offline queue
    try {
      await offlineQueue.addOperation({
        type: 'reject',
        id: job.id,
        payload: { jobId: job.id },
        apiCall: async (payload) => {
          await jobsApi.rejectJob(payload.jobId);
          
          // Mark as synced
          dispatch({ type: ACTIONS.MARK_SESSION_ACTION_SYNCED, payload: {
            jobId: payload.jobId,
            action: 'rejected'
          }});
        },
      });
    } catch (error) {
      console.error('Error queuing reject:', error);
    }
  };

  const skipJob = async (job) => {
    // Optimistic UI update - add to skippedJobs immediately
    const skippedItem = {
      ...job,
      skippedAt: new Date().toISOString(),
      pendingSync: true,
    };
    
    dispatch({ type: ACTIONS.ADD_SKIPPED_JOB, payload: skippedItem });
    
    dispatch({ type: ACTIONS.ADD_SESSION_ACTION, payload: { 
      jobId: job.id, 
      action: 'skipped', 
      timestamp: new Date().toISOString(),
      job: job,
      pendingSync: true,
    }});
    
    // Move to next job immediately
    dispatch({ type: ACTIONS.INCREMENT_INDEX });
    
    // Add to offline queue
    try {
      await offlineQueue.addOperation({
        type: 'skip',
        id: job.id,
        payload: { jobId: job.id },
        apiCall: async (payload) => {
          await jobsApi.skipJob(payload.jobId);
          
          // Mark as synced in both places
          dispatch({ type: ACTIONS.MARK_SESSION_ACTION_SYNCED, payload: {
            jobId: payload.jobId,
            action: 'skipped'
          }});
          
          dispatch({ type: ACTIONS.MARK_SKIPPED_JOB_SYNCED, payload: {
            jobId: payload.jobId
          }});
        },
      });
    } catch (error) {
      console.error('Error queuing skip:', error);
    }
  };

  const toggleSaveJob = async (job) => {
    const isSaved = state.savedJobs.some(saved => saved.id === job.id);
    const newSavedState = !isSaved;
    
    // Optimistically update UI
    if (isSaved) {
      dispatch({ type: ACTIONS.TOGGLE_SAVED_JOB, payload: job });
    } else {
      const savedItem = { ...job, pendingSync: true };
      dispatch({ type: ACTIONS.TOGGLE_SAVED_JOB, payload: savedItem });
    }
    
    // Add to offline queue for background sync
    try {
      await offlineQueue.addOperation({
        type: 'saveJob',
        id: job.id,
        payload: { jobId: job.id, saved: newSavedState },
        apiCall: async (payload) => {
          await jobsApi.toggleSaveJob(payload.jobId, payload.saved);
          
          // Mark as synced
          if (payload.saved) {
            dispatch({ type: ACTIONS.MARK_SAVED_JOB_SYNCED, payload: {
              jobId: payload.jobId
            }});
          }
        },
      });
    } catch (error) {
      console.error('Error queuing save job toggle:', error);
    }
  };

  const rollbackLastAction = async () => {
    if (state.sessionActions.length === 0) return;
    
    const lastAction = state.sessionActions[state.sessionActions.length - 1];
    
    // Use reducer's ROLLBACK_JOB action which handles all state updates atomically
    dispatch({ type: ACTIONS.ROLLBACK_JOB, payload: { job: lastAction.job, lastAction } });
    
    // Add to offline queue for background sync with retry capability
    try {
      await offlineQueue.addOperation({
        type: 'rollback',
        id: lastAction.jobId,
        payload: { jobId: lastAction.jobId },
        apiCall: async (payload) => {
          // Retry logic is built into the offline queue
          // The queue will automatically retry with exponential backoff on failure
          await jobsApi.rollbackJob(payload.jobId);
          // Rollback synced successfully - no UI update needed
          console.log('Rollback synced to server successfully');
        },
      });
    } catch (error) {
      console.error('Error queuing rollback:', error);
      // The operation is still in the queue and will be retried
      // The offline queue handles retries automatically
    }
  };

  const updateApplicationStage = async (applicationId, stage) => {
    // Optimistic UI update
    dispatch({ type: ACTIONS.UPDATE_APPLICATION, payload: {
      id: applicationId,
      updates: { stage, updatedAt: new Date().toISOString(), pendingSync: true }
    }});
    
    // Add to offline queue for background sync
    try {
      await offlineQueue.addOperation({
        type: 'updateStage',
        id: applicationId,
        payload: { applicationId, stage },
        apiCall: async (payload) => {
          const result = await applicationsApi.updateStage(payload.applicationId, payload.stage);
          
          // Mark as synced
          dispatch({ type: ACTIONS.UPDATE_APPLICATION, payload: {
            id: payload.applicationId,
            updates: { updatedAt: result.application.updatedAt, pendingSync: false }
          }});
        },
      });
    } catch (error) {
      console.error('Error queuing stage update:', error);
    }
  };

  const reportJob = async (job, reason = 'other') => {
    // Check if already reported to avoid duplicates
    const alreadyReported = state.reportedJobs.some(r => r.jobId === job.id);
    if (alreadyReported) {
      console.log(`Job ${job.id} already reported, skipping`);
      return;
    }
    
    // Optimistic UI update
    const reportId = `report-${job.id}-${Date.now()}`;
    const newReport = {
      id: reportId,
      jobId: job.id,
      reportedAt: new Date().toISOString(),
      job: job,
      reason: reason,
      pendingSync: true,
    };
    
    dispatch({ type: ACTIONS.ADD_REPORTED_JOB, payload: newReport });
    console.log(`Job reported: ${reason}`);
    
    // Add to offline queue with retry capability
    try {
      const operation = await offlineQueue.addOperation({
        type: 'report',
        id: `report-${job.id}`, // Use consistent ID to prevent duplicates
        payload: { jobId: job.id, reason },
        apiCall: async (payload) => {
          await reportedApi.reportJob(payload.jobId, payload.reason);
          
          // Mark as synced on success
          dispatch({ type: ACTIONS.MARK_REPORTED_JOB_SYNCED, payload: {
            jobId: payload.jobId
          }});
        },
      });
      
      // If operation is null, it means it cancelled a pending unreport
      // This is expected when user toggles report/unreport quickly
      if (operation === null) {
        console.log(`Cancelled pending unreport for job ${job.id}`);
      }
    } catch (error) {
      console.error('Error queuing report:', error);
      // Operation is still in queue for retry
    }
  };

  const unreportJob = async (jobId) => {
    // Optimistic UI update - remove from reported jobs immediately
    dispatch({ type: ACTIONS.REMOVE_REPORTED_JOB, payload: jobId });
    
    // Try to add unreport operation (will cancel pending report if it exists)
    try {
      const operation = await offlineQueue.addOperation({
        type: 'unreport',
        id: `report-${jobId}`, // Use same ID as report for proper cancellation
        payload: { jobId },
        apiCall: async (payload) => {
          await reportedApi.unreportJob(payload.jobId);
          // Successfully unreported - UI already updated
        },
      });
      
      // If operation is null, it means it cancelled a pending report
      // In that case, we're done - no need to unreport from server since it was never reported
      if (operation === null) {
        console.log(`Cancelled pending report for job ${jobId}, no server unreport needed`);
      }
    } catch (error) {
      console.error('Error queuing unreport:', error);
      // Operation is still in queue for retry
    }
  };

  const currentJob = state.jobs[state.currentIndex];
  const remainingJobs = state.jobs.length - state.currentIndex;

  const manualRetry = () => {
    dispatch({ type: ACTIONS.SET_RETRY_COUNT, payload: 0 });
    dispatch({ type: ACTIONS.SET_FETCH_ERROR, payload: null });
    fetchJobs(0);
  };

  return (
    <JobContext.Provider
      value={{
        jobs: state.jobs,
        currentJob,
        currentIndex: state.currentIndex,
        remainingJobs,
        savedJobs: state.savedJobs,
        saveds: state.savedJobs, // Keep for backward compatibility
        applications: state.applications,
        reportedJobs: state.reportedJobs,
        skippedJobs: state.skippedJobs,
        sessionActions: state.sessionActions,
        loading: state.loading,
        fetchError: state.fetchError,
        retryCount: state.retryCount,
        queueStatus: state.queueStatus,
        acceptJob,
        rejectJob,
        skipJob,
        toggleSaveJob,
        toggleSaveJob: toggleSaveJob, // Keep for backward compatibility
        reportJob,
        unreportJob,
        rollbackLastAction,
        updateApplicationStage,
        fetchApplications,
        fetchReportedJobs,
        fetchSkippedJobs,
        fetchSavedJobs,
        manualRetry,
      }}
    >
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}
