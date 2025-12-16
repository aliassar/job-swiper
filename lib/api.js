/**
 * Centralized API client for job-swiper
 * All API calls should go through this module for easy backend switching
 */

import { getAuthHeaders } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Configurable login URL - can be overridden via environment variable
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';

/**
 * Helper function to make API requests with authentication
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 * @throws {Error} API errors including authentication errors
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Get authentication headers
  const authHeaders = await getAuthHeaders();
  
  // Don't set Content-Type for FormData - let browser set multipart boundary
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...authHeaders, ...options.headers }  // For FormData, only add auth headers
    : {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      };
  
  const config = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      console.warn('Authentication required - redirecting to login');
      if (typeof window !== 'undefined') {
        // Use window.location for redirect to ensure full page reload and auth state clear
        window.location.href = LOGIN_URL;
      }
      throw new Error('Authentication required');
    }
    
    // Try to parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // Non-JSON response (e.g., HTML error page from proxy/gateway)
      // The response body has been consumed by the failed json() call
      throw new Error(`Server returned non-JSON response for ${endpoint}: ${response.status} ${response.statusText}`);
    }
    
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
  getJobs: (options = {}) => {
    // Accept either a string (legacy) or options object
    if (typeof options === 'string') {
      // Legacy: treat as search string
      const params = options ? `?search=${encodeURIComponent(options)}` : '';
      return apiRequest(`/api/jobs${params}`);
    }
    
    // New: build query params from options object
    const queryParams = new URLSearchParams();
    if (options.search) queryParams.append('search', options.search);
    if (options.location) queryParams.append('location', options.location);
    if (options.salaryMin) queryParams.append('salaryMin', options.salaryMin);
    if (options.salaryMax) queryParams.append('salaryMax', options.salaryMax);
    
    const queryString = queryParams.toString();
    return apiRequest(`/api/jobs${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get count of remaining jobs
  getJobCount: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}&countOnly=true` : '?countOnly=true';
    return apiRequest(`/api/jobs${params}`);
  },
  
  // Accept a job
  acceptJob: (jobId, metadata = {}) => apiRequest(`/api/jobs/${jobId}/accept`, {
    method: 'POST',
    body: JSON.stringify(metadata),
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
  
  // Get filter options (blocked companies)
  getFilters: () => apiRequest('/api/jobs/filters'),
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
  
  // Export saved jobs to CSV
  exportToCsv: (search = '') => {
    const params = search ? `?format=csv&search=${encodeURIComponent(search)}` : '?format=csv';
    return `${API_URL}/api/saved/export${params}`;
  },
  
  // Export saved jobs to PDF
  exportToPdf: (search = '') => {
    const params = search ? `?format=pdf&search=${encodeURIComponent(search)}` : '?format=pdf';
    return `${API_URL}/api/saved/export${params}`;
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
  
  // Get single application by ID
  getApplication: (applicationId) => apiRequest(`/api/applications/${applicationId}`),
  
  // Update application stage
  updateStage: (applicationId, stage) => apiRequest(`/api/applications/${applicationId}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage }),
  }),
  
  // Update application notes
  updateNotes: (applicationId, notes) => apiRequest(`/api/applications/${applicationId}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  }),
  
  // Update application with custom document references
  updateDocuments: (applicationId, resumeUrl, coverLetterUrl) => apiRequest(`/api/applications/${applicationId}/documents`, {
    method: 'PUT',
    body: JSON.stringify({ resumeUrl, coverLetterUrl }),
  }),
  
  // Get application documents
  getDocuments: (applicationId) => apiRequest(`/api/applications/${applicationId}/documents`),
  
  // CV verification - confirm CV is good
  confirmCv: (applicationId) => apiRequest(`/api/applications/${applicationId}/cv/confirm`, {
    method: 'POST',
  }),
  
  // CV verification - reupload CV (requires FormData with file)
  reuploadCv: (applicationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/api/applications/${applicationId}/cv/reupload`, {
      method: 'POST',
      body: formData,
      // Don't set headers - let apiRequest detect FormData and handle appropriately
    });
  },
  
  // Message verification - confirm message is good
  confirmMessage: (applicationId) => apiRequest(`/api/applications/${applicationId}/message/confirm`, {
    method: 'POST',
  }),
  
  // Message - edit and confirm message
  updateMessage: (applicationId, message) => apiRequest(`/api/applications/${applicationId}/message`, {
    method: 'PUT',
    body: JSON.stringify({ message }),
  }),
  
  // Download generated resume
  downloadResume: (applicationId) => `${API_URL}/api/applications/${applicationId}/download/resume`,
  
  // Download cover letter
  downloadCoverLetter: (applicationId) => `${API_URL}/api/applications/${applicationId}/download/cover-letter`,
  
  // Toggle auto status
  toggleAutoStatus: (applicationId) => apiRequest(`/api/applications/${applicationId}/toggle-auto-status`, {
    method: 'POST',
  }),
};

// History API calls (for logging/debugging)
export const historyApi = {
  // Get full action history
  getHistory: () => apiRequest('/api/history'),
};

// Reported jobs API calls
export const reportedApi = {
  // Report a job - reason must be one of: 'fake', 'not_interested', 'dont_recommend_company'
  reportJob: (jobId, reason, details = null) => apiRequest(`/api/jobs/${jobId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, ...(details && { details }) }),
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

// Notifications API calls
export const notificationsApi = {
  // Get notifications with pagination
  getNotifications: async (page = 1, limit = 20) => {
    const response = await apiRequest(`/api/notifications?page=${page}&limit=${limit}`);
    
    // Normalize server response format
    // Server returns: { success: true, data: { items: [...], pagination: {...} } }
    // We normalize to: { notifications: [...], unreadCount: N }
    if (response && response.data && response.data.items) {
      const notifications = response.data.items;
      const unreadCount = notifications.filter(n => !n.read).length;
      return { notifications, unreadCount };
    }
    
    // Fallback for local mock API format: { notifications: [...], unreadCount: N }
    return response || { notifications: [], unreadCount: 0 };
  },
  
  // Mark single notification as read
  markAsRead: (notificationId) => apiRequest(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  }),
  
  // Mark all notifications as read
  markAllAsRead: () => apiRequest('/api/notifications/read-all', {
    method: 'POST',
  }),
  
  // Delete single notification
  deleteNotification: (notificationId) => apiRequest(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  }),
  
  // Clear all notifications
  clearAll: () => apiRequest('/api/notifications', {
    method: 'DELETE',
  }),
  
  // Get unread count
  getUnreadCount: () => apiRequest('/api/notifications/unread-count'),
};

// Email connection API calls
export const emailApi = {
  // List connected emails
  getConnections: () => apiRequest('/api/email-connections'),
  
  // Start Gmail OAuth
  connectGmail: () => apiRequest('/api/email-connections/gmail', { method: 'POST' }),
  
  // Start Outlook OAuth  
  connectOutlook: () => apiRequest('/api/email-connections/outlook', { method: 'POST' }),
  
  // Start Yahoo OAuth
  connectYahoo: () => apiRequest('/api/email-connections/yahoo', { method: 'POST' }),
  
  // Add IMAP connection
  connectImap: (email, host, port, username, password) => apiRequest('/api/email-connections/imap', {
    method: 'POST',
    body: JSON.stringify({ email, host, port, username, password }),
  }),
  
  // Remove connection
  disconnect: (connectionId) => apiRequest(`/api/email-connections/${connectionId}`, { method: 'DELETE' }),
  
  // Test connection
  testConnection: (connectionId) => apiRequest(`/api/email-connections/${connectionId}/test`, { method: 'POST' }),
  
  // Sync credentials to stage updater
  syncConnection: (connectionId) => apiRequest(`/api/email-connections/${connectionId}/sync`, { method: 'POST' }),
  
  // Legacy methods for backward compatibility
  connect: (provider, email, password, imapServer = null, imapPort = null) => apiRequest('/api/email', {
    method: 'POST',
    body: JSON.stringify({ provider, email, password, imapServer, imapPort }),
  }),
  
  getStatus: () => apiRequest('/api/email'),
};

// User settings API calls
export const userApi = {
  // Get user settings - endpoint is /api/settings
  getSettings: () => apiRequest('/api/settings'),
  
  // Update user settings - endpoint is /api/settings with flat body (not wrapped in settings object)
  updateSettings: (settings) => apiRequest('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  
  // Export user data (GDPR compliance)
  exportData: () => apiRequest('/api/users/me/export', { method: 'POST' }),
  
  // Delete account
  deleteAccount: () => apiRequest('/api/users/me', { method: 'DELETE' }),
};
