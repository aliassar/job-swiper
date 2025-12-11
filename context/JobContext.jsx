'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jobsApi, favoritesApi, applicationsApi } from '@/lib/api';
import { getRequestQueue } from '@/lib/requestQueue';
import { saveJobState, loadJobState } from '@/lib/localStorage';
import { useToast } from './ToastContext';

const JobContext = createContext();

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [applications, setApplications] = useState([]);
  const [sessionActions, setSessionActions] = useState([]); // For rollback functionality
  const [pendingRollback, setPendingRollback] = useState(null); // Store state to revert to if rollback fails
  const [loading, setLoading] = useState(true);
  
  const toast = useToast();
  const requestQueue = getRequestQueue();

  // Load state from localStorage first, then sync with server
  useEffect(() => {
    // Load from localStorage immediately for instant UI
    const savedState = loadJobState();
    if (savedState.jobs.length > 0) {
      setJobs(savedState.jobs);
      setCurrentIndex(savedState.currentIndex);
      setFavorites(savedState.favorites);
      setApplications(savedState.applications);
      setSessionActions(savedState.sessionActions);
      setPendingRollback(savedState.pendingRollback);
      setLoading(false);
    }
    
    // Then fetch from server in background to sync
    fetchJobs();
    fetchFavorites();
    fetchApplications();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      saveJobState({
        jobs,
        currentIndex,
        favorites,
        applications,
        sessionActions,
        pendingRollback
      });
    }
  }, [jobs, currentIndex, favorites, applications, sessionActions, pendingRollback, loading]);

  const fetchJobs = async () => {
    // Only show loading if we don't have cached data
    if (jobs.length === 0) {
      setLoading(true);
    }
    
    try {
      const data = await jobsApi.getJobs();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
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

  const acceptJob = useCallback((job) => {
    const sequenceId = requestQueue.getNextSequenceId();
    
    // Optimistic update - Update UI immediately
    const sessionAction = { 
      jobId: job.id, 
      action: 'accepted', 
      timestamp: new Date().toISOString(),
      job: job,
      sequenceId,
      pendingSync: true
    };
    
    setSessionActions(prev => [...prev, sessionAction]);
    setCurrentIndex(prev => prev + 1);
    
    // Create optimistic application
    const optimisticApplication = {
      id: `temp_${job.id}_${Date.now()}`,
      jobId: job.id,
      job: job,
      stage: 'Applied',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setApplications(prev => [optimisticApplication, ...prev]);
    
    // Queue API request in background
    requestQueue.enqueue({
      type: 'acceptJob',
      sequenceId,
      apiCall: () => jobsApi.acceptJob(job.id),
      onSuccess: (result) => {
        // Update session action to mark as synced
        setSessionActions(prev => 
          prev.map(action => 
            action.jobId === job.id && action.sequenceId === sequenceId
              ? { ...action, pendingSync: false }
              : action
          )
        );
        
        // Update application with real data from server
        if (result.application) {
          setApplications(prev => 
            prev.map(app => 
              app.jobId === job.id && app.id.startsWith('temp_')
                ? result.application
                : app
            )
          );
        }
      },
      onFailure: (error) => {
        console.error('Failed to accept job after retries:', error);
        toast.showError(`Failed to accept job: ${job.position}. Please try again.`);
        
        // Revert optimistic updates
        setSessionActions(prev => 
          prev.filter(action => !(action.jobId === job.id && action.sequenceId === sequenceId))
        );
        setApplications(prev => 
          prev.filter(app => !(app.jobId === job.id && app.id.startsWith('temp_')))
        );
      }
    });
  }, [requestQueue, toast]);

  const rejectJob = useCallback((job) => {
    const sequenceId = requestQueue.getNextSequenceId();
    
    // Optimistic update - Update UI immediately
    const sessionAction = { 
      jobId: job.id, 
      action: 'rejected', 
      timestamp: new Date().toISOString(),
      job: job,
      sequenceId,
      pendingSync: true
    };
    
    setSessionActions(prev => [...prev, sessionAction]);
    setCurrentIndex(prev => prev + 1);
    
    // Queue API request in background
    requestQueue.enqueue({
      type: 'rejectJob',
      sequenceId,
      apiCall: () => jobsApi.rejectJob(job.id),
      onSuccess: () => {
        // Update session action to mark as synced
        setSessionActions(prev => 
          prev.map(action => 
            action.jobId === job.id && action.sequenceId === sequenceId
              ? { ...action, pendingSync: false }
              : action
          )
        );
      },
      onFailure: (error) => {
        console.error('Failed to reject job after retries:', error);
        toast.showError(`Failed to reject job: ${job.position}. Please try again.`);
        
        // Revert optimistic update
        setSessionActions(prev => 
          prev.filter(action => !(action.jobId === job.id && action.sequenceId === sequenceId))
        );
      }
    });
  }, [requestQueue, toast]);

  const skipJob = useCallback((job) => {
    const sequenceId = requestQueue.getNextSequenceId();
    
    // Optimistic update - Update UI immediately
    const sessionAction = { 
      jobId: job.id, 
      action: 'skipped', 
      timestamp: new Date().toISOString(),
      job: job,
      sequenceId,
      pendingSync: true
    };
    
    setSessionActions(prev => [...prev, sessionAction]);
    setCurrentIndex(prev => prev + 1);
    
    // Queue API request in background
    requestQueue.enqueue({
      type: 'skipJob',
      sequenceId,
      apiCall: () => jobsApi.skipJob(job.id),
      onSuccess: () => {
        // Update session action to mark as synced
        setSessionActions(prev => 
          prev.map(action => 
            action.jobId === job.id && action.sequenceId === sequenceId
              ? { ...action, pendingSync: false }
              : action
          )
        );
      },
      onFailure: (error) => {
        console.error('Failed to skip job after retries:', error);
        toast.showError(`Failed to skip job: ${job.position}. Please try again.`);
        
        // Revert optimistic update
        setSessionActions(prev => 
          prev.filter(action => !(action.jobId === job.id && action.sequenceId === sequenceId))
        );
      }
    });
  }, [requestQueue, toast]);

  const toggleFavorite = useCallback((job) => {
    const isFavorite = favorites.some(fav => fav.id === job.id);
    const newFavoriteState = !isFavorite;
    const sequenceId = requestQueue.getNextSequenceId();
    
    // Optimistically update UI immediately
    if (isFavorite) {
      setFavorites(prev => prev.filter(fav => fav.id !== job.id));
    } else {
      setFavorites(prev => [...prev, job]);
    }
    
    // Queue API request in background
    requestQueue.enqueue({
      type: 'toggleFavorite',
      sequenceId,
      apiCall: () => jobsApi.toggleFavorite(job.id, newFavoriteState),
      onSuccess: () => {
        // Nothing to do on success - UI already updated
      },
      onFailure: (error) => {
        console.error('Failed to toggle favorite after retries:', error);
        toast.showError(`Failed to ${newFavoriteState ? 'add' : 'remove'} favorite. Please try again.`);
        
        // Revert optimistic update
        if (newFavoriteState) {
          setFavorites(prev => prev.filter(fav => fav.id !== job.id));
        } else {
          setFavorites(prev => [...prev, job]);
        }
      }
    });
  }, [favorites, requestQueue, toast]);

  const rollbackLastAction = useCallback(() => {
    if (sessionActions.length === 0) return;
    
    const lastAction = sessionActions[sessionActions.length - 1];
    const sequenceId = requestQueue.getNextSequenceId();
    
    // Save current state to revert to if rollback fails
    const stateSnapshot = {
      jobs: [...jobs],
      currentIndex,
      sessionActions: [...sessionActions],
      applications: [...applications]
    };
    setPendingRollback(stateSnapshot);
    
    // Optimistic rollback - Update UI immediately
    // Remove from session actions
    setSessionActions(prev => prev.slice(0, -1));
    
    // Move back one position in the job list to show the previous job again
    setCurrentIndex(prev => Math.max(0, prev - 1));
    
    // Remove from applications if it was accepted
    if (lastAction.action === 'accepted') {
      setApplications(prev => prev.filter(app => app.jobId !== lastAction.jobId));
    }
    
    // Queue API request in background
    requestQueue.enqueue({
      type: 'rollback',
      sequenceId,
      apiCall: () => jobsApi.rollbackJob(lastAction.jobId),
      onSuccess: () => {
        // Rollback succeeded - clear pending rollback state
        setPendingRollback(null);
      },
      onFailure: (error) => {
        console.error('Failed to rollback after retries:', error);
        toast.showError('Failed to undo action. Restoring previous state.');
        
        // Revert the rollback - restore the saved state
        if (stateSnapshot) {
          setJobs(stateSnapshot.jobs);
          setCurrentIndex(stateSnapshot.currentIndex);
          setSessionActions(stateSnapshot.sessionActions);
          setApplications(stateSnapshot.applications);
          setPendingRollback(null);
        }
      }
    });
  }, [sessionActions, jobs, currentIndex, applications, requestQueue, toast]);

  const updateApplicationStage = async (applicationId, stage) => {
    try {
      const result = await applicationsApi.updateStage(applicationId, stage);
      
      // Update applications list
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, stage, updatedAt: result.application.updatedAt }
            : app
        )
      );
    } catch (error) {
      console.error('Error updating application stage:', error);
    }
  };

  const currentJob = jobs[currentIndex];
  const remainingJobs = jobs.length - currentIndex;

  return (
    <JobContext.Provider
      value={{
        jobs,
        currentJob,
        currentIndex,
        remainingJobs,
        favorites,
        applications,
        sessionActions,
        loading,
        acceptJob,
        rejectJob,
        skipJob,
        toggleFavorite,
        rollbackLastAction,
        updateApplicationStage,
        fetchApplications,
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
