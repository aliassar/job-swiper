'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const JobContext = createContext();

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [skippedJobs, setSkippedJobs] = useState([]);
  const [sessionActions, setSessionActions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(Date.now().toString());
  }, []);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptJob = async (job) => {
    try {
      await fetch('/api/jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      
      const newHistoryItem = {
        ...job,
        action: 'accepted',
        status: 'applied',
        timestamp: new Date().toISOString(),
      };
      
      // Track in session actions
      setSessionActions(prev => [...prev, {
        jobId: job.id,
        job: job,
        action: 'accepted',
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
      }]);
      
      setHistory(prev => [newHistoryItem, ...prev]);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const rejectJob = async (job) => {
    try {
      await fetch('/api/jobs/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      
      const newHistoryItem = {
        ...job,
        action: 'rejected',
        timestamp: new Date().toISOString(),
      };
      
      // Track in session actions
      setSessionActions(prev => [...prev, {
        jobId: job.id,
        job: job,
        action: 'rejected',
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
      }]);
      
      setHistory(prev => [newHistoryItem, ...prev]);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error rejecting job:', error);
    }
  };

  const skipJob = async (job) => {
    try {
      await fetch('/api/jobs/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      
      const skippedItem = {
        ...job,
        skippedAt: new Date().toISOString(),
      };
      
      // Track in session actions
      setSessionActions(prev => [...prev, {
        jobId: job.id,
        job: job,
        action: 'skipped',
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
      }]);
      
      setSkippedJobs(prev => [skippedItem, ...prev]);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error skipping job:', error);
    }
  };

  const unskipJob = async (job) => {
    try {
      await fetch('/api/jobs/unskip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      // Remove from skipped jobs
      setSkippedJobs(prev => prev.filter(item => item.id !== job.id));
      
      // Add back to jobs queue at current position
      setJobs(prev => {
        const newJobs = [...prev];
        newJobs.splice(currentIndex, 0, job);
        return newJobs;
      });
    } catch (error) {
      console.error('Error unskipping job:', error);
    }
  };

  const toggleFavorite = async (job) => {
    const isFavorite = favorites.some(fav => fav.id === job.id);
    
    try {
      await fetch('/api/jobs/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, favorite: !isFavorite }),
      });

      if (isFavorite) {
        setFavorites(prev => prev.filter(fav => fav.id !== job.id));
      } else {
        setFavorites(prev => [...prev, job]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const rollbackLastAction = async () => {
    if (sessionActions.length === 0) return;

    const lastAction = sessionActions[sessionActions.length - 1];
    
    try {
      await fetch('/api/jobs/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: lastAction.jobId,
          previousAction: lastAction.action,
        }),
      });

      // Remove from session actions
      setSessionActions(prev => prev.slice(0, -1));

      // Handle based on action type
      if (lastAction.action === 'accepted' || lastAction.action === 'rejected') {
        // Remove from history
        setHistory(prev => prev.filter(item => item.id !== lastAction.jobId));
      } else if (lastAction.action === 'skipped') {
        // Remove from skipped jobs
        setSkippedJobs(prev => prev.filter(item => item.id !== lastAction.jobId));
      }
      
      // Add back to jobs queue at current position
      setJobs(prev => {
        const newJobs = [...prev];
        newJobs.splice(currentIndex, 0, lastAction.job);
        return newJobs;
      });
    } catch (error) {
      console.error('Error rolling back action:', error);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      // Update history item status
      setHistory(prev => prev.map(item => 
        item.id === jobId ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
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
        history,
        skippedJobs,
        sessionActions,
        loading,
        acceptJob,
        rejectJob,
        skipJob,
        unskipJob,
        toggleFavorite,
        rollbackLastAction,
        updateJobStatus,
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
