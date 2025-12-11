'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jobsApi, favoritesApi, applicationsApi } from '@/lib/api';
import { getRequestQueue } from '@/lib/requestQueue';
import { useToast } from './ToastContext';

const JobContext = createContext();

// LocalStorage keys
const STORAGE_KEYS = {
  JOBS: 'job-swiper-jobs',
  CURRENT_INDEX: 'job-swiper-current-index',
  FAVORITES: 'job-swiper-favorites',
  APPLICATIONS: 'job-swiper-applications',
  SESSION_ACTIONS: 'job-swiper-session-actions',
  STATE_SNAPSHOTS: 'job-swiper-state-snapshots',
};

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [applications, setApplications] = useState([]);
  const [sessionActions, setSessionActions] = useState([]); // For rollback functionality
  const [loading, setLoading] = useState(true);
  const [pendingSync, setPendingSync] = useState(new Map()); // Track pending operations
  const [stateSnapshots, setStateSnapshots] = useState([]); // For rollback reversion
  
  const toast = useToast();
  const requestQueue = getRequestQueue();

  // Load state from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage();
    // Then fetch fresh data from server in background
    fetchJobs();
    fetchFavorites();
    fetchApplications();
  }, []);

  // Load state from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedJobs = localStorage.getItem(STORAGE_KEYS.JOBS);
      const storedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
      const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const storedApplications = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      const storedSessionActions = localStorage.getItem(STORAGE_KEYS.SESSION_ACTIONS);
      const storedSnapshots = localStorage.getItem(STORAGE_KEYS.STATE_SNAPSHOTS);

      if (storedJobs) setJobs(JSON.parse(storedJobs));
      if (storedIndex) setCurrentIndex(parseInt(storedIndex, 10));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedApplications) setApplications(JSON.parse(storedApplications));
      if (storedSessionActions) setSessionActions(JSON.parse(storedSessionActions));
      if (storedSnapshots) setStateSnapshots(JSON.parse(storedSnapshots));

      // If we have stored data, we're not loading
      if (storedJobs) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save state to localStorage
  const saveToLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
      localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, currentIndex.toString());
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
      localStorage.setItem(STORAGE_KEYS.SESSION_ACTIONS, JSON.stringify(sessionActions));
      localStorage.setItem(STORAGE_KEYS.STATE_SNAPSHOTS, JSON.stringify(stateSnapshots));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [jobs, currentIndex, favorites, applications, sessionActions, stateSnapshots]);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  const fetchJobs = async () => {
    setLoading(true);
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

  // Create state snapshot for rollback
  const createSnapshot = useCallback(() => {
    return {
      jobs: [...jobs],
      currentIndex,
      favorites: [...favorites],
      applications: [...applications],
      sessionActions: [...sessionActions],
      timestamp: Date.now(),
    };
  }, [jobs, currentIndex, favorites, applications, sessionActions]);

  const acceptJob = useCallback((job) => {
    // 1. Create snapshot before action
    const snapshot = createSnapshot();
    setStateSnapshots(prev => [...prev, snapshot]);

    // 2. Immediately update UI (optimistic)
    const actionData = { 
      jobId: job.id, 
      action: 'accepted', 
      timestamp: new Date().toISOString(),
      job: job 
    };
    
    setSessionActions(prev => [...prev, actionData]);
    setCurrentIndex(prev => prev + 1);
    
    // Optimistically add to applications
    const optimisticApplication = {
      id: `temp-${job.id}`,
      jobId: job.id,
      job: job,
      stage: 'applied',
      appliedAt: new Date().toISOString(),
    };
    setApplications(prev => [optimisticApplication, ...prev]);

    // 3. Mark as pending sync
    setPendingSync(prev => new Map(prev).set(`accept-${job.id}`, true));

    // 4. Enqueue API request with retry
    const sequenceId = requestQueue.getSequenceId();
    requestQueue.enqueue({
      fn: () => jobsApi.acceptJob(job.id),
      sequenceId,
      metadata: { action: 'accept', jobId: job.id },
      onSuccess: (result) => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`accept-${job.id}`);
          return next;
        });
        
        // Update with real application data
        if (result.application) {
          setApplications(prev => 
            prev.map(app => 
              app.jobId === job.id ? result.application : app
            )
          );
        }
      },
      onFailure: (error) => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`accept-${job.id}`);
          return next;
        });
        
        // Show error toast but DO NOT revert UI
        toast.showError(`Failed to sync "Accept" for ${job.position}. Please check your connection.`, 7000);
      },
    });
  }, [createSnapshot, requestQueue, toast]);

  const rejectJob = useCallback((job) => {
    // 1. Create snapshot before action
    const snapshot = createSnapshot();
    setStateSnapshots(prev => [...prev, snapshot]);

    // 2. Immediately update UI (optimistic)
    const actionData = { 
      jobId: job.id, 
      action: 'rejected', 
      timestamp: new Date().toISOString(),
      job: job 
    };
    
    setSessionActions(prev => [...prev, actionData]);
    setCurrentIndex(prev => prev + 1);

    // 3. Mark as pending sync
    setPendingSync(prev => new Map(prev).set(`reject-${job.id}`, true));

    // 4. Enqueue API request with retry
    const sequenceId = requestQueue.getSequenceId();
    requestQueue.enqueue({
      fn: () => jobsApi.rejectJob(job.id),
      sequenceId,
      metadata: { action: 'reject', jobId: job.id },
      onSuccess: () => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`reject-${job.id}`);
          return next;
        });
      },
      onFailure: (error) => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`reject-${job.id}`);
          return next;
        });
        
        // Show error toast but DO NOT revert UI
        toast.showError(`Failed to sync "Reject" for ${job.position}. Please check your connection.`, 7000);
      },
    });
  }, [createSnapshot, requestQueue, toast]);

  const skipJob = useCallback((job) => {
    // 1. Create snapshot before action
    const snapshot = createSnapshot();
    setStateSnapshots(prev => [...prev, snapshot]);

    // 2. Immediately update UI (optimistic)
    const actionData = { 
      jobId: job.id, 
      action: 'skipped', 
      timestamp: new Date().toISOString(),
      job: job 
    };
    
    setSessionActions(prev => [...prev, actionData]);
    setCurrentIndex(prev => prev + 1);

    // 3. Mark as pending sync
    setPendingSync(prev => new Map(prev).set(`skip-${job.id}`, true));

    // 4. Enqueue API request with retry
    const sequenceId = requestQueue.getSequenceId();
    requestQueue.enqueue({
      fn: () => jobsApi.skipJob(job.id),
      sequenceId,
      metadata: { action: 'skip', jobId: job.id },
      onSuccess: () => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`skip-${job.id}`);
          return next;
        });
      },
      onFailure: (error) => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`skip-${job.id}`);
          return next;
        });
        
        // Show error toast but DO NOT revert UI
        toast.showError(`Failed to sync "Skip" for ${job.position}. Please check your connection.`, 7000);
      },
    });
  }, [createSnapshot, requestQueue, toast]);

  const toggleFavorite = useCallback((job) => {
    const isFavorite = favorites.some(fav => fav.id === job.id);
    const newFavoriteState = !isFavorite;
    
    // 1. Immediately update UI (optimistic)
    if (isFavorite) {
      setFavorites(prev => prev.filter(fav => fav.id !== job.id));
    } else {
      setFavorites(prev => [...prev, job]);
    }

    // 2. Mark as pending sync
    setPendingSync(prev => new Map(prev).set(`favorite-${job.id}`, true));

    // 3. Enqueue API request with retry
    const sequenceId = requestQueue.getSequenceId();
    requestQueue.enqueue({
      fn: () => jobsApi.toggleFavorite(job.id, newFavoriteState),
      sequenceId,
      metadata: { action: 'toggleFavorite', jobId: job.id, newState: newFavoriteState },
      onSuccess: () => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`favorite-${job.id}`);
          return next;
        });
      },
      onFailure: (error) => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`favorite-${job.id}`);
          return next;
        });
        
        // Show error toast but DO NOT revert UI
        const action = newFavoriteState ? 'add to' : 'remove from';
        toast.showError(`Failed to ${action} favorites for ${job.position}. Please check your connection.`, 7000);
      },
    });
  }, [favorites, requestQueue, toast]);

  const rollbackLastAction = useCallback(() => {
    if (sessionActions.length === 0) return;
    
    const lastAction = sessionActions[sessionActions.length - 1];
    
    // 1. Immediately restore previous state snapshot in UI (optimistic rollback)
    const snapshotBeforeRollback = createSnapshot(); // Save current state
    
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

    // 2. Mark as pending sync
    setPendingSync(prev => new Map(prev).set(`rollback-${lastAction.jobId}`, true));

    // 3. Get sequence ID for this rollback operation
    const sequenceId = requestQueue.getSequenceId();

    // 4. Enqueue rollback API request with retry
    requestQueue.enqueue({
      fn: () => jobsApi.rollbackJob(lastAction.jobId, sequenceId),
      sequenceId,
      metadata: { action: 'rollback', jobId: lastAction.jobId },
      onSuccess: () => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`rollback-${lastAction.jobId}`);
          return next;
        });
      },
      onFailure: (error) => {
        // Clear pending flag
        setPendingSync(prev => {
          const next = new Map(prev);
          next.delete(`rollback-${lastAction.jobId}`);
          return next;
        });
        
        // REVERT the rollback - restore the state we had before rollback
        setJobs(snapshotBeforeRollback.jobs);
        setCurrentIndex(snapshotBeforeRollback.currentIndex);
        setFavorites(snapshotBeforeRollback.favorites);
        setApplications(snapshotBeforeRollback.applications);
        setSessionActions(snapshotBeforeRollback.sessionActions);
        
        // Show error toast
        toast.showError(`Failed to undo action for ${lastAction.job.position}. Action has been restored.`, 7000);
      },
    });
  }, [sessionActions, currentIndex, createSnapshot, requestQueue, toast]);

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
        remainingJobs,
        favorites,
        applications,
        sessionActions,
        loading,
        pendingSync,
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
