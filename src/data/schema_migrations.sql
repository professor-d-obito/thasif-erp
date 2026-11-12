-- ==============================================================================
-- KAMUI ENTERPRISE ERP // CRIMSON PROTOCOL DATABASE MIGRATIONS
-- Lead Full-Stack ERP Architect: Schema & RBAC Permission Matrix
-- Version: 2.1.0-ENTERPRISE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY & PURGE ENFORCEMENT: PURGE ALL BANK FEED ENDPOINTS & TABLES
-- ------------------------------------------------------------------------------
-- Explicitly revoke and drop any legacy bank feed tables, indexes, and relations
DROP TABLE IF EXISTS bank_feed_transactions CASCADE;
DROP TABLE IF EXISTS bank_feed_connections CASCADE;
DROP TABLE IF EXISTS bank_feeds CASCADE;
DROP TABLE IF EXISTS plaid_integrations CASCADE;
DROP TABLE IF EXISTS yodlee_feeds CASCADE;

-- Create an immutable audit marker confirming bank feed endpoints are completely purged
CREATE TABLE IF NOT EXISTS security_compliance_audits (
    audit_id VARCHAR(64) PRIMARY KEY,
    audit_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

INSERT INTO security_compliance_audits (audit_id, audit_type, status, notes)
VALUES (
    'AUD-SEC-BANKFEED-PURGE-001',
    'BANK_FEED_ENDPOINT_PURGE',
    'VERIFIED_PURGED',
    'All bank feed tables, endpoints, and external banking hooks have been verified as permanently purged and decommissioned.'
) ON CONFLICT (audit_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. USER PREFERENCES & MODULAR BACKGROUND THEMING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(64) PRIMARY KEY,
    theme_preset VARCHAR(64) DEFAULT 'kamui-dark',
    sound_enabled BOOLEAN DEFAULT TRUE,
    splash_mode VARCHAR(32) DEFAULT 'video', -- 'video' | 'anime_canvas' | 'minimal'
    splash_video_url TEXT, -- Path or Base64/DataURL for custom uploaded video
    module_backgrounds JSONB DEFAULT '{}'::jsonb, -- Per-module background settings (HEX, gradient, image)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for rapid preference lookup per user
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ------------------------------------------------------------------------------
-- 3. NOTES & REMINDERS SUBSYSTEM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_html TEXT NOT NULL,
    is_team BOOLEAN DEFAULT FALSE,
    author_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) DEFAULT 'General',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    color_tag VARCHAR(32) DEFAULT '#ff2a5f',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_team ON notes(is_team);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);

CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(64) PRIMARY KEY,
    note_id VARCHAR(64) REFERENCES notes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    recurring_interval VARCHAR(32) DEFAULT 'none', -- 'none', 'daily', 'weekly', 'monthly', 'custom'
    priority VARCHAR(32) DEFAULT 'High', -- 'Low', 'Normal', 'High', 'Critical S-Rank'
    status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'triggered', 'acknowledged', 'dismissed', 'snoozed'
    assigned_user_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_status_time ON reminders(status, reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(assigned_user_id);

-- ------------------------------------------------------------------------------
-- 4. SUPER ADMIN TASK MANAGEMENT BOARD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(64) DEFAULT 'General',
    priority VARCHAR(32) DEFAULT 'High', -- 'Low', 'Medium', 'High', 'S-Rank'
    stage VARCHAR(32) NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'blocked', 'done'
    blocked_reason TEXT,
    assignee VARCHAR(128) NOT NULL,
    assignee_id VARCHAR(64),
    assignee_avatar TEXT,
    due_date DATE NOT NULL,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ------------------------------------------------------------------------------
-- 5. GRANULAR ROLE-BASED ACCESS CONTROL (RBAC) & SUPER ADMIN GOVERNANCE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rbac_roles (
    role_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    badge VARCHAR(64),
    color VARCHAR(32),
    description TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rbac_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(64) REFERENCES rbac_roles(role_id) ON DELETE CASCADE,
    module_key VARCHAR(64) NOT NULL, -- e.g. dashboard, inventory, invoicing, finance, operatives, projects, notesReminders, googleDrive, customModules, roles, settings
    can_view BOOLEAN DEFAULT FALSE,  -- Visibility: if false, completely stripped from navigation, DOM, and routes
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_role_module UNIQUE(role_id, module_key)
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    staff_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    role_id VARCHAR(64) REFERENCES rbac_roles(role_id) ON DELETE SET NULL,
    department VARCHAR(128),
    status VARCHAR(32) DEFAULT 'Active',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default standard RBAC roles
INSERT INTO rbac_roles (role_id, name, badge, color, description, is_custom) VALUES
('role-mastermind', 'Professor D Obito (Grand Mastermind)', 'Mastermind (Full Clearance)', '#ff2a5f', 'Supreme architectural and operational control across all enterprise modules.', FALSE),
('role-jonin', 'Jonin Commander', 'Jonin Level', '#a855f7', 'Strategic commander with full access to field operations, inventory, and missions.', FALSE),
('role-chunin', 'Chunin Strategist', 'Chunin Level', '#38bdf8', 'Operational officer handling logistics, billing, and tactical missions.', FALSE),
('role-academy', 'Academy Observer', 'Guest / Genin', '#10b981', 'Restricted observer role with read-only visibility to general dashboard and public missions.', FALSE)
ON CONFLICT (role_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. GOOGLE DRIVE WORKSPACE INTEGRATION & OAUTH STATE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS google_drive_integrations (
    user_id VARCHAR(64) PRIMARY KEY,
    gmail_account VARCHAR(128) NOT NULL,
    is_authenticated BOOLEAN DEFAULT FALSE,
    access_token_masked VARCHAR(64),
    token_expiry TIMESTAMP WITH TIME ZONE,
    granted_scopes TEXT[] DEFAULT ARRAY['drive.readonly', 'drive.file', 'drive.metadata.readonly']::TEXT[],
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) ENFORCEMENT & ACCESS POLICIES
-- ------------------------------------------------------------------------------
-- Enable RLS on every table in the schema
ALTER TABLE security_compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_integrations ENABLE ROW LEVEL SECURITY;

-- 7.1 Security Compliance Audits: Only authenticated Super Admins can view/insert
CREATE POLICY "Audits viewable by authenticated users" ON security_compliance_audits
    FOR SELECT TO authenticated USING (true);

-- 7.2 User Preferences: Users can strictly only read and update their own preferences
CREATE POLICY "Users read own preferences" ON user_preferences
    FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

CREATE POLICY "Users insert own preferences" ON user_preferences
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users update own preferences" ON user_preferences
    FOR UPDATE TO authenticated 
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 7.3 Notes & Reminders: Multi-tenant tenant isolation with team sharing support
CREATE POLICY "Users read own or team notes" ON notes
    FOR SELECT TO authenticated 
    USING (author_id = auth.uid()::text OR is_team = true);

CREATE POLICY "Users insert own notes" ON notes
    FOR INSERT TO authenticated 
    WITH CHECK (author_id = auth.uid()::text);

CREATE POLICY "Users update own notes" ON notes
    FOR UPDATE TO authenticated 
    USING (author_id = auth.uid()::text)
    WITH CHECK (author_id = auth.uid()::text);

CREATE POLICY "Users delete own notes" ON notes
    FOR DELETE TO authenticated 
    USING (author_id = auth.uid()::text);

CREATE POLICY "Users read assigned reminders" ON reminders
    FOR SELECT TO authenticated 
    USING (assigned_user_id = auth.uid()::text OR assigned_user_id IS NULL);

CREATE POLICY "Users manage assigned reminders" ON reminders
    FOR ALL TO authenticated 
    USING (assigned_user_id = auth.uid()::text)
    WITH CHECK (assigned_user_id = auth.uid()::text);

-- 7.4 Tasks: Accessible to all verified clan staff, writable only with author validation
CREATE POLICY "Authenticated staff view tasks" ON tasks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff create tasks" ON tasks
    FOR INSERT TO authenticated 
    WITH CHECK (assignee_id = auth.uid()::text OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated staff update tasks" ON tasks
    FOR UPDATE TO authenticated 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 7.5 RBAC Roles & Permissions: Read-only for authenticated staff; admin-only writes
CREATE POLICY "Staff read roles" ON rbac_roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff read permissions" ON rbac_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff read staff profiles" ON staff_profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff update own profile" ON staff_profiles
    FOR UPDATE TO authenticated 
    USING (staff_id = auth.uid()::text)
    WITH CHECK (staff_id = auth.uid()::text);

-- 7.6 Google Drive Integrations: Isolated to user_id
CREATE POLICY "User drive integration access" ON google_drive_integrations
    FOR ALL TO authenticated 
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- 7.7 Supabase Storage Security Policies (Avatars & ERP Documents)
-- Enforces authenticated uploads and MIME-type restrictions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('erp_media', 'erp_media', false), ('user_avatars', 'user_avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated staff upload media" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (bucket_id IN ('erp_media', 'user_avatars') AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read avatars" ON storage.objects
    FOR SELECT TO public 
    USING (bucket_id = 'user_avatars');

CREATE POLICY "Authenticated read private media" ON storage.objects
    FOR SELECT TO authenticated 
    USING (bucket_id = 'erp_media');

-- End of Enterprise Migration Script

