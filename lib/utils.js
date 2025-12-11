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
 * Get company logo URL from ui-avatars.com
 * @param {string} companyName - Company name
 * @returns {string} Logo URL
 */
export function getCompanyLogoUrl(companyName) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=80&background=0D8ABC&color=fff&bold=true`;
}

/**
 * Get relative time string from date
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 30) return `${diffInDays} days ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return '1 month ago';
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  if (diffInYears === 1) return '1 year ago';
  return `${diffInYears} years ago`;
}
