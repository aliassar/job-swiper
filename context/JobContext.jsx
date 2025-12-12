'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useReducer } from 'react';
import { jobsApi, favoritesApi, applicationsApi, reportedApi } from '@/lib/api';
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
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(persistState, 1000);
    return () => clearTimeout(timeoutId);
  }, [state.applications, state.savedJobs, state.reportedJobs, state.skippedJobs]);

  // Optimization 8: useCallback for fetch functions
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
      const data = await favoritesApi.getFavorites(search);
      dispatch({ type: ACTIONS.SET_SAVED_JOBS, payload: data.favorites });
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
    setApplications(prev => [tempApplication, ...prev]);
    
    setSessionActions(prev => [...prev, { 
      jobId: job.id, 
      action: 'accepted', 
      timestamp: new Date().toISOString(),
      job: job,
      pendingSync: true,
    }]);
    
    // Move to next job immediately
    setCurrentIndex(prev => prev + 1);
    
    // Add to offline queue
    try {
      // Update stage to "Being Applied"
      setApplications(prev => prev.map(app =>
        app.jobId === job.id && app.id.startsWith('temp-')
          ? { ...app, stage: 'Being Applied' }
          : app
      ));
      
      await offlineQueue.addOperation({
        type: 'accept',
        id: job.id,
        payload: { jobId: job.id },
        apiCall: async (payload) => {
          const result = await jobsApi.acceptJob(payload.jobId);
          
          // Update applications on success - change to "Applied" and use real ID
          if (result.application) {
            setApplications(prev => prev.map(app =>
              app.jobId === payload.jobId && app.id.startsWith('temp-')
                ? { ...result.application, stage: 'Applied', pendingSync: false }
                : app
            ));
          }
          
          // Mark as synced
          setSessionActions(prev => prev.map(a =>
            a.jobId === payload.jobId && a.action === 'accepted'
              ? { ...a, pendingSync: false }
              : a
          ));
        },
      });
    } catch (error) {
      console.error('Error queuing accept:', error);
    }
  };

  const rejectJob = async (job) => {
    // Optimistic UI update
    setSessionActions(prev => [...prev, { 
      jobId: job.id, 
      action: 'rejected', 
      timestamp: new Date().toISOString(),
      job: job,
      pendingSync: true,
    }]);
    
    // Move to next job immediately
    setCurrentIndex(prev => prev + 1);
    
    // Add to offline queue
    try {
      await offlineQueue.addOperation({
        type: 'reject',
        id: job.id,
        payload: { jobId: job.id },
        apiCall: async (payload) => {
          await jobsApi.rejectJob(payload.jobId);
          
          // Mark as synced
          setSessionActions(prev => prev.map(a =>
            a.jobId === payload.jobId && a.action === 'rejected'
              ? { ...a, pendingSync: false }
              : a
          ));
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
    
    setSkippedJobs(prev => [skippedItem, ...prev]);
    
    setSessionActions(prev => [...prev, { 
      jobId: job.id, 
      action: 'skipped', 
      timestamp: new Date().toISOString(),
      job: job,
      pendingSync: true,
    }]);
    
    // Move to next job immediately
    setCurrentIndex(prev => prev + 1);
    
    // Add to offline queue
    try {
      await offlineQueue.addOperation({
        type: 'skip',
        id: job.id,
        payload: { jobId: job.id },
        apiCall: async (payload) => {
          await jobsApi.skipJob(payload.jobId);
          
          // Mark as synced in both places
          setSessionActions(prev => prev.map(a =>
            a.jobId === payload.jobId && a.action === 'skipped'
              ? { ...a, pendingSync: false }
              : a
          ));
          
          setSkippedJobs(prev => prev.map(s =>
            s.id === payload.jobId
              ? { ...s, pendingSync: false }
              : s
          ));
        },
      });
    } catch (error) {
      console.error('Error queuing skip:', error);
    }
  };

  const toggleSaveJob = async (job) => {
    const isSaved = savedJobs.some(saved => saved.id === job.id);
    const newSavedState = !isSaved;
    
    // Optimistically update UI
    if (isSaved) {
      setSavedJobs(prev => prev.filter(saved => saved.id !== job.id));
    } else {
      const savedItem = { ...job, pendingSync: true };
      setSavedJobs(prev => [savedItem, ...prev]);
    }
    
    // Add to offline queue for background sync
    try {
      await offlineQueue.addOperation({
        type: 'saveJob',
        id: job.id,
        payload: { jobId: job.id, favorite: newSavedState },
        apiCall: async (payload) => {
          await jobsApi.toggleFavorite(payload.jobId, payload.favorite);
          
          // Mark as synced
          if (payload.favorite) {
            setSavedJobs(prev => prev.map(s =>
              s.id === payload.jobId
                ? { ...s, pendingSync: false }
                : s
            ));
          }
        },
      });
    } catch (error) {
      console.error('Error queuing save job toggle:', error);
    }
  };

  const rollbackLastAction = async () => {
    if (sessionActions.length === 0) return;
    
    const lastAction = sessionActions[sessionActions.length - 1];
    
    // Optimistic UI update - immediately update UI
    // Remove from session actions
    setSessionActions(prev => prev.slice(0, -1));
    
    // Bug Fix 2: Use functional update to get current index at execution time
    // Add job back to the top of the swipe queue
    setJobs(prev => {
      // Get current index dynamically within setter
      const currentJobIndex = prev.findIndex(j => j.id === prev[currentIndex]?.id);
      const insertIndex = currentJobIndex >= 0 ? currentJobIndex : currentIndex;
      const newJobs = [...prev];
      newJobs.splice(insertIndex, 0, lastAction.job);
      return newJobs;
    });
    
    // Remove from applications if it was accepted
    if (lastAction.action === 'accepted') {
      setApplications(prev => prev.filter(app => app.jobId !== lastAction.jobId));
    }
    
    // Remove from skippedJobs if it was skipped
    if (lastAction.action === 'skipped') {
      setSkippedJobs(prev => prev.filter(s => s.id !== lastAction.jobId));
    }
    
    // Add to offline queue for background sync
    try {
      await offlineQueue.addOperation({
        type: 'rollback',
        id: lastAction.jobId,
        payload: { jobId: lastAction.jobId },
        apiCall: async (payload) => {
          await jobsApi.rollbackJob(payload.jobId);
          // Rollback synced successfully - no UI update needed
        },
      });
    } catch (error) {
      console.error('Error queuing rollback:', error);
    }
  };

  const updateApplicationStage = async (applicationId, stage) => {
    // Optimistic UI update
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, stage, updatedAt: new Date().toISOString(), pendingSync: true }
          : app
      )
    );
    
    // Add to offline queue for background sync
    try {
      await offlineQueue.addOperation({
        type: 'updateStage',
        id: applicationId,
        payload: { applicationId, stage },
        apiCall: async (payload) => {
          const result = await applicationsApi.updateStage(payload.applicationId, payload.stage);
          
          // Mark as synced
          setApplications(prev => 
            prev.map(app => 
              app.id === payload.applicationId 
                ? { ...app, updatedAt: result.application.updatedAt, pendingSync: false }
                : app
            )
          );
        },
      });
    } catch (error) {
      console.error('Error queuing stage update:', error);
    }
  };

  const reportJob = async (job, reason = 'other') => {
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
    
    setReportedJobs(prev => [newReport, ...prev]);
    console.log(`Job reported: ${reason}`);
    
    // Add to offline queue with retry capability
    try {
      await offlineQueue.addOperation({
        type: 'report',
        id: job.id,
        payload: { jobId: job.id, reason },
        apiCall: async (payload) => {
          await reportedApi.reportJob(payload.jobId, payload.reason);
          
          // Mark as synced on success
          setReportedJobs(prev => prev.map(r => 
            r.jobId === payload.jobId ? { ...r, pendingSync: false } : r
          ));
        },
      });
    } catch (error) {
      console.error('Error queuing report:', error);
      // Operation is still in queue for retry
    }
  };

  const unreportJob = async (jobId) => {
    // Optimistic UI update - remove from reported jobs immediately
    setReportedJobs(prev => prev.filter(r => r.jobId !== jobId));
    
    // Add to offline queue
    try {
      await offlineQueue.addOperation({
        type: 'unreport',
        id: jobId,
        payload: { jobId },
        apiCall: async (payload) => {
          await reportedApi.unreportJob(payload.jobId);
          // Successfully unreported - UI already updated
        },
      });
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
        favorites: state.savedJobs, // Keep for backward compatibility
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
        toggleFavorite: toggleSaveJob, // Keep for backward compatibility
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
