'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const JobContext = createContext();

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
        timestamp: new Date().toISOString(),
      };
      
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
      
      setHistory(prev => [newHistoryItem, ...prev]);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error rejecting job:', error);
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

  const rollbackDecision = async (historyItem) => {
    try {
      await fetch('/api/jobs/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: historyItem.id }),
      });

      // Remove from history
      setHistory(prev => prev.filter(item => item.id !== historyItem.id));
      
      // Add back to jobs queue at current position
      setJobs(prev => {
        const newJobs = [...prev];
        newJobs.splice(currentIndex, 0, historyItem);
        return newJobs;
      });
    } catch (error) {
      console.error('Error rolling back decision:', error);
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
        loading,
        acceptJob,
        rejectJob,
        toggleFavorite,
        rollbackDecision,
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
