/**
 * IndexedDB & LocalStorage Persistence Layer for Photo Collage Studio
 * Handles binary image assets, project documents, thumbnails, and session recovery.
 */

const DB_NAME = 'PhotoCollageStudioDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_ASSETS = 'assets';
const STORE_THUMBNAILS = 'thumbnails';

// In-Memory & LocalStorage Fallback Adapter for Node / Non-IndexedDB Environments
const memoryStore = {
  projects: new Map(),
  assets: new Map(),
  thumbnails: new Map(),
};

/**
 * Opens IndexedDB database or returns fallback
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null); // Fallback to memoryStore
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'metadata.projectId' });
        }
        if (!db.objectStoreNames.contains(STORE_ASSETS)) {
          db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_THUMBNAILS)) {
          db.createObjectStore(STORE_THUMBNAILS, { keyPath: 'projectId' });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => {
        console.warn('IndexedDB failed to open, using storage fallback:', event.target.error);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB exception, using fallback:', e);
      resolve(null);
    }
  });
}

/**
 * Generic IndexedDB transaction helper
 */
async function runTransaction(storeName, mode, callback) {
  const db = await openDB();
  if (!db) {
    return callback(null, memoryStore[storeName]);
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      callback(store, null, resolve, reject);
    } catch (err) {
      console.warn(`IndexedDB transaction error on ${storeName}:`, err);
      // Fallback
      resolve(callback(null, memoryStore[storeName]));
    }
  });
}

// --- ASSET STORAGE METHODS ---

/**
 * Saves binary image asset (Blob or Base64/DataURL) to IndexedDB
 */
export async function saveAsset(assetObj) {
  if (!assetObj || !assetObj.id) return false;
  try {
    const db = await openDB();
    if (!db) {
      memoryStore.assets.set(assetObj.id, assetObj);
      return true;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ASSETS, 'readwrite');
      const store = tx.objectStore(STORE_ASSETS);
      store.put(assetObj);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        memoryStore.assets.set(assetObj.id, assetObj);
        resolve(true);
      };
    });
  } catch (e) {
    memoryStore.assets.set(assetObj.id, assetObj);
    return true;
  }
}

/**
 * Retrieves an asset by ID from IndexedDB
 */
export async function getAsset(assetId) {
  if (!assetId) return null;
  try {
    const db = await openDB();
    if (!db) {
      return memoryStore.assets.get(assetId) || null;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ASSETS, 'readonly');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.get(assetId);
      req.onsuccess = () => resolve(req.result || memoryStore.assets.get(assetId) || null);
      req.onerror = () => resolve(memoryStore.assets.get(assetId) || null);
    });
  } catch (e) {
    return memoryStore.assets.get(assetId) || null;
  }
}

/**
 * Deletes an asset by ID from IndexedDB
 */
export async function deleteAsset(assetId) {
  if (!assetId) return false;
  try {
    memoryStore.assets.delete(assetId);
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ASSETS, 'readwrite');
      const store = tx.objectStore(STORE_ASSETS);
      store.delete(assetId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    });
  } catch (e) {
    return true;
  }
}

/**
 * Lists all stored assets
 */
export async function listAssets() {
  try {
    const db = await openDB();
    if (!db) {
      return Array.from(memoryStore.assets.values());
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ASSETS, 'readonly');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(Array.from(memoryStore.assets.values()));
    });
  } catch (e) {
    return Array.from(memoryStore.assets.values());
  }
}

// --- PROJECT STORAGE METHODS ---

/**
 * Saves a full project data structure to IndexedDB
 */
export async function saveProject(projectData) {
  if (!projectData || !projectData.metadata?.projectId) return false;
  try {
    memoryStore.projects.set(projectData.metadata.projectId, projectData);

    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.put(projectData);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    });
  } catch (e) {
    return true;
  }
}

/**
 * Gets a project by ID from IndexedDB
 */
export async function getProject(projectId) {
  if (!projectId) return null;
  try {
    const db = await openDB();
    if (!db) {
      return memoryStore.projects.get(projectId) || null;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(projectId);
      req.onsuccess = () => resolve(req.result || memoryStore.projects.get(projectId) || null);
      req.onerror = () => resolve(memoryStore.projects.get(projectId) || null);
    });
  } catch (e) {
    return memoryStore.projects.get(projectId) || null;
  }
}

/**
 * Deletes a project by ID from IndexedDB
 */
export async function deleteProject(projectId) {
  if (!projectId) return false;
  try {
    memoryStore.projects.delete(projectId);
    memoryStore.thumbnails.delete(projectId);

    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_PROJECTS, STORE_THUMBNAILS], 'readwrite');
      tx.objectStore(STORE_PROJECTS).delete(projectId);
      tx.objectStore(STORE_THUMBNAILS).delete(projectId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    });
  } catch (e) {
    return true;
  }
}

/**
 * Lists all saved projects metadata and headers
 */
export async function listProjects() {
  try {
    const db = await openDB();
    if (!db) {
      return Array.from(memoryStore.projects.values()).map((p) => p.metadata);
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).map((p) => p));
      req.onerror = () => resolve(Array.from(memoryStore.projects.values()));
    });
  } catch (e) {
    return Array.from(memoryStore.projects.values());
  }
}

// --- THUMBNAIL METHODS ---

export async function saveThumbnail(projectId, dataUrl) {
  if (!projectId || !dataUrl) return false;
  try {
    memoryStore.thumbnails.set(projectId, dataUrl);
    const db = await openDB();
    if (!db) return true;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_THUMBNAILS, 'readwrite');
      tx.objectStore(STORE_THUMBNAILS).put({ projectId, dataUrl, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    });
  } catch (e) {
    return true;
  }
}

export async function getThumbnail(projectId) {
  if (!projectId) return null;
  try {
    const db = await openDB();
    if (!db) return memoryStore.thumbnails.get(projectId) || null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_THUMBNAILS, 'readonly');
      const req = tx.objectStore(STORE_THUMBNAILS).get(projectId);
      req.onsuccess = () => resolve(req.result?.dataUrl || memoryStore.thumbnails.get(projectId) || null);
      req.onerror = () => resolve(memoryStore.thumbnails.get(projectId) || null);
    });
  } catch (e) {
    return memoryStore.thumbnails.get(projectId) || null;
  }
}
