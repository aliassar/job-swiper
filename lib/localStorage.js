/**
 * LocalStorage utilities for persisting application state
 */

const STORAGE_KEYS = {
  JOBS: 'job_swiper_jobs',
  CURRENT_INDEX: 'job_swiper_current_index',
  FAVORITES: 'job_swiper_favorites',
  APPLICATIONS: 'job_swiper_applications',
  SESSION_ACTIONS: 'job_swiper_session_actions',
  PENDING_ROLLBACK: 'job_swiper_pending_rollback',
};

/**
 * Save state to localStorage
 */
export function saveState(key, data) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage [${key}]:`, error);
  }
}

/**
 * Load state from localStorage
 */
export function loadState(key, defaultValue = null) {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * Remove state from localStorage
 */
export function removeState(key) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage [${key}]:`, error);
  }
}

/**
 * Save all job-related state
 */
export function saveJobState(state) {
  saveState(STORAGE_KEYS.JOBS, state.jobs);
  saveState(STORAGE_KEYS.CURRENT_INDEX, state.currentIndex);
  saveState(STORAGE_KEYS.FAVORITES, state.favorites);
  saveState(STORAGE_KEYS.APPLICATIONS, state.applications);
  saveState(STORAGE_KEYS.SESSION_ACTIONS, state.sessionActions);
  if (state.pendingRollback !== undefined) {
    saveState(STORAGE_KEYS.PENDING_ROLLBACK, state.pendingRollback);
  }
}

/**
 * Load all job-related state
 */
export function loadJobState() {
  return {
    jobs: loadState(STORAGE_KEYS.JOBS, []),
    currentIndex: loadState(STORAGE_KEYS.CURRENT_INDEX, 0),
    favorites: loadState(STORAGE_KEYS.FAVORITES, []),
    applications: loadState(STORAGE_KEYS.APPLICATIONS, []),
    sessionActions: loadState(STORAGE_KEYS.SESSION_ACTIONS, []),
    pendingRollback: loadState(STORAGE_KEYS.PENDING_ROLLBACK, null),
  };
}

/**
 * Clear all job-related state
 */
export function clearJobState() {
  Object.values(STORAGE_KEYS).forEach(key => removeState(key));
}

export { STORAGE_KEYS };
