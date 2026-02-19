/**
 * Centralized API client for job-swiper
 * Now backed by Axios (lib/http.js)
 */

import http, { downloadFile, setAuthRedirectHandler as setHttpAuthRedirectHandler, clearAuthRedirectHandler as clearHttpAuthRedirectHandler } from './http';

// Re-export redirect handlers for compatibility
export const setAuthRedirectHandler = setHttpAuthRedirectHandler;
export const clearAuthRedirectHandler = clearHttpAuthRedirectHandler;

// Job-related API calls
export const jobsApi = {
  // Get all pending jobs
  getJobs: (options = {}) => {
    // Accept either a string (legacy) or options object
    if (typeof options === 'string') {
      // Legacy: treat as search string
      const params = options ? `?search=${encodeURIComponent(options)}` : '';
      return http.get(`/api/jobs${params}`);
    }

    // New: build query params from options object
    const queryParams = new URLSearchParams();
    if (options.search) queryParams.append('search', options.search);
    if (options.location) queryParams.append('location', options.location);
    if (options.salaryMin) queryParams.append('salaryMin', options.salaryMin);
    if (options.salaryMax) queryParams.append('salaryMax', options.salaryMax);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const queryString = queryParams.toString();

    // Pass signal to axios config
    const config = options.signal ? { signal: options.signal } : {};

    return http.get(`/api/jobs${queryString ? `?${queryString}` : ''}`, config);
  },

  // Get count of remaining jobs
  getJobCount: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}&countOnly=true` : '?countOnly=true';
    return http.get(`/api/jobs${params}`);
  },

  // Accept a job
  acceptJob: (jobId, metadata = {}, options = {}) => http.post(`/api/jobs/${jobId}/accept`, metadata, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Reject a job
  rejectJob: (jobId, options = {}) => http.post(`/api/jobs/${jobId}/reject`, {}, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Skip a job
  skipJob: (jobId, options = {}) => http.post(`/api/jobs/${jobId}/skip`, {}, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Toggle saved status
  toggleSaveJob: (jobId, saved, options = {}) => http.post(`/api/jobs/${jobId}/save`, { saved }, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Rollback a decision (move job back to pending)
  rollbackJob: (jobId, options = {}) => http.post(`/api/jobs/${jobId}/rollback`, {}, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Get skipped jobs
  getSkippedJobs: (options = {}) => {
    if (typeof options === 'string') {
      const params = options ? `?search=${encodeURIComponent(options)}` : '';
      return http.get(`/api/jobs/skipped${params}`);
    }

    const queryParams = new URLSearchParams();
    if (options.search) queryParams.append('search', options.search);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const queryString = queryParams.toString();
    return http.get(`/api/jobs/skipped${queryString ? `?${queryString}` : ''}`);
  },

  // Get filter options (blocked companies)
  getFilters: () => http.get('/api/jobs/filters'),
};

// Saved Jobs API calls
export const savedJobsApi = {
  // Get all saved jobs
  getSavedJobs: (options = {}) => {
    if (typeof options === 'string') {
      const params = options ? `?search=${encodeURIComponent(options)}` : '';
      return http.get(`/api/saved${params}`);
    }

    const queryParams = new URLSearchParams();
    if (options.search) queryParams.append('search', options.search);
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const queryString = queryParams.toString();
    return http.get(`/api/saved${queryString ? `?${queryString}` : ''}`);
  },
  // Backward compatibility alias
  getSaveds: function (search = '') {
    return this.getSavedJobs(search);
  },

  _exportSavedJobs: async (format, search = '') => {
    const params = search ? `?format=${format}&search=${encodeURIComponent(search)}` : `?format=${format}`;
    const endpoint = `/api/saved/export${params}`;

    // Use the download helper which handles auth
    return downloadFile(endpoint, `saved-jobs.${format === 'csv' ? 'csv' : 'pdf'}`);
  },

  exportToCsv: async (search = '') => {
    return savedJobsApi._exportSavedJobs('csv', search);
  },

  exportToPdf: async (search = '') => {
    return savedJobsApi._exportSavedJobs('pdf', search);
  },
};

// Backward compatibility alias
export const savedsApi = savedJobsApi;

// Applications API calls
export const applicationsApi = {
  // Get all accepted jobs with their application stage
  getApplications: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return http.get(`/api/applications${params}`);
  },

  // Get single application by ID
  getApplication: (applicationId) => http.get(`/api/applications/${applicationId}`),

  // Update application stage
  updateStage: (applicationId, stage, options = {}) => http.put(`/api/applications/${applicationId}/stage`, { stage }, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Update application notes
  updateNotes: (applicationId, notes) => http.put(`/api/applications/${applicationId}/notes`, { notes }),

  // Update application with custom document references
  updateDocuments: (applicationId, resumeUrl, coverLetterUrl) => http.put(`/api/applications/${applicationId}/documents`, { resumeUrl, coverLetterUrl }),

  // Get application documents
  getDocuments: (applicationId) => http.get(`/api/applications/${applicationId}/documents`),

  // CV verification - confirm CV is good
  confirmCv: (applicationId) => http.post(`/api/applications/${applicationId}/cv/confirm`),

  // CV verification - reupload CV (requires FormData with file)
  reuploadCv: (applicationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/api/applications/${applicationId}/cv/reupload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Axios might set this automatically, but explicitly is fine
      }
    });
  },

  // Message verification - confirm message is good
  confirmMessage: (applicationId) => http.post(`/api/applications/${applicationId}/message/confirm`),

  // Message - edit and confirm message
  updateMessage: (applicationId, message) => http.put(`/api/applications/${applicationId}/message`, { message }),

  downloadResume: async (applicationId) => {
    return downloadFile(`/api/applications/${applicationId}/download/resume`, 'resume.pdf');
  },

  downloadCoverLetter: async (applicationId) => {
    return downloadFile(`/api/applications/${applicationId}/download/cover-letter`, 'cover-letter.pdf');
  },

  // Toggle auto status
  toggleAutoStatus: (applicationId) => http.post(`/api/applications/${applicationId}/toggle-auto-status`),

  // Delete application and revert job to pending
  deleteApplication: (applicationId) => http.delete(`/api/applications/${applicationId}`),

  // Regenerate resume and cover letter
  regenerateDocuments: (applicationId) => http.post(`/api/applications/${applicationId}/regenerate`),
};

// History API calls (for logging/debugging)
export const historyApi = {
  // Get full action history
  getHistory: () => http.get('/api/history'),
};

// Reported jobs API calls
export const reportedApi = {
  // Report a job
  reportJob: (jobId, reason, options = {}) => {
    // Handle backward compatibility
    const details = typeof options === 'string' ? options : options.details || null;
    const idempotencyKey = typeof options === 'object' ? options.idempotencyKey : undefined;
    const blockCompany = typeof options === 'object' ? options.blockCompany : undefined;

    return http.post(`/api/jobs/${jobId}/report`,
      { reason, ...(details && { details }), ...(blockCompany !== undefined && { blockCompany }) },
      { idempotencyKey }
    );
  },

  // Unreport a job
  unreportJob: (jobId, options = {}) => http.post(`/api/jobs/${jobId}/unreport`, {}, {
    idempotencyKey: options.idempotencyKey,
  }),

  // Get all reported jobs
  getReportedJobs: (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return http.get(`/api/reported${params}`);
  },
};

// Blocked companies API calls
export const blockedCompaniesApi = {
  // Get all blocked companies
  getBlockedCompanies: () => http.get('/api/blocked-companies'),

  // Unblock a company
  unblockCompany: (companyName) => http.delete(`/api/blocked-companies/${encodeURIComponent(companyName)}`),
};

// Notifications API calls
export const notificationsApi = {
  // Get notifications
  getNotifications: async (page = 1, limit = 20) => {
    const response = await http.get(`/api/notifications?page=${page}&limit=${limit}`);

    // Response is already unwrapped by http interceptor
    if (response && response.items) {
      return {
        notifications: response.items,
        unreadCount: response.unreadCount ?? response.items.filter(n => !n.isRead).length,
        pagination: response.pagination
      };
    }
    return response || { notifications: [], unreadCount: 0 };
  },

  markAsRead: (notificationId) => http.post(`/api/notifications/${notificationId}/read`),

  markAllAsRead: () => http.post('/api/notifications/read-all'),

  deleteNotification: (notificationId) => http.delete(`/api/notifications/${notificationId}`),

  clearAll: () => http.delete('/api/notifications'),

  getUnreadCount: () => http.get('/api/notifications/unread-count'),
};

// Email connection API calls
export const emailApi = {
  getConnections: () => http.get('/api/email-connections'),
  connectGmail: () => http.post('/api/email-connections/gmail'),
  connectOutlook: () => http.post('/api/email-connections/outlook'),
  connectYahoo: () => http.post('/api/email-connections/yahoo'),

  connectImap: (email, host, port, username, password) => http.post('/api/email-connections/imap', {
    email, host, port, username, password
  }),

  disconnect: (connectionId) => http.delete(`/api/email-connections/${connectionId}`),

  testConnection: (connectionId) => http.post(`/api/email-connections/${connectionId}/test`),

  syncConnection: (connectionId) => http.post(`/api/email-connections/${connectionId}/sync`),

  // Legacy
  connect: (provider, email, password, imapServer = null, imapPort = null) => http.post('/api/email', {
    provider, email, password, imapServer, imapPort
  }),

  getStatus: () => http.get('/api/email'),
};

// User settings API calls
export const userApi = {
  getSettings: () => http.get('/api/settings'),

  updateSettings: (settings) => http.put('/api/settings', settings),

  exportData: () => http.post('/api/users/me/export'),

  deleteAccount: () => http.delete('/api/users/me'),
};
