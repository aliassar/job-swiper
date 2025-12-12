'use server';

/**
 * Next.js Server Actions for Job Operations
 * These functions run on the server and can be called directly from client components
 * They provide better performance and security compared to API routes
 */

import { revalidatePath } from 'next/cache';

// Import the job storage (in a real app, this would be a database)
// For this mock implementation, we'll use the same in-memory storage
let jobsStorage = null;

// Initialize storage reference (would be DB connection in production)
function getJobsStorage() {
  if (!jobsStorage) {
    // In a real app, this would import from a shared DB module
    // For now, we'll reference the API route's storage
    try {
      const { jobsStorage: storage } = require('../api/jobs/route');
      jobsStorage = storage;
    } catch (error) {
      console.error('Error accessing job storage:', error);
      throw new Error('Database not available');
    }
  }
  return jobsStorage;
}

/**
 * Accept a job and create an application
 * @param {string} jobId - The ID of the job to accept
 * @returns {Object} The created application
 */
export async function acceptJob(jobId) {
  try {
    const storage = getJobsStorage();
    const job = storage.jobs.find(j => j.id === jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    const applicationId = `app-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const application = {
      id: applicationId,
      jobId: job.id,
      company: job.company,
      position: job.position,
      location: job.location,
      skills: job.skills,
      stage: 'Applied',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.applications.set(applicationId, application);
    storage.userJobStatus.set(jobId, {
      status: 'accepted',
      acceptedAt: application.appliedAt,
      favorite: storage.userJobStatus.get(jobId)?.favorite || false,
    });

    // Revalidate relevant paths
    revalidatePath('/');
    revalidatePath('/applications');

    return { success: true, application };
  } catch (error) {
    console.error('Error in acceptJob action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a job
 * @param {string} jobId - The ID of the job to reject
 * @returns {Object} Success status
 */
export async function rejectJob(jobId) {
  try {
    const storage = getJobsStorage();
    
    storage.userJobStatus.set(jobId, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      favorite: storage.userJobStatus.get(jobId)?.favorite || false,
    });

    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Error in rejectJob action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Skip a job
 * @param {string} jobId - The ID of the job to skip
 * @returns {Object} Success status
 */
export async function skipJob(jobId) {
  try {
    const storage = getJobsStorage();
    
    storage.userJobStatus.set(jobId, {
      status: 'skipped',
      skippedAt: new Date().toISOString(),
      favorite: storage.userJobStatus.get(jobId)?.favorite || false,
    });

    revalidatePath('/');
    revalidatePath('/skipped');
    
    return { success: true };
  } catch (error) {
    console.error('Error in skipJob action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle save status of a job
 * @param {string} jobId - The ID of the job
 * @param {boolean} favorite - Whether to save or unsave
 * @returns {Object} Success status
 */
export async function toggleSaveJob(jobId, favorite) {
  try {
    const storage = getJobsStorage();
    const existingStatus = storage.userJobStatus.get(jobId) || { status: 'pending' };
    
    storage.userJobStatus.set(jobId, {
      ...existingStatus,
      favorite,
      favoritedAt: favorite ? new Date().toISOString() : undefined,
    });

    revalidatePath('/saved');
    
    return { success: true, favorite };
  } catch (error) {
    console.error('Error in toggleSaveJob action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update application stage
 * @param {string} applicationId - The ID of the application
 * @param {string} stage - The new stage
 * @returns {Object} Updated application
 */
export async function updateApplicationStage(applicationId, stage) {
  try {
    const storage = getJobsStorage();
    const application = storage.applications.get(applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const updatedApplication = {
      ...application,
      stage,
      updatedAt: new Date().toISOString(),
    };

    storage.applications.set(applicationId, updatedApplication);

    revalidatePath('/applications');
    
    return { success: true, application: updatedApplication };
  } catch (error) {
    console.error('Error in updateApplicationStage action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Report a job
 * @param {string} jobId - The ID of the job to report
 * @param {string} reason - The reason for reporting
 * @returns {Object} Success status
 */
export async function reportJob(jobId, reason = 'other') {
  try {
    const storage = getJobsStorage();
    const job = storage.jobs.find(j => j.id === jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const report = {
      id: reportId,
      jobId: job.id,
      reason,
      reportedAt: new Date().toISOString(),
      job: {
        id: job.id,
        company: job.company,
        position: job.position,
        location: job.location,
        skills: job.skills,
      },
    };

    storage.reportedJobs.set(reportId, report);

    revalidatePath('/reported');
    
    return { success: true, report };
  } catch (error) {
    console.error('Error in reportJob action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unreport a job
 * @param {string} jobId - The ID of the job to unreport
 * @returns {Object} Success status
 */
export async function unreportJob(jobId) {
  try {
    const storage = getJobsStorage();
    
    // Find and remove all reports for this job
    for (const [reportId, report] of storage.reportedJobs.entries()) {
      if (report.jobId === jobId) {
        storage.reportedJobs.delete(reportId);
      }
    }

    revalidatePath('/reported');
    
    return { success: true };
  } catch (error) {
    console.error('Error in unreportJob action:', error);
    return { success: false, error: error.message };
  }
}
