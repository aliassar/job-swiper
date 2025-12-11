/**
 * Utility functions for the Job Swiper application
 */

/**
 * Generate a unique ID for mock API use
 * Combines timestamp with random string to prevent collisions
 * 
 * @param {string} prefix - Optional prefix for the ID (e.g., 'app', 'history')
 * @returns {string} A unique ID string
 */
export function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}
