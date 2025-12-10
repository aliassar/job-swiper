/**
 * Centralized API Client
 * 
 * This module provides a unified interface for making API calls.
 * It can be easily configured to point to an external backend later.
 */

// Use empty string for relative URLs when running in Next.js (default)
// Set NEXT_PUBLIC_API_URL environment variable to point to external backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  // Ensure endpoint starts with / for relative URLs
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${normalizedEndpoint}` : normalizedEndpoint;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // TODO: Add authentication token from session
  // const token = await getAuthToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Jobs API
 */
export const jobsAPI = {
  /**
   * Get available jobs
   */
  getJobs: async () => {
    return fetchAPI('/api/jobs');
  },

  /**
   * Accept a job
   */
  acceptJob: async (jobId) => {
    return fetchAPI('/api/jobs/accept', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },

  /**
   * Reject a job
   */
  rejectJob: async (jobId) => {
    return fetchAPI('/api/jobs/reject', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },

  /**
   * Skip a job
   */
  skipJob: async (jobId) => {
    return fetchAPI('/api/jobs/skip', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },

  /**
   * Unskip a job (restore to queue)
   */
  unskipJob: async (jobId) => {
    return fetchAPI('/api/jobs/unskip', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
  },

  /**
   * Rollback a previous action
   */
  rollbackAction: async (jobId, previousAction) => {
    return fetchAPI('/api/jobs/rollback', {
      method: 'POST',
      body: JSON.stringify({ jobId, previousAction }),
    });
  },

  /**
   * Toggle favorite status
   */
  toggleFavorite: async (jobId, favorite) => {
    return fetchAPI('/api/jobs/favorite', {
      method: 'POST',
      body: JSON.stringify({ jobId, favorite }),
    });
  },
};

/**
 * User Jobs API
 */
export const userJobsAPI = {
  /**
   * Get user's job interactions
   */
  getUserJobs: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/api/user/jobs${query}`);
  },

  /**
   * Get skipped jobs
   */
  getSkippedJobs: async () => {
    return fetchAPI('/api/user/skipped');
  },

  /**
   * Update job status
   */
  updateJobStatus: async (jobId, status) => {
    return fetchAPI(`/api/user/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

/**
 * Export a default API object with all endpoints
 */
const api = {
  jobs: jobsAPI,
  userJobs: userJobsAPI,
};

export default api;
