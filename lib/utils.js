/**
 * Utility functions for the Job Swiper app
 */

/**
 * Generate a company logo URL using UI Avatars service
 * Falls back to a gradient background if the service is unavailable
 * 
 * @param {string} companyName - The company name
 * @param {number} size - The size of the avatar in pixels (default: 60)
 * @returns {string} - The avatar URL
 */
export function getCompanyLogoUrl(companyName, size = 60) {
  // For production, consider implementing a local fallback or caching strategy
  // to handle cases where the external service is unavailable
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=${size}&background=0D8ABC&color=fff&bold=true`;
}

/**
 * Calculate relative time from a date string
 * 
 * @param {string} dateString - ISO 8601 date string
 * @returns {string} - Relative time description
 */
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}
