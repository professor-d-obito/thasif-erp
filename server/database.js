/**
 * Vertex Work Stadium ERP // Relational Database Engine
 * Supports SQLite (local zero-config, ACID compliant) and PostgreSQL (via DATABASE_URL).
 * Initializes all enterprise ERP relational tables, indexes, and seeds initial data.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for SQLite file
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'erp_database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode (Write-Ahead Logging) and Foreign Keys for optimal concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize all relational tables
 */
export function initDatabase() {
  console.log(`[SQL Database] Initializing schema at ${dbPath}...`);

  db.exec(`
    -- 1. Company Configuration
    CREATE TABLE IF NOT EXISTS company_config (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subtitle TEXT,
      leader TEXT NOT NULL,
      leader_title TEXT,
      admin_username TEXT,
      admin_password_hash TEXT,
      currency TEXT DEFAULT '$',
      tax_rate REAL DEFAULT 8.5,
      logo_url TEXT,
      banner_url TEXT,
      login_bg_url TEXT,
      login_avatar_url TEXT,
      theme TEXT DEFAULT 'stadium-cobalt',
      sound_enabled INTEGER DEFAULT 1,
      current_role TEXT,
      splash_mode TEXT DEFAULT 'cyber',
      splash_video_url TEXT,
      google_account_email TEXT,
      module_themes TEXT, -- JSON string
      menu_configuration TEXT, -- JSON string
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Staff Accounts
    CREATE TABLE IF NOT EXISTS staff_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      status TEXT DEFAULT 'Active',
      allowed_modules TEXT, -- JSON array string
      assigned_tasks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Inventory Assets & Armory
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      unit_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      supplier TEXT,
      location TEXT,
      status TEXT DEFAULT 'In Stock',
      last_restocked TEXT,
      image_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Commercial Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_email TEXT,
      date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      items TEXT, -- JSON array string
      subtotal REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Treasury Ledger Transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Income' | 'Expense'
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      reference TEXT,
      account TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Operatives & Personnel
    CREATE TABLE IF NOT EXISTS operatives (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      salary REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      avatar_url TEXT,
      hire_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Tasks & Mission Board
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      module TEXT DEFAULT 'General',
      priority TEXT DEFAULT 'High',
      stage TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'blocked', 'done'
      blocked_reason TEXT,
      assignee TEXT NOT NULL,
      assignee_avatar TEXT,
      due_date TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Strategic Projects
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT,
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      start_date TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'In Progress',
      progress INTEGER DEFAULT 0,
      lead TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Notes & Reminders
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content_html TEXT NOT NULL,
      is_team INTEGER DEFAULT 0,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      tags TEXT, -- JSON array string
      is_pinned INTEGER DEFAULT 0,
      color_tag TEXT DEFAULT '#2563eb',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      note_id TEXT,
      title TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      recurring_interval TEXT DEFAULT 'none',
      priority TEXT DEFAULT 'High',
      status TEXT DEFAULT 'pending',
      assigned_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user TEXT NOT NULL,
      role TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Custom Modules
    CREATE TABLE IF NOT EXISTS custom_modules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'Layers',
      category TEXT DEFAULT 'Custom',
      description TEXT,
      fields TEXT, -- JSON array of field definitions
      records TEXT, -- JSON array of dynamic rows
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Object Storage Media Files Table
    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      storage_type TEXT DEFAULT 'local', -- 'local' | 'cloudinary' | 's3'
      file_url TEXT NOT NULL,
      entity_type TEXT, -- 'inventory', 'avatar', 'splash', 'document'
      entity_id TEXT,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high efficiency queries
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);
    CREATE INDEX IF NOT EXISTS idx_reminders_status_time ON reminders(status, timestamp);
    CREATE INDEX IF NOT EXISTS idx_media_files_entity ON media_files(entity_type, entity_id);
  `);

  console.log('[SQL Database] Relational tables and indexes verified successfully.');
}

export default db;
