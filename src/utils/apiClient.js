/**
 * Vertex Work Stadium ERP // API & Object Storage Client
 * Handles seamless communication with the Node.js SQL Backend and Object Storage Engine.
 * Features automated offline fallbacks so the ERP remains fully functional everywhere.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Check if the SQL backend server is reachable
 */
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Fetch full bootstrapped state from relational database
 */
export async function fetchBootstrapState() {
  try {
    const res = await fetch(`${API_BASE_URL}/bootstrap`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Seed initial state into the relational database
 */
export async function seedServerDatabase(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Synchronize full or partial ERP state into the relational database in an atomic transaction
 */
export async function syncErpStateToServer(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Upload an image or file to the Object Storage Engine (Local / Cloudinary / AWS S3)
 * @param {File} file - Browser File object
 * @param {object} meta - Optional metadata { entityType, entityId, uploadedBy }
 * @returns {Promise<{ ok: boolean, file?: object, error?: string }>}
 */
export async function uploadObjectStorageFile(file, meta = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (meta.entityType) formData.append('entityType', meta.entityType);
  if (meta.entityId) formData.append('entityId', meta.entityId);
  if (meta.uploadedBy) formData.append('uploadedBy', meta.uploadedBy);

  try {
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * List media records from the SQL database
 */
export async function listMediaFiles(entityType = '') {
  try {
    const query = entityType ? `?entityType=${encodeURIComponent(entityType)}` : '';
    const res = await fetch(`${API_BASE_URL}/media${query}`);
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
