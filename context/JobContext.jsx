'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jobsApi, favoritesApi, applicationsApi, reportedApi } from '@/lib/api';
import { getOfflineQueue } from '@/lib/offlineQueue';

const JobContext = createContext();

// Configuration constants
const MAX_FETCH_RETRIES = 5;

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedJobs, setSavedJobs] = useState([]); // Renamed from favorites
  const [applications, setApplications] = useState([]);
  const [reportedJobs, setReportedJobs] = useState([]);
  const [skippedJobs, setSkippedJobs] = useState([]); // Track skipped jobs locally
  const [sessionActions, setSessionActions] = useState([]); // For rollback functionality
  const [loading, setLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState({ length: 0, operations: [] });
  const [fetchError, setFetchError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize offline queue
  const offlineQueue = getOfflineQueue();

  // Fetch jobs and saved jobs on mount
  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
    fetchApplications();
    fetchReportedJobs();
    fetchSkippedJobs();
    
    // Subscribe to queue updates
    const unsubscribe = offlineQueue.subscribe((event, data) => {
      setQueueStatus(offlineQueue.getQueueStatus());
      
      if (event === 'failed') {
        // Handle failed operation
        console.error('Operation failed:', data);
        // Could show user notification here
      }
    });

    return unsubscribe;
  }, []);

  const fetchJobs = async (retryAttempt = 0) => {
    setLoading(true);
    setFetchError(null);
    
    try {
      const data = await jobsApi.getJobs();
      setJobs(data.jobs);
      setRetryCount(0); // Reset retry count on success
      setFetchError(null);
      setLoading(false); // Set loading false on success
    } catch (error) {
      console.error(`Error fetching jobs (attempt ${retryAttempt + 1}):`, error);
      
      if (retryAttempt < MAX_FETCH_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, retryAttempt) * 1000;
        console.log(`Retrying in ${delay / 1000}s...`);
        setRetryCount(retryAttempt + 1);
        
        setTimeout(() => {
          fetchJobs(retryAttempt + 1);
        }, delay);
      } else {
        // Max retries reached
        setFetchError({
          message: 'Unable to load jobs. Please check your connection and try again.',
          canRetry: true,
        });
        setLoading(false);
      }
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const data = await favoritesApi.getFavorites();
      setSavedJobs(data.favorites);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const data = await applicationsApi.getApplications();
      setApplications(data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchReportedJobs = async () => {
    try {
      const data = await reportedApi.getReportedJobs();
      setReportedJobs(data.reportedJobs);
    } catch (error) {
      console.error('Error fetching reported jobs:', error);
    }
  };

  const fetchSkippedJobs = async () => {
    try {
      const data = await jobsApi.getSkippedJobs();
      // Merge with local skippedJobs, prioritizing local ones
      const serverSkipped = data.jobs.map(job => ({ ...job, pendingSync: false }));
      setSkippedJobs(prev => {
        const merged = [...prev];
        serverSkipped.forEach(serverJob => {
          if (!merged.some(local => local.id === serverJob.id)) {
            merged.push(serverJob);
          }
        });
        return merged;
      });
    } catch (error) {
      console.error('Error fetching skipped jobs:', error);
    }
  };

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
    
    // Add job back to the top of the swipe queue
    setJobs(prev => {
      const newJobs = [...prev];
      newJobs.splice(currentIndex, 0, lastAction.job);
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

  const currentJob = jobs[currentIndex];
  const remainingJobs = jobs.length - currentIndex;

  const manualRetry = () => {
    setRetryCount(0);
    setFetchError(null);
    fetchJobs(0);
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        currentJob,
        remainingJobs,
        savedJobs,
        favorites: savedJobs, // Keep for backward compatibility
        applications,
        reportedJobs,
        skippedJobs,
        sessionActions,
        loading,
        fetchError,
        retryCount,
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
