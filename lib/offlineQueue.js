// Offline-first queue management system

const QUEUE_KEY = 'job_swiper_offline_queue';
const MAX_RETRIES = 3;

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.processing = false;
    this.listeners = new Set();
  }

  // Load queue from localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading queue:', error);
      return [];
    }
  }

  // Save queue to localStorage
  saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  // Add operation to queue immediately (no debouncing)
  async addOperation(operation) {
    const { type, id, payload, apiCall } = operation;
    
    // Check if operation already exists in queue
    const existingIndex = this.queue.findIndex(
      op => op.type === type && op.id === id
    );

    const queueItem = {
      type,
      id,
      payload,
      apiCall,
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
    
    // Process immediately
    this.processQueue();
    
    return queueItem;
  }

  // Process the queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        // Execute the API call
        await operation.apiCall(operation.payload);
        
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
    this.saveQueue();
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
