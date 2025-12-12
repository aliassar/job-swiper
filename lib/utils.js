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

/**
 * Debounce function - delays execution until after wait time has elapsed since last call
 * Useful for search inputs and API calls
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 * Useful for scroll handlers and frequent events
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sanitize user input to prevent XSS attacks
 * Trims whitespace, limits length, and removes HTML tags
 * 
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 500)
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  return sanitized;
}
