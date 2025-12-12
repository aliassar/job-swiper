/**
 * Centralized API client for job-swiper
 * All API calls should go through this module for easy backend switching
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Job-related API calls
export const jobsApi = {
  // Get all pending jobs
  getJobs: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/api/jobs${params}`);
  },
  
  // Accept a job
  acceptJob: (jobId) => apiRequest(`/api/jobs/${jobId}/accept`, {
    method: 'POST',
  }),
  
  // Reject a job
  rejectJob: (jobId) => apiRequest(`/api/jobs/${jobId}/reject`, {
    method: 'POST',
  }),
  
  // Skip a job
  skipJob: (jobId) => apiRequest(`/api/jobs/${jobId}/skip`, {
    method: 'POST',
  }),
  
  // Toggle saved status
  toggleSaveJob: (jobId, saved) => apiRequest(`/api/jobs/${jobId}/save`, {
    method: 'POST',
    body: JSON.stringify({ saved }),
  }),
  
  // Rollback a decision (move job back to pending)
  rollbackJob: (jobId) => apiRequest(`/api/jobs/${jobId}/rollback`, {
    method: 'POST',
  }),
  
  // Get skipped jobs
  getSkippedJobs: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/api/jobs/skipped${params}`);
  },
};

// Saved Jobs API calls (also accessible as savedsApi for backward compatibility)
export const savedJobsApi = {
  // Get all saved jobs
  getSavedJobs: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/api/saved${params}`);
  },
  // Backward compatibility alias
  getSaveds: function(search = '') {
    return this.getSavedJobs(search);
  },
};

// Backward compatibility alias
export const savedsApi = savedJobsApi;

// Applications API calls
export const applicationsApi = {
  // Get all accepted jobs with their application stage
  getApplications: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/api/applications${params}`);
  },
  
  // Update application stage
  updateStage: (applicationId, stage) => apiRequest(`/api/applications/${applicationId}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage }),
  }),
};

// History API calls (for logging/debugging)
export const historyApi = {
  // Get full action history
  getHistory: () => apiRequest('/api/history'),
};

// Reported jobs API calls
export const reportedApi = {
  // Report a job
  reportJob: (jobId, reason = 'other') => apiRequest(`/api/jobs/${jobId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  
  // Unreport a job
  unreportJob: (jobId) => apiRequest(`/api/jobs/${jobId}/unreport`, {
    method: 'POST',
  }),
  
  // Get all reported jobs
  getReportedJobs: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/api/reported${params}`);
  },
};
