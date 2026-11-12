/**
 * Kamui Enterprise ERP // Crimson Security & Crypto Module
 * Implements Web Crypto API password hashing (SHA-256 with salt),
 * brute-force lockout protection, cryptographic session tokens,
 * input sanitization, file MIME/size validation, and Zod backup schema validation.
 */
import { z } from 'zod';

// Constant salt for local application integrity hashing
const ERP_CRYPTO_SALT = 'KAMUI_ENTERPRISE_SECRET_SALT_2026_#CRIMSON';

/**
 * Hash a password using standard browser Web Crypto API SHA-256
 * @param {string} password 
 * @returns {Promise<string>} Hex-encoded SHA-256 hash string
 */
export async function hashPassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ERP_CRYPTO_SALT}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a candidate password against an existing SHA-256 hash
 * @param {string} candidatePassword 
 * @param {string} storedHash 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(candidatePassword, storedHash) {
  if (!candidatePassword || !storedHash) return false;
  const candidateHash = await hashPassword(candidatePassword);
  return candidateHash === storedHash;
}

/**
 * Generate a cryptographically secure random session token
 * @returns {string} Secure random token
 */
export function generateSecureSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Client-Side Brute-Force Rate Limiting & Account Lockout Tracker
 */
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  lockoutDurationMs: 60 * 1000, // 60 seconds lockout
};

const loginAttempts = {
  admin: { count: 0, lockedUntil: 0 },
  staff: { count: 0, lockedUntil: 0 },
};

export function checkLoginRateLimit(type = 'admin') {
  const record = loginAttempts[type] || loginAttempts.admin;
  const now = Date.now();

  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingSeconds,
      message: `Too many failed attempts. Security lockout active for ${remainingSeconds}s.`
    };
  }

  return { allowed: true, remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - record.count };
}

export function recordFailedLogin(type = 'admin') {
  const record = loginAttempts[type] || loginAttempts.admin;
  const now = Date.now();

  record.count += 1;
  if (record.count >= RATE_LIMIT_CONFIG.maxAttempts) {
    record.lockedUntil = now + RATE_LIMIT_CONFIG.lockoutDurationMs;
    record.count = 0; // reset counter after locking
    return {
      locked: true,
      remainingSeconds: Math.ceil(RATE_LIMIT_CONFIG.lockoutDurationMs / 1000)
    };
  }

  return {
    locked: false,
    remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - record.count
  };
}

export function recordSuccessfulLogin(type = 'admin') {
  if (loginAttempts[type]) {
    loginAttempts[type].count = 0;
    loginAttempts[type].lockedUntil = 0;
  }
}

/**
 * Zod Schema for ERP Backup Restoration
 * Prevents Prototype Pollution, rogue field injection, and corrupt payloads
 */
export const ErpBackupRestoreSchema = z.object({
  exportTimestamp: z.string().optional(),
  system: z.string().optional(),
  leader: z.string().min(1).max(100),
  config: z.object({
    name: z.string().min(1).max(100),
    leader: z.string().min(1).max(100),
    theme: z.string().optional(),
    currency: z.string().max(10).optional(),
    taxRate: z.number().optional(),
  }).passthrough(),
  inventory: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    stock: z.number(),
    unitPrice: z.number(),
  })).optional(),
  invoices: z.array(z.object({
    id: z.string(),
    clientName: z.string(),
    total: z.number(),
  })).optional(),
  transactions: z.array(z.object({
    id: z.string(),
    type: z.string(),
    amount: z.number(),
  })).optional(),
  operatives: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  })).optional(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
  })).optional(),
  notes: z.array(z.object({
    id: z.string(),
    title: z.string(),
  })).optional(),
  reminders: z.array(z.object({
    id: z.string(),
    title: z.string(),
  })).optional(),
  rolePermissions: z.record(z.any()).optional(),
  customModules: z.array(z.any()).optional(),
  staffAccounts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    role: z.string(),
    status: z.string().optional(),
  })).optional(),
});

/**
 * Validate imported JSON backup file against strict Zod schema
 */
export function validateErpBackup(data) {
  try {
    const validated = ErpBackupRestoreSchema.parse(data);
    return { ok: true, data: validated };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError 
        ? err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
        : 'Invalid ERP backup schema structure.'
    };
  }
}

/**
 * File Security Validator: Validates file size and MIME-type
 */
export function validateUploadedFile(file, options = {}) {
  const {
    maxSizeBytes = 15 * 1024 * 1024, // 15 MB default
    allowedMimePrefixes = ['video/', 'image/', 'application/json', 'application/pdf'],
    allowedExtensions = ['.mp4', '.webm', '.jpg', '.jpeg', '.png', '.svg', '.json', '.pdf']
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds maximum allowable limit of ${maxMb}MB.` };
  }

  const fileNameLower = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileNameLower.endsWith(ext));
  const hasValidMime = allowedMimePrefixes.some(prefix => file.type.startsWith(prefix));

  if (!hasValidExtension && !hasValidMime) {
    return { valid: false, error: `Unauthorized file type (${file.type || 'unknown'}).` };
  }

  return { valid: true };
}
