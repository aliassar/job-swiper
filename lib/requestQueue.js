/**
 * Request Queue System with Retry Logic
 * Handles queuing API requests, automatic retries with exponential backoff,
 * and persistence across page refreshes
 */

const STORAGE_KEY = 'job_swiper_request_queue';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.sequenceId = 0;
    this.listeners = new Set();
    
    // Load queue and sequence ID from localStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Load queue from localStorage
   */
  loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.queue = data.queue || [];
        this.sequenceId = data.sequenceId || 0;
      }
    } catch (error) {
      console.error('Error loading request queue from storage:', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        queue: this.queue,
        sequenceId: this.sequenceId
      }));
    } catch (error) {
      console.error('Error saving request queue to storage:', error);
    }
  }

  /**
   * Get next sequence ID for version tracking
   */
  getNextSequenceId() {
    return ++this.sequenceId;
  }

  /**
   * Add a request to the queue
   * @param {Object} request - Request configuration
   * @param {Function} request.apiCall - The API call function to execute
   * @param {Function} request.onSuccess - Callback on success
   * @param {Function} request.onFailure - Callback on final failure (after all retries)
   * @param {String} request.type - Type of request for logging
   * @param {Number} request.sequenceId - Version/sequence ID for the request
   */
  enqueue(request) {
    const queueItem = {
      ...request,
      retries: 0,
      timestamp: Date.now(),
      id: `${request.type}_${Date.now()}_${Math.random()}`
    };
    
    this.queue.push(queueItem);
    this.saveToStorage();
    this.notifyListeners();
    
    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }
    
    return queueItem.id;
  }

  /**
   * Process the queue
   */
  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue[0];
      
      try {
        // Execute the API call
        const result = await request.apiCall();
        
        // Success - remove from queue and call success callback
        this.queue.shift();
        this.saveToStorage();
        this.notifyListeners();
        
        if (request.onSuccess) {
          request.onSuccess(result);
        }
        
      } catch (error) {
        console.error(`Request failed (attempt ${request.retries + 1}/${MAX_RETRIES}):`, error);
        
        request.retries++;
        
        if (request.retries >= MAX_RETRIES) {
          // Max retries reached - remove from queue and call failure callback
          console.error(`Request permanently failed after ${MAX_RETRIES} retries:`, request.type);
          this.queue.shift();
          this.saveToStorage();
          this.notifyListeners();
          
          if (request.onFailure) {
            request.onFailure(error);
          }
        } else {
          // Retry with exponential backoff
          const backoffTime = INITIAL_BACKOFF * Math.pow(2, request.retries - 1);
          console.log(`Retrying in ${backoffTime}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    this.processing = false;
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      sequenceId: this.sequenceId
    };
  }

  /**
   * Clear the entire queue (useful for testing or reset)
   */
  clear() {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Add listener for queue changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of queue changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getStatus()));
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

export default RequestQueue;
