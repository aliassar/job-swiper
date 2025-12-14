// Offline-first queue management system
import { MAX_QUEUE_RETRIES, QUEUE_SAVE_DEBOUNCE_DELAY, OFFLINE_QUEUE_MAX_AGE_DAYS } from './constants';

const QUEUE_KEY = 'job_swiper_offline_queue';
const MAX_RETRIES = MAX_QUEUE_RETRIES;
const MAX_AGE_MS = OFFLINE_QUEUE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// Simple debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.processing = false;
    this.listeners = new Set();
    this.apiCallRegistry = new Map(); // Store apiCall functions by operation type
    
    // Debounced version of saveQueue
    this.debouncedSaveQueue = debounce(() => this._saveQueueNow(), QUEUE_SAVE_DEBOUNCE_DELAY);
  }

  // Load queue from localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (!stored) return [];
      
      const queue = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out operations older than MAX_AGE_MS
      const validQueue = queue.filter(op => {
        const age = now - op.timestamp;
        if (age > MAX_AGE_MS) {
          console.log(`Discarding old operation ${op.type}:${op.id} (age: ${Math.floor(age / 1000 / 60 / 60 / 24)} days)`);
          return false;
        }
        return true;
      });
      
      return validQueue;
    } catch (error) {
      console.error('Error loading queue:', error);
      return [];
    }
  }

  // Save queue to localStorage immediately (private method)
  _saveQueueNow() {
    try {
      // Remove apiCall functions before saving (they can't be serialized)
      const serializableQueue = this.queue.map(({ type, id, payload, retries, timestamp, pendingSync }) => ({
        type,
        id,
        payload,
        retries,
        timestamp,
        pendingSync,
      }));
      localStorage.setItem(QUEUE_KEY, JSON.stringify(serializableQueue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  // Save queue to localStorage (debounced)
  saveQueue() {
    this.debouncedSaveQueue();
  }

  // Register an API call handler for a specific operation type
  registerApiCall(type, apiCall) {
    this.apiCallRegistry.set(type, apiCall);
  }

  // Get API call for an operation (from registry or from operation itself)
  getApiCall(operation) {
    return operation.apiCall || this.apiCallRegistry.get(operation.type);
  }

  // Define opposite operations for cancellation
  getOppositeOperation(type, payload) {
    // For saveJob toggle operations, opposite is when saved state is different
    if (type === 'saveJob') {
      return {
        type: 'saveJob',
        // If current is saving (saved: true), opposite is unsaving (saved: false)
        matchPayload: (p) => p.saved === !payload.saved
      };
    }
    
    // For report/unreport operations
    if (type === 'report') {
      return {
        type: 'unreport',
        matchPayload: (p) => true // Any unreport for same jobId cancels report
      };
    }
    
    if (type === 'unreport') {
      return {
        type: 'report',
        matchPayload: (p) => true // Any report for same jobId cancels unreport
      };
    }
    
    return null;
  }

  // Add operation to queue immediately (no debouncing)
  async addOperation(operation) {
    const { type, id, payload, apiCall } = operation;
    
    // Register the apiCall for this type if provided
    if (apiCall) {
      this.registerApiCall(type, apiCall);
    }
    
    // Feature 20: Check for opposite operation cancellation
    const opposite = this.getOppositeOperation(type, payload);
    if (opposite) {
      const oppositeIndex = this.queue.findIndex(
        op => op.type === opposite.type && op.id === id && opposite.matchPayload(op.payload)
      );
      
      if (oppositeIndex >= 0) {
        // Found opposite operation - remove both (they cancel each other)
        this.queue.splice(oppositeIndex, 1);
        this.saveQueue();
        this.notifyListeners();
        console.log(`Cancelled opposite operations for ${type}:${id}`);
        return null;
      }
    }
    
    // Check if operation already exists in queue
    const existingIndex = this.queue.findIndex(
      op => op.type === type && op.id === id
    );

    const queueItem = {
      type,
      id,
      payload,
      apiCall, // Keep in memory, won't be saved to localStorage
      retries: 0,
      timestamp: Date.now(),
      pendingSync: true,
    };

    if (existingIndex >= 0) {
      // Update existing operation with latest payload
      this.queue[existingIndex] = queueItem;
    } else {
      // Add new operation
      this.queue.push(queueItem);
    }

    this.saveQueue();
    this.notifyListeners();
    
    // Process queue asynchronously to avoid blocking UI
    setTimeout(() => this.processQueue(), 0);
    
    return queueItem;
  }

  // Process the queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];
      
      // Get the API call function
      const apiCall = this.getApiCall(operation);
      
      if (!apiCall) {
        console.warn(`No API call handler for operation type: ${operation.type}`);
        // Remove operation without handler
        this.queue.shift();
        this.saveQueue();
        continue;
      }

      try {
        // Execute the API call
        await apiCall(operation.payload);
        
        // Success - remove from queue
        this.queue.shift();
        this.saveQueue();
        this.notifyListeners();
      } catch (error) {
        console.error(`Error processing operation ${operation.type}:`, error);
        
        // Increment retry count
        operation.retries++;

        if (operation.retries >= MAX_RETRIES) {
          // Max retries reached - remove from queue and notify failure
          this.queue.shift();
          this.saveQueue();
          this.notifyListeners('failed', operation);
          
          // Notify user about failure
          if (typeof window !== 'undefined') {
            console.error(`Failed to sync ${operation.type} after ${MAX_RETRIES} retries`);
            // Could show toast notification here
          }
        } else {
          // Keep in queue for retry
          this.queue[0] = operation;
          this.saveQueue();
          
          // Wait before next retry (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, operation.retries) * 1000)
          );
        }
      }
    }

    this.processing = false;
  }

  // Get current queue status
  getQueueStatus() {
    return {
      length: this.queue.length,
      operations: this.queue.map(op => ({
        type: op.type,
        id: op.id,
        retries: op.retries,
        timestamp: op.timestamp,
      })),
    };
  }

  // Check if an operation is pending
  isPending(type, id) {
    return this.queue.some(op => op.type === type && op.id === id);
  }

  // Subscribe to queue changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners(event = 'update', data = null) {
    this.listeners.forEach(listener => listener(event, data));
  }

  // Clear all pending operations (for testing/debugging)
  clearQueue() {
    this.queue = [];
    this._saveQueueNow(); // Use immediate save for critical operations
    this.notifyListeners();
  }
}

// Singleton instance
let offlineQueueInstance = null;

export function getOfflineQueue() {
  if (typeof window === 'undefined') {
    // Server-side rendering - return mock
    return {
      addOperation: async () => {},
      processQueue: async () => {},
      getQueueStatus: () => ({ length: 0, operations: [] }),
      isPending: () => false,
      subscribe: () => () => {},
      clearQueue: () => {},
    };
  }

  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineQueue();
    
    // Process queue when coming back online
    window.addEventListener('online', () => {
      offlineQueueInstance.processQueue();
    });
    
    // Process queue on page load
    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete') {
        offlineQueueInstance.processQueue();
      } else {
        window.addEventListener('load', () => {
          offlineQueueInstance.processQueue();
        });
      }
    }
  }

  return offlineQueueInstance;
}
