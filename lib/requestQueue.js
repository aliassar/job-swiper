/**
 * Request Queue System with Retry Logic
 * Handles optimistic updates with background sync and retry capability
 */

const STORAGE_KEY = 'job-swiper-pending-requests';
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.sequenceId = 0;
    this.loadFromStorage();
  }

  /**
   * Get next sequence ID for ordering operations
   */
  getSequenceId() {
    this.sequenceId++;
    this.saveSequenceId();
    return this.sequenceId;
  }

  /**
   * Load sequence ID from localStorage
   */
  loadSequenceId() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('job-swiper-sequence-id');
      if (stored) {
        this.sequenceId = parseInt(stored, 10);
      }
    }
  }

  /**
   * Save sequence ID to localStorage
   */
  saveSequenceId() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('job-swiper-sequence-id', this.sequenceId.toString());
    }
  }

  /**
   * Load pending requests from localStorage
   */
  loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.queue = JSON.parse(stored);
        }
        this.loadSequenceId();
      } catch (error) {
        console.error('Error loading request queue from storage:', error);
        this.queue = [];
      }
    }
  }

  /**
   * Save pending requests to localStorage
   */
  saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      } catch (error) {
        console.error('Error saving request queue to storage:', error);
      }
    }
  }

  /**
   * Add a request to the queue
   * @param {Object} request - Request configuration
   * @param {Function} request.fn - Function that returns a Promise
   * @param {Function} request.onSuccess - Success callback
   * @param {Function} request.onFailure - Failure callback (after all retries)
   * @param {number} request.sequenceId - Sequence ID for ordering
   * @param {Object} request.metadata - Additional metadata
   */
  enqueue(request) {
    const queueItem = {
      id: Date.now() + Math.random(),
      retries: 0,
      timestamp: Date.now(),
      ...request,
    };

    this.queue.push(queueItem);
    this.saveToStorage();

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Process the queue with retry logic
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        // Execute the request
        const result = await item.fn();
        
        // Success - remove from queue and call success callback
        this.queue.shift();
        this.saveToStorage();
        
        if (item.onSuccess) {
          item.onSuccess(result);
        }
      } catch (error) {
        console.error('Request failed:', error, 'Retry:', item.retries + 1);
        
        // Increment retry count
        item.retries++;

        if (item.retries >= MAX_RETRIES) {
          // Max retries reached - remove from queue and call failure callback
          this.queue.shift();
          this.saveToStorage();
          
          if (item.onFailure) {
            item.onFailure(error);
          }
        } else {
          // Retry with exponential backoff
          const delay = BASE_DELAY * Math.pow(2, item.retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Move to end of queue to avoid blocking other requests
          this.queue.shift();
          this.queue.push(item);
          this.saveToStorage();
        }
      }
    }

    this.processing = false;
  }

  /**
   * Retry a specific request by ID
   */
  async retry(requestId) {
    const item = this.queue.find(req => req.id === requestId);
    if (item) {
      item.retries = 0; // Reset retry count
      this.saveToStorage();
      if (!this.processing) {
        this.processQueue();
      }
    }
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing,
      items: this.queue.map(item => ({
        id: item.id,
        retries: item.retries,
        metadata: item.metadata,
        sequenceId: item.sequenceId,
      })),
    };
  }
}

// Singleton instance
let queueInstance = null;

export function getRequestQueue() {
  if (!queueInstance) {
    queueInstance = new RequestQueue();
  }
  return queueInstance;
}

export default getRequestQueue;
