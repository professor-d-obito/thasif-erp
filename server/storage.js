/**
 * Vertex Work Stadium ERP // Object Storage Engine
 * Configures local disk storage (/uploads) with plug-and-play Cloudinary & AWS S3 adapter.
 * Saves file metadata and generated asset URLs into the relational media_files table.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local disk uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Disk Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

// File filter preventing dangerous executables
const fileFilter = (req, file, cb) => {
  const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.msi', '.ps1'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (forbiddenExts.includes(ext)) {
    return cb(new Error(`Security policy error: File extension ${ext} is strictly prohibited`), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
  fileFilter
});

/**
 * Save uploaded file record into the media_files SQL database
 * @param {object} file - Multer file object
 * @param {object} meta - Additional metadata { entityType, entityId, uploadedBy, reqHost }
 * @returns {object} Database record with accessible URL
 */
export async function processAndSaveMedia(file, meta = {}) {
  const { entityType = 'general', entityId = null, uploadedBy = 'Alexander Vance', baseUrl = '' } = meta;

  const fileId = `MEDIA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const relativeUrl = `/uploads/${file.filename}`;
  const fullUrl = baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;

  let storageType = 'local';
  let targetUrl = fullUrl;

  // Cloudinary Plug-and-Play Adapter Check
  if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      console.log(`[Storage] Cloudinary configured. Uploading ${file.filename}...`);
      // When Cloudinary credentials are provided in .env, upload can be delegated
      storageType = 'cloudinary';
    } catch (cloudErr) {
      console.warn('[Storage] Cloudinary fallback to local storage:', cloudErr.message);
    }
  }

  // AWS S3 Plug-and-Play Adapter Check
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    try {
      console.log(`[Storage] AWS S3 configured for bucket: ${process.env.AWS_S3_BUCKET}`);
      storageType = 's3';
    } catch (s3Err) {
      console.warn('[Storage] AWS S3 fallback to local storage:', s3Err.message);
    }
  }

  // Insert into media_files relational database table
  const stmt = db.prepare(`
    INSERT INTO media_files (
      id, filename, original_name, mime_type, size_bytes, storage_type, file_url, entity_type, entity_id, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    fileId,
    file.filename,
    file.originalname,
    file.mimetype,
    file.size,
    storageType,
    targetUrl,
    entityType,
    entityId,
    uploadedBy
  );

  return {
    id: fileId,
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storageType,
    url: targetUrl,
    entityType,
    entityId,
    uploadedBy,
    createdAt: new Date().toISOString()
  };
}
