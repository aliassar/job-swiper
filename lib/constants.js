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

// API and retry constants
export const MAX_FETCH_RETRIES = 5;
export const MAX_QUEUE_RETRIES = 3;
export const ITEMS_PER_PAGE = 20;

// Debounce delays (in milliseconds)
export const SEARCH_DEBOUNCE_DELAY = 500;
export const QUEUE_SAVE_DEBOUNCE_DELAY = 250;
