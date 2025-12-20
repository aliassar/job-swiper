// Offline-first queue management system
import { MAX_QUEUE_RETRIES, QUEUE_SAVE_DEBOUNCE_DELAY, OFFLINE_QUEUE_MAX_AGE_DAYS, MAX_BACKOFF_DELAY } from './constants';

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
    // Issue #7 fix: Track operations currently being processed to handle race conditions
    this.inFlightOperations = new Set(); // Set of idempotencyKeys currently being processed

    // Debounced version of saveQueue
    this.debouncedSaveQueue = debounce(() => this._saveQueueNow(), QUEUE_SAVE_DEBOUNCE_DELAY);

    // Validate queue on startup to detect orphaned operations
    this.validateQueueOnStartup();
  }

  // Check if operations in queue have handlers on startup
  validateQueueOnStartup() {
    // Skip validation if no queue items
    if (this.queue.length === 0) return;

    console.log(`Queue has ${this.queue.length} pending operations from previous session`);

    // Note: API call handlers will be re-registered when JobContext mounts
    // Operations without handlers will be logged and skipped during processing
    // This is expected behavior - handlers are registered lazily
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
      const serializableQueue = this.queue.map(({ type, id, payload, retries, timestamp, pendingSync, idempotencyKey }) => ({
        type,
        id,
        payload,
        retries,
        timestamp,
        pendingSync,
        idempotencyKey, // Include idempotency key for duplicate prevention
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

    // For rollback - cancels any pending accept/reject/skip
    if (type === 'rollback') {
      return {
        type: null, // Match any of these types
        matchType: (t) => ['accept', 'reject', 'skip'].includes(t),
        matchPayload: (p) => true
      };
    }

    // For accept/reject/skip - cancels any pending rollback
    if (['accept', 'reject', 'skip'].includes(type)) {
      return {
        type: 'rollback',
        matchPayload: (p) => true
      };
    }

    return null;
  }

  // Generate idempotency key for operation
  generateIdempotencyKey(type, id, timestamp) {
    return `${type}-${id}-${timestamp}`;
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
      const oppositeIndex = this.queue.findIndex(op => {
        // Check job id matches
        if (op.id !== id) return false;

        // Check type matches (support both direct type and matchType function)
        const typeMatches = opposite.matchType
          ? opposite.matchType(op.type)
          : op.type === opposite.type;
        if (!typeMatches) return false;

        // Check payload matches
        return opposite.matchPayload(op.payload);
      });

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

    const timestamp = Date.now();
    const queueItem = {
      type,
      id,
      payload,
      apiCall, // Keep in memory, won't be saved to localStorage
      retries: 0,
      timestamp,
      pendingSync: true,
      idempotencyKey: this.generateIdempotencyKey(type, id, timestamp), // Add idempotency key
    };

    if (existingIndex >= 0) {
      // Update existing operation with latest payload and new timestamp
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
    // Prevent concurrent processing
    if (this.processing) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // Take a snapshot of current queue items to process
      // Sort by timestamp to ensure correct order
      const itemsToProcess = [...this.queue].sort((a, b) => a.timestamp - b.timestamp);

      for (const operation of itemsToProcess) {
        // Check if operation is still in queue (might have been cancelled)
        const currentIndex = this.queue.findIndex(op =>
          op.idempotencyKey === operation.idempotencyKey
        );

        if (currentIndex === -1) {
          // Operation was removed (e.g., cancelled), skip it
          continue;
        }

        // Get the API call function
        const apiCall = this.getApiCall(operation);

        if (!apiCall) {
          console.warn(`No API call handler for operation type: ${operation.type}`);
          // Remove operation without handler
          this.queue.splice(currentIndex, 1);
          this.saveQueue();
          continue;
        }

        try {
          // Issue #7 fix: Mark operation as in-flight before processing
          this.inFlightOperations.add(operation.idempotencyKey);

          // Execute the API call with idempotency key as option (not in payload)
          // The idempotency key will be passed as a header via the API layer
          await apiCall(operation.payload, { idempotencyKey: operation.idempotencyKey });

          // Issue #7: Clear in-flight status
          this.inFlightOperations.delete(operation.idempotencyKey);

          // Success - remove from queue (find again in case position changed)
          const successIndex = this.queue.findIndex(op =>
            op.idempotencyKey === operation.idempotencyKey
          );
          if (successIndex !== -1) {
            this.queue.splice(successIndex, 1);
            this.saveQueue();
            this.notifyListeners();
          }
        } catch (error) {
          console.error(`Error processing operation ${operation.type}:`, error);

          // Find current operation in queue (position might have changed)
          const errorIndex = this.queue.findIndex(op =>
            op.idempotencyKey === operation.idempotencyKey
          );

          // Issue #7: Clear in-flight status on error
          this.inFlightOperations.delete(operation.idempotencyKey);

          if (errorIndex === -1) {
            // Operation was removed during processing, skip it
            continue;
          }

          // Increment retry count
          this.queue[errorIndex].retries++;

          if (this.queue[errorIndex].retries >= MAX_RETRIES) {
            // Max retries reached - remove from queue and notify failure
            const failedOp = this.queue.splice(errorIndex, 1)[0];
            this.saveQueue();
            this.notifyListeners('failed', failedOp);

            // Notify user about failure
            if (typeof window !== 'undefined') {
              console.error(`Failed to sync ${operation.type} after ${MAX_RETRIES} retries`);
              // Could show toast notification here
            }
          } else {
            // Keep in queue for retry
            this.saveQueue();

            // Wait before next retry (exponential backoff: 1s, 2s, 4s, capped at MAX_BACKOFF_DELAY)
            const backoffDelay = Math.min(Math.pow(2, this.queue[errorIndex].retries) * 1000, MAX_BACKOFF_DELAY);
            console.log(`Retrying ${operation.type} in ${backoffDelay / 1000}s (attempt ${this.queue[errorIndex].retries + 1}/${MAX_RETRIES})`);

            await new Promise(resolve =>
              setTimeout(resolve, backoffDelay)
            );
          }
        }
      }
    } finally {
      this.processing = false;

      // Check for new items added during processing
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
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
        idempotencyKey: op.idempotencyKey,
      })),
    };
  }

  // Check if an operation is pending
  isPending(type, id) {
    return this.queue.some(op => op.type === type && op.id === id);
  }

  // Rollback unsynced actions (remove from queue)
  // Issue #7 fix: Also handles operations currently in-flight
  rollbackUnsyncedAction(type, id) {
    // Find operation in queue
    const index = this.queue.findIndex(op => op.type === type && op.id === id);

    if (index >= 0) {
      const operation = this.queue[index];

      // Check if this operation is currently in-flight
      if (this.inFlightOperations.has(operation.idempotencyKey)) {
        // Operation is being processed - it will complete but we remove from queue
        // The server-side idempotency will handle any duplicate rollback calls
        console.log(`Rollback: Operation ${type}:${id} is in-flight, will complete but marked for rollback`);
      }

      const removed = this.queue.splice(index, 1);
      this._saveQueueNow(); // Immediate save for rollback
      this.notifyListeners('rollback', removed[0]);
      console.log(`Rolled back unsynced action ${type}:${id}`);
      return true;
    }

    // Check if operation WAS in queue but is now in-flight (just started processing)
    // In this case, the operation may have already been sent to server
    return false;
  }

  // Get all pending operations of a specific type
  getPendingOperations(type) {
    return this.queue.filter(op => op.type === type);
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
      addOperation: async () => { },
      processQueue: async () => { },
      getQueueStatus: () => ({ length: 0, operations: [] }),
      isPending: () => false,
      rollbackUnsyncedAction: () => false,
      getPendingOperations: () => [],
      subscribe: () => () => { },
      clearQueue: () => { },
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
