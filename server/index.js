/**
 * Vertex Work Stadium ERP // Backend REST API & Relational SQL Storage Server
 * Built with Express, SQLite/PostgreSQL relational database, and Object Storage.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import db, { initDatabase } from './database.js';
import { upload, processAndSaveMedia } from './storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for local and public edge tunnel origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded media files
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Initialize Relational SQL Database
initDatabase();

// ==============================================================================
// 1. SYSTEM HEALTH & METRICS
// ==============================================================================
app.get('/api/health', (req, res) => {
  try {
    const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    const trxCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
    const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media_files').get().count;
    const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff_accounts').get().count;

    res.json({
      status: 'ONLINE',
      system: 'Vertex Work Stadium ERP // SQL Storage Engine',
      engine: 'SQLite 3 (ACID Relational) with PostgreSQL Adapter Support',
      storage: {
        type: process.env.CLOUDINARY_URL ? 'Cloudinary' : (process.env.AWS_S3_BUCKET ? 'AWS S3' : 'Local Disk Storage'),
        mediaCount,
        uploadsDirectory: uploadsPath
      },
      stats: {
        inventoryRecords: invCount,
        transactionRecords: trxCount,
        mediaFiles: mediaCount,
        staffAccounts: staffCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// ==============================================================================
// 2. BOOTSTRAP ENDPOINT (Sync Full State to Frontend)
// ==============================================================================
app.get('/api/bootstrap', (req, res) => {
  try {
    const configRow = db.prepare('SELECT * FROM company_config LIMIT 1').get();
    let config = null;
    if (configRow) {
      config = {
        ...configRow,
        taxRate: configRow.tax_rate,
        soundEnabled: Boolean(configRow.sound_enabled),
        moduleThemes: configRow.module_themes ? JSON.parse(configRow.module_themes) : {},
        menuConfiguration: configRow.menu_configuration ? JSON.parse(configRow.menu_configuration) : []
      };
    }

    const inventory = db.prepare('SELECT * FROM inventory ORDER BY created_at DESC').all();
    const invoicesRaw = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    const invoices = invoicesRaw.map(inv => ({
      ...inv,
      items: inv.items ? JSON.parse(inv.items) : []
    }));

    const transactions = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
    const operatives = db.prepare('SELECT * FROM operatives ORDER BY created_at DESC').all();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    
    const notesRaw = db.prepare('SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC').all();
    const notes = notesRaw.map(n => ({
      ...n,
      isTeam: Boolean(n.is_team),
      isPinned: Boolean(n.is_pinned),
      tags: n.tags ? JSON.parse(n.tags) : []
    }));

    const reminders = db.prepare('SELECT * FROM reminders ORDER BY timestamp ASC').all();
    
    const staffRaw = db.prepare('SELECT * FROM staff_accounts ORDER BY created_at ASC').all();
    const staffAccounts = staffRaw.map(s => ({
      ...s,
      allowedModules: s.allowed_modules ? JSON.parse(s.allowed_modules) : []
    }));

    const customModsRaw = db.prepare('SELECT * FROM custom_modules ORDER BY created_at ASC').all();
    const customModules = customModsRaw.map(m => ({
      ...m,
      fields: m.fields ? JSON.parse(m.fields) : [],
      records: m.records ? JSON.parse(m.records) : []
    }));

    const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();

    res.json({
      ok: true,
      data: {
        config,
        inventory,
        invoices,
        transactions,
        operatives,
        tasks,
        projects,
        notes,
        reminders,
        staffAccounts,
        customModules,
        auditLogs
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================================================================
// 3. TRANSACTIONAL FULL ERP SYNC & SEED
// ==============================================================================
app.post('/api/sync', (req, res) => {
  try {
    const { config, inventory, invoices, transactions, operatives, tasks, projects, notes, reminders, staffAccounts, customModules, auditLogs } = req.body;
    
    const syncTransaction = db.transaction(() => {
      // 1. Company config
      if (config) {
        db.prepare(`
          INSERT OR REPLACE INTO company_config (
            id, name, subtitle, leader, leader_title, admin_username, admin_password_hash,
            currency, tax_rate, logo_url, banner_url, login_bg_url, login_avatar_url,
            theme, sound_enabled, current_role, splash_mode, splash_video_url, google_account_email,
            module_themes, menu_configuration, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          'default',
          config.name || 'VERTEX WORK STADIUM ERP',
          config.subtitle || '',
          config.leader || 'Alexander Vance',
          config.leaderTitle || 'Chief Executive Director',
          config.adminUsername || 'Alexander Vance',
          config.adminPasswordHash || '',
          config.currency || '$',
          Number(config.taxRate) || 8.5,
          config.logoUrl || '/stadium_logo.svg',
          config.bannerUrl || '',
          config.loginBgUrl || '',
          config.loginAvatarUrl || '/stadium_logo.svg',
          config.theme || 'stadium-cobalt',
          config.soundEnabled ? 1 : 0,
          config.currentRole || 'Alexander Vance (Chief Executive Director)',
          config.splashMode || 'cyber',
          config.splashVideoUrl || '',
          config.googleAccountEmail || 'alexander.vance@vertex-stadium.com',
          JSON.stringify(config.moduleThemes || {}),
          JSON.stringify(config.menuConfiguration || [])
        );
      }

      // 2. Inventory
      if (Array.isArray(inventory)) {
        const invStmt = db.prepare(`
          INSERT OR REPLACE INTO inventory (
            id, name, sku, category, stock, min_stock, unit_price, sale_price, supplier, location, status, last_restocked, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of inventory) {
          invStmt.run(
            item.id, item.name, item.sku || '', item.category || 'General', Number(item.stock) || 0,
            Number(item.minStock || item.reorderLevel) || 5, Number(item.unitPrice || item.costPrice) || 0,
            Number(item.salePrice || item.sellingPrice) || 0, item.supplier || '', item.location || '',
            item.status || 'In Stock', item.lastRestocked || '', item.notes || ''
          );
        }
      }

      // 3. Invoices
      if (Array.isArray(invoices)) {
        const invStmt = db.prepare(`
          INSERT OR REPLACE INTO invoices (
            id, client_name, client_email, date, due_date, status, items, subtotal, tax, total, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const inv of invoices) {
          invStmt.run(
            inv.id, inv.clientName || inv.client_name || 'Client', inv.clientEmail || inv.client_email || '',
            inv.date || '', inv.dueDate || inv.due_date || '', inv.status || 'Pending',
            JSON.stringify(inv.items || []), Number(inv.subtotal) || 0, Number(inv.tax) || 0,
            Number(inv.total) || 0, inv.notes || ''
          );
        }
      }

      // 4. Transactions
      if (Array.isArray(transactions)) {
        const trxStmt = db.prepare(`
          INSERT OR REPLACE INTO transactions (id, date, type, category, amount, reference, account, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of transactions) {
          trxStmt.run(t.id, t.date || '', t.type, t.category, Number(t.amount) || 0, t.reference || '', t.account || '', t.description || '');
        }
      }

      // 5. Operatives
      if (Array.isArray(operatives)) {
        const opStmt = db.prepare(`
          INSERT OR REPLACE INTO operatives (id, name, rank, role, department, email, phone, salary, status, avatar_url, hire_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const op of operatives) {
          opStmt.run(op.id, op.name, op.rank || '', op.role || '', op.department || '', op.email || '', op.phone || '', Number(op.salary) || 0, op.status || 'Active', op.avatarUrl || '', op.hireDate || '');
        }
      }

      // 6. Tasks
      if (Array.isArray(tasks)) {
        const taskStmt = db.prepare(`
          INSERT OR REPLACE INTO tasks (id, title, description, module, priority, stage, blocked_reason, assignee, assignee_avatar, due_date, progress)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const t of tasks) {
          taskStmt.run(t.id, t.title, t.description || '', t.module || 'General', t.priority || 'High', t.stage || 'todo', t.blockedReason || null, t.assignee || '', t.assigneeAvatar || '', t.dueDate || '', Number(t.progress) || 0);
        }
      }

      // 7. Projects
      if (Array.isArray(projects)) {
        const projStmt = db.prepare(`
          INSERT OR REPLACE INTO projects (id, name, client, budget, spent, start_date, deadline, status, progress, lead, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of projects) {
          projStmt.run(p.id, p.name, p.client || '', Number(p.budget) || 0, Number(p.spent) || 0, p.startDate || '', p.deadline || '', p.status || 'In Progress', Number(p.progress) || 0, p.lead || '', p.description || '');
        }
      }

      // 8. Notes
      if (Array.isArray(notes)) {
        const noteStmt = db.prepare(`
          INSERT OR REPLACE INTO notes (id, title, content_html, is_team, author_id, author_name, category, tags, is_pinned, color_tag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const n of notes) {
          noteStmt.run(n.id, n.title, n.contentHtml || n.content_html || '', n.isTeam ? 1 : 0, n.authorId || n.author_id || 'system', n.authorName || n.author_name || 'Admin', n.category || 'General', JSON.stringify(n.tags || []), n.isPinned ? 1 : 0, n.colorTag || '#2563eb');
        }
      }

      // 9. Reminders
      if (Array.isArray(reminders)) {
        const remStmt = db.prepare(`
          INSERT OR REPLACE INTO reminders (id, note_id, title, timestamp, recurring_interval, priority, status, assigned_user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of reminders) {
          remStmt.run(r.id, r.noteId || null, r.title, r.timestamp, r.recurringInterval || 'none', r.priority || 'High', r.status || 'pending', r.assignedUserId || null);
        }
      }

      // 10. Staff Accounts
      if (Array.isArray(staffAccounts)) {
        const staffStmt = db.prepare(`
          INSERT OR REPLACE INTO staff_accounts (id, name, username, email, password_hash, role, department, status, allowed_modules, assigned_tasks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const s of staffAccounts) {
          staffStmt.run(s.id, s.name, s.username, s.email, s.passwordHash || '', s.role, s.department || '', s.status || 'Active', JSON.stringify(s.allowedModules || []), s.assignedTasks || '');
        }
      }

      // 11. Custom Modules
      if (Array.isArray(customModules)) {
        const modStmt = db.prepare(`
          INSERT OR REPLACE INTO custom_modules (id, name, slug, icon, category, description, fields, records)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const m of customModules) {
          modStmt.run(m.id, m.name, m.slug || m.name.toLowerCase().replace(/\s+/g, '-'), m.icon || 'Layers', m.category || 'Custom', m.description || '', JSON.stringify(m.fields || []), JSON.stringify(m.records || []));
        }
      }

      // 12. Audit Logs
      if (Array.isArray(auditLogs)) {
        const logStmt = db.prepare(`
          INSERT OR REPLACE INTO audit_logs (id, timestamp, user, role, action, details)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const l of auditLogs.slice(0, 100)) {
          logStmt.run(l.id, l.timestamp, l.user, l.role || '', l.action, l.details || '');
        }
      }
    });

    syncTransaction();
    res.json({ ok: true, message: 'All ERP state synchronized to relational SQLite database.', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Sync Error]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Seed data from client state if database is unpopulated
app.post('/api/seed', (req, res) => {
  try {
    const { config, inventory, invoices, transactions, operatives, tasks, projects, notes, reminders, staffAccounts, customModules, auditLogs } = req.body;

    const count = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    if (count > 0) {
      return res.json({ ok: true, message: 'Database already seeded.' });
    }

    console.log('[SQL Database] Seeding initial data from payload...');

    // Trigger sync logic
    const syncRes = app._router.handle({
      method: 'POST',
      url: '/api/sync',
      body: req.body,
      headers: req.headers
    }, res);

  } catch (err) {
    console.error('[Seed Error]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================================================================
// 4. OBJECT STORAGE & IMAGE UPLOAD (Cloudinary / S3 / Local Disk)
// ==============================================================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await processAndSaveMedia(req.file, {
      entityType: req.body.entityType || 'general',
      entityId: req.body.entityId || null,
      uploadedBy: req.body.uploadedBy || 'Alexander Vance',
      baseUrl
    });

    res.json({
      ok: true,
      message: 'File successfully stored and indexed in SQL database.',
      file: result
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// List stored media files from SQL database
app.get('/api/media', (req, res) => {
  try {
    const { entityType } = req.query;
    let query = 'SELECT * FROM media_files';
    const params = [];
    if (entityType) {
      query += ' WHERE entity_type = ?';
      params.push(entityType);
    }
    query += ' ORDER BY created_at DESC';
    const files = db.prepare(query).all(...params);
    res.json({ ok: true, files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================================================================
// 5. INVENTORY RELATIONAL CRUD
// ==============================================================================
app.get('/api/inventory', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM inventory ORDER BY created_at DESC').all();
    res.json({ ok: true, data: items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    const item = req.body;
    const id = item.id || `INV-${Date.now().toString().slice(-4)}`;
    const stmt = db.prepare(`
      INSERT INTO inventory (id, name, sku, category, stock, min_stock, unit_price, sale_price, supplier, location, status, last_restocked, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, item.name, item.sku || '', item.category || 'General', Number(item.stock) || 0,
      Number(item.minStock) || 5, Number(item.unitPrice) || 0, Number(item.salePrice) || 0,
      item.supplier || '', item.location || '', item.status || 'In Stock',
      new Date().toISOString().slice(0, 10), item.notes || ''
    );
    res.json({ ok: true, data: { ...item, id } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    const stmt = db.prepare(`
      UPDATE inventory SET
        name = coalesce(?, name),
        stock = coalesce(?, stock),
        unit_price = coalesce(?, unit_price),
        sale_price = coalesce(?, sale_price),
        status = coalesce(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(item.name, item.stock, item.unitPrice, item.salePrice, item.status, id);
    res.json({ ok: true, message: 'Item updated successfully.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    res.json({ ok: true, message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================================================================
// 6. TRANSACTIONS & TREASURY CRUD
// ==============================================================================
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all();
    res.json({ ok: true, data: transactions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const t = req.body;
    const id = t.id || `TRX-${Date.now().toString().slice(-4)}`;
    const stmt = db.prepare(`
      INSERT INTO transactions (id, date, type, category, amount, reference, account, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, t.date || new Date().toISOString().slice(0, 10), t.type, t.category, Number(t.amount) || 0, t.reference || '', t.account || '', t.description || '');
    res.json({ ok: true, data: { ...t, id } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================================================================
// 7. INVOICES CRUD
// ==============================================================================
app.get('/api/invoices', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    const invoices = rows.map(r => ({ ...r, items: r.items ? JSON.parse(r.items) : [] }));
    res.json({ ok: true, data: invoices });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const inv = req.body;
    const id = inv.id || `INV-${Date.now().toString().slice(-4)}`;
    const stmt = db.prepare(`
      INSERT INTO invoices (id, client_name, client_email, date, due_date, status, items, subtotal, tax, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, inv.clientName || 'Client', inv.clientEmail || '', inv.date || '', inv.dueDate || '',
      inv.status || 'Pending', JSON.stringify(inv.items || []), Number(inv.subtotal) || 0,
      Number(inv.tax) || 0, Number(inv.total) || 0, inv.notes || ''
    );
    res.json({ ok: true, data: { ...inv, id } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ==============================================================================
// 8. TASKS & PROJECTS CRUD
// ==============================================================================
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    res.json({ ok: true, data: tasks });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const t = req.body;
    const id = t.id || `TSK-${Date.now().toString().slice(-4)}`;
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, module, priority, stage, blocked_reason, assignee, assignee_avatar, due_date, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, t.title, t.description || '', t.module || 'General', t.priority || 'High', t.stage || 'todo', t.blockedReason || null, t.assignee || '', t.assigneeAvatar || '', t.dueDate || '', Number(t.progress) || 0);
    res.json({ ok: true, data: { ...t, id } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  VERTEX WORK STADIUM ERP // SQL BACKEND ENGINE ACTIVE`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  Health API: http://localhost:${PORT}/api/health`);
  console.log(`  Object Storage: ${uploadsPath}`);
  console.log(`=================================================================`);
});

export default app;
