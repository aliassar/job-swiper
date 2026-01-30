/**
 * Application-wide constants
 * Centralized location for all configuration values
 */

// Swipe animation constants
export const SWIPE_THRESHOLD = 60;
export const EXIT_DISTANCE = 300;
export const VELOCITY_THRESHOLD = 300;
export const EXIT_ROTATION = 20;
export const EXIT_PADDING = 200;
export const EXIT_FALLBACK = 800;
export const DRAG_CONSTRAINTS = { top: 0, bottom: 0, left: 0, right: 0 };
export const ANIMATION_SYNC_DELAY = 50; // Delay to ensure exit animation starts before state update
export const ACTION_TIMEOUT_MS = 1000; // Safety timeout to reset action lock if state update fails

// API and retry constants
export const MAX_FETCH_RETRIES = 5;
export const MAX_QUEUE_RETRIES = 3;

/**
 * Number of items to fetch per page
 * 
 * IMPORTANT: This must match the server's default pagination limit
 * Server default: 20 items per page
 * 
 * Synchronization: If the server default changes, this constant must be updated.
 * Check server pagination configuration in:
 * - Backend API route handlers
 * - Database query limits
 * - API documentation
 * 
 * Future improvement: Consider fetching this value from a server config endpoint
 * to eliminate manual synchronization requirement.
 * 
 * @constant {number}
 */
export const ITEMS_PER_PAGE = 20;

// Offline queue constants
export const OFFLINE_QUEUE_MAX_AGE_DAYS = 7; // Discard operations older than 7 days
export const MAX_BACKOFF_DELAY = 30000; // 30 seconds - maximum retry delay

// Debounce delays (in milliseconds)
export const SEARCH_DEBOUNCE_DELAY = 500;
export const QUEUE_SAVE_DEBOUNCE_DELAY = 500;

// Navigation and state persistence delays (in milliseconds)
export const NAVIGATION_DELAY = 300; // Delay before navigation to allow animations
export const STATE_PERSISTENCE_DEBOUNCE = 1000; // Debounce for persisting state to IndexedDB

// Notification polling interval (in milliseconds)
export const NOTIFICATION_POLL_INTERVAL = 30000; // 30 seconds

/**
 * Application stages in the job application workflow
 * 
 * IMPORTANT: These values must match the server's applicationStageEnum in src/db/schema.ts
 * If the server stages change, these must be updated accordingly.
 * 
 * @see server: src/db/schema.ts - applicationStageEnum
 */
export const APPLICATION_STAGES = [
  'Being Applied',
  'Applied',
  'In Review',
  'Accepted',
  'Rejected',
  'Withdrawn',
];

/**
 * Stage display configuration for UI
 * 
 * IMPORTANT: Color and icon mappings should align with server's stage definitions
 * If server stage semantics change, update these display configs accordingly
 */
export const STAGE_CONFIG = {
  'Being Applied': { color: 'blue', icon: '⏳', label: 'Being Applied' },
  'Applied': { color: 'green', icon: '✅', label: 'Applied' },
  'In Review': { color: 'purple', icon: '🔍', label: 'In Review' },
  'Accepted': { color: 'green', icon: '🏆', label: 'Accepted' },
  'Rejected': { color: 'red', icon: '❌', label: 'Rejected' },
  'Withdrawn': { color: 'gray', icon: '🚪', label: 'Withdrawn' },
};

/**
 * Report reasons for flagging jobs
 * Must match server's reportReasonEnum
 */
export const REPORT_REASONS = [
  { value: 'fake', label: 'Fake or Scam Job' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'dont_recommend_company', label: "Don't Recommend This Company" },
];

/**
 * Notification types
 * Must match server's notificationTypeEnum
 */
export const NOTIFICATION_TYPES = {
  cv_ready: 'cv_ready',
  message_ready: 'message_ready',
  status_changed: 'status_changed',
  follow_up_reminder: 'follow_up_reminder',
  verification_needed: 'verification_needed',
  generation_failed: 'generation_failed',
  apply_failed: 'apply_failed',
};
