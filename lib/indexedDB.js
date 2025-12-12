/**
 * IndexedDB utility for persisting application state
 * Provides reliable state persistence that survives app restarts
 */

const DB_NAME = 'job_swiper_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

class IndexedDBStore {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initialize IndexedDB connection
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save data to IndexedDB
   * @param {string} key - The key to store the data under
   * @param {any} value - The value to store (will be serialized)
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      const db = await this.init();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        key,
        value,
        timestamp: Date.now(),
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put(data, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
      throw error;
    }
  }

  /**
   * Get data from IndexedDB
   * @param {string} key - The key to retrieve
   * @returns {Promise<any>} The stored value or null if not found
   */
  async get(key) {
    try {
      const db = await this.init();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Remove data from IndexedDB
   * @param {string} key - The key to remove
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      const db = await this.init();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB remove error:', error);
      throw error;
    }
  }

  /**
   * Clear all data from IndexedDB
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      const db = await this.init();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      throw error;
    }
  }
}

// Singleton instance
let indexedDBStore = null;

/**
 * Get IndexedDB store instance
 * @returns {IndexedDBStore}
 */
export function getIndexedDBStore() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    // Server-side or browser doesn't support IndexedDB
    return {
      init: async () => null,
      set: async () => {},
      get: async () => null,
      remove: async () => {},
      clear: async () => {},
    };
  }

  if (!indexedDBStore) {
    indexedDBStore = new IndexedDBStore();
  }

  return indexedDBStore;
}

/**
 * Save application state to IndexedDB
 * @param {Object} state - The state to save
 * @returns {Promise<void>}
 */
export async function saveAppState(state) {
  const store = getIndexedDBStore();
  await store.set('app_state', state);
}

/**
 * Load application state from IndexedDB
 * @returns {Promise<Object|null>} The saved state or null
 */
export async function loadAppState() {
  const store = getIndexedDBStore();
  return await store.get('app_state');
}

/**
 * Clear application state from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearAppState() {
  const store = getIndexedDBStore();
  await store.remove('app_state');
}
