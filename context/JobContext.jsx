'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jobsApi, favoritesApi, applicationsApi, reportedApi } from '@/lib/api';

const JobContext = createContext();

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reportedJobs, setReportedJobs] = useState([]);
  const [sessionActions, setSessionActions] = useState([]); // For rollback functionality
  const [loading, setLoading] = useState(true);

  // Fetch jobs and favorites on mount
  useEffect(() => {
    fetchJobs();
    fetchFavorites();
    fetchApplications();
    fetchReportedJobs();
  }, []);

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

  const fetchReportedJobs = async () => {
    try {
      const data = await reportedApi.getReportedJobs();
      setReportedJobs(data.reportedJobs);
    } catch (error) {
      console.error('Error fetching reported jobs:', error);
    }
  };

  const acceptJob = async (job) => {
    try {
      const result = await jobsApi.acceptJob(job.id);
      
      // Add to session actions for rollback
      setSessionActions(prev => [...prev, { 
        jobId: job.id, 
        action: 'accepted', 
        timestamp: new Date().toISOString(),
        job: job 
      }]);
      
      // Move to next job
      setCurrentIndex(prev => prev + 1);
      
      // Update applications
      if (result.application) {
        setApplications(prev => [result.application, ...prev]);
      }
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const rejectJob = async (job) => {
    try {
      await jobsApi.rejectJob(job.id);
      
      // Add to session actions for rollback
      setSessionActions(prev => [...prev, { 
        jobId: job.id, 
        action: 'rejected', 
        timestamp: new Date().toISOString(),
        job: job 
      }]);
      
      // Move to next job
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error rejecting job:', error);
    }
  };

  const skipJob = async (job) => {
    try {
      await jobsApi.skipJob(job.id);
      
      // Add to session actions for rollback
      setSessionActions(prev => [...prev, { 
        jobId: job.id, 
        action: 'skipped', 
        timestamp: new Date().toISOString(),
        job: job 
      }]);
      
      // Move to next job
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error skipping job:', error);
    }
  };

  const toggleFavorite = async (job) => {
    const isFavorite = favorites.some(fav => fav.id === job.id);
    const newFavoriteState = !isFavorite;
    
    // Optimistically update UI
    if (isFavorite) {
      setFavorites(prev => prev.filter(fav => fav.id !== job.id));
    } else {
      setFavorites(prev => [...prev, job]);
    }
    
    try {
      await jobsApi.toggleFavorite(job.id, newFavoriteState);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      if (newFavoriteState) {
        // If we tried to add it but failed, remove it
        setFavorites(prev => prev.filter(fav => fav.id !== job.id));
      } else {
        // If we tried to remove it but failed, add it back
        setFavorites(prev => [...prev, job]);
      }
    }
  };

  const rollbackLastAction = async () => {
    if (sessionActions.length === 0) return;
    
    const lastAction = sessionActions[sessionActions.length - 1];
    
    try {
      const result = await jobsApi.rollbackJob(lastAction.jobId);
      
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
    } catch (error) {
      console.error('Error rolling back decision:', error);
    }
  };

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
    
    try {
      await reportedApi.reportJob(job.id, reason);
      
      // Mark as synced
      setReportedJobs(prev => prev.map(r => 
        r.id === reportId ? { ...r, pendingSync: false } : r
      ));
    } catch (error) {
      console.error('Error reporting job:', error);
      // Keep pendingSync flag for retry logic (to be implemented)
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
        reportedJobs,
        sessionActions,
        loading,
        acceptJob,
        rejectJob,
        skipJob,
        toggleFavorite,
        reportJob,
        rollbackLastAction,
        updateApplicationStage,
        fetchApplications,
        fetchReportedJobs,
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
