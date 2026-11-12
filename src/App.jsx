import React, { useState, useEffect } from 'react';
import CustomizableSplashLoader from './components/CustomizableSplashLoader';
import OnePieceLoadingScreen from './components/OnePieceLoadingScreen';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import InvoicingView from './components/InvoicingView';
import FinanceView from './components/FinanceView';
import OperativesView from './components/OperativesView';
import ProjectsView from './components/ProjectsView';
import GoogleDriveView from './components/GoogleDriveView';
import NotesRemindersView from './components/NotesRemindersView';
import CustomModuleBuilderView from './components/CustomModuleBuilderView';
import CustomModuleDataView from './components/CustomModuleDataView';
import RolesAndAuditView from './components/RolesAndAuditView';
import SettingsBackupView from './components/SettingsBackupView';
import MobileBottomTabBar from './components/MobileBottomTabBar';

import {
  INITIAL_COMPANY_CONFIG,
  INITIAL_INVENTORY,
  INITIAL_INVOICES,
  INITIAL_TRANSACTIONS,
  INITIAL_OPERATIVES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_NOTES,
  INITIAL_REMINDERS,
  INITIAL_CUSTOM_MODULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_STAFF_ACCOUNTS,
  ROLE_PERMISSIONS
} from './data/initialData';

import { playChime, playSuccess, playKamuiWarp } from './utils/audio';
import { checkModulePermission } from './utils/routeGuards';
import { validateErpBackup } from './utils/security';
import { checkServerHealth, fetchBootstrapState, seedServerDatabase, syncErpStateToServer } from './utils/apiClient';
import { BellRing, AlertTriangle, CheckCircle, ShieldAlert, X, Clock, Users, Crown, LogOut } from 'lucide-react';

const STORAGE_KEYS = {
  CONFIG: 'kamui_erp_config_v1',
  INVENTORY: 'kamui_erp_inventory_v1',
  INVOICES: 'kamui_erp_invoices_v1',
  TRANSACTIONS: 'kamui_erp_transactions_v1',
  OPERATIVES: 'kamui_erp_operatives_v1',
  PROJECTS: 'kamui_erp_projects_v1',
  TASKS: 'kamui_erp_tasks_v1',
  NOTES: 'kamui_erp_notes_v1',
  REMINDERS: 'kamui_erp_reminders_v1',
  RBAC: 'kamui_erp_rbac_matrix_v1',
  GDRIVE: 'kamui_erp_gdrive_auth_v1',
  MODULES: 'kamui_erp_custom_modules_v1',
  AUDIT: 'kamui_erp_audit_logs_v1',
  STAFF: 'kamui_erp_staff_accounts_v1',
};

function loadStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
}

export default function App() {
  // Primary States with LocalStorage Hydration
  const [companyConfig, setCompanyConfig] = useState(() => 
    loadStorage(STORAGE_KEYS.CONFIG, INITIAL_COMPANY_CONFIG)
  );
  const [inventory, setInventory] = useState(() => 
    loadStorage(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY)
  );
  const [invoices, setInvoices] = useState(() => 
    loadStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES)
  );
  const [transactions, setTransactions] = useState(() => 
    loadStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS)
  );
  const [operatives, setOperatives] = useState(() => 
    loadStorage(STORAGE_KEYS.OPERATIVES, INITIAL_OPERATIVES)
  );
  const [projects, setProjects] = useState(() => 
    loadStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS)
  );
  const [tasks, setTasks] = useState(() => 
    loadStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS)
  );
  const [notes, setNotes] = useState(() => 
    loadStorage(STORAGE_KEYS.NOTES, INITIAL_NOTES)
  );
  const [reminders, setReminders] = useState(() => 
    loadStorage(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS)
  );
  const [rolePermissions, setRolePermissions] = useState(() => 
    loadStorage(STORAGE_KEYS.RBAC, ROLE_PERMISSIONS)
  );
  const [driveAuth, setDriveAuth] = useState(() => 
    loadStorage(STORAGE_KEYS.GDRIVE, { 
      isAuthenticated: false, 
      email: companyConfig.googleAccountEmail || 'obito.d.mastermind@gmail.com', 
      token: '' 
    })
  );
  const [customModules, setCustomModules] = useState(() => 
    loadStorage(STORAGE_KEYS.MODULES, INITIAL_CUSTOM_MODULES)
  );
  const [auditLogs, setAuditLogs] = useState(() => 
    loadStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS)
  );
  const [staffAccounts, setStaffAccounts] = useState(() => 
    loadStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF_ACCOUNTS)
  );

  // Authentication & Flow State ('loading' | 'login' | 'authenticated')
  const [authStage, setAuthStage] = useState('loading');
  const [isStaff, setIsStaff] = useState(false);
  const [currentStaffAccount, setCurrentStaffAccount] = useState(null);
  const [isSimulatedSession, setIsSimulatedSession] = useState(false);

  // Navigation, Search & Alerts State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Menu open/close state
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    try {
      return localStorage.getItem('kamui_erp_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Save pinned preference
  useEffect(() => {
    try {
      localStorage.setItem('kamui_erp_sidebar_pinned', isSidebarPinned ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isSidebarPinned]);

  const handleToggleSidebar = () => {
    playChime();
    if (isSidebarPinned) {
      setIsSidebarPinned(false);
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  };

  const handleTogglePin = () => {
    playChime();
    setIsSidebarPinned(prev => {
      const next = !prev;
      if (next) {
        setIsSidebarOpen(true);
      }
      return next;
    });
  };

  const handleCloseSidebar = () => {
    playChime();
    setIsSidebarOpen(false);
    setIsSidebarPinned(false);
  };

  // Keyboard shortcut: Escape cleanly closes the menu bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen || isSidebarPinned) {
          setIsSidebarOpen(false);
          setIsSidebarPinned(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, isSidebarPinned]);

  // Synchronize state changes to LocalStorage
  useEffect(() => {
    // Security Sanitization: Never persist plaintext adminPassword into localStorage
    const { adminPassword, ...safeConfig } = companyConfig;
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(safeConfig));
    document.documentElement.setAttribute('data-theme', companyConfig.theme || 'kamui-dark');
  }, [companyConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPERATIVES, JSON.stringify(operatives));
  }, [operatives]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RBAC, JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GDRIVE, JSON.stringify(driveAuth));
  }, [driveAuth]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(customModules));
  }, [customModules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    // Security Sanitization: Never persist plaintext password into localStorage
    const safeStaff = staffAccounts.map(({ password, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(safeStaff));
  }, [staffAccounts]);

  // Relational SQL Database: Bootstrapping & Hydration on Initial Load
  // SERVER IS THE SINGLE SOURCE OF TRUTH — always load from SQL DB first
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromRelationalDatabase() {
      try {
        const health = await checkServerHealth();
        if (!isMounted || !health.online) return;

        // If backend database has no inventory items, seed it from initial data
        if (health.stats && health.stats.inventoryRecords === 0) {
          console.log('[SQL Client] Seeding empty relational database...');
          await seedServerDatabase({
            config: companyConfig,
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
          });
          // After seeding, hydrate from the server so all visitors start from the same state
          const bootstrap = await fetchBootstrapState();
          if (bootstrap.ok && bootstrap.data && isMounted) {
            const d = bootstrap.data;
            if (d.config) setCompanyConfig(prev => ({ ...prev, ...d.config }));
            if (Array.isArray(d.inventory)) setInventory(d.inventory);
            if (Array.isArray(d.invoices)) setInvoices(d.invoices);
            if (Array.isArray(d.transactions)) setTransactions(d.transactions);
            if (Array.isArray(d.operatives)) setOperatives(d.operatives);
            if (Array.isArray(d.tasks)) setTasks(d.tasks);
            if (Array.isArray(d.projects)) setProjects(d.projects);
            if (Array.isArray(d.notes)) setNotes(d.notes);
            if (Array.isArray(d.reminders)) setReminders(d.reminders);
            if (Array.isArray(d.staffAccounts)) setStaffAccounts(d.staffAccounts);
            if (Array.isArray(d.customModules)) setCustomModules(d.customModules);
          }
        } else {
          // ALWAYS hydrate from SQL server — overrides any local browser state
          const bootstrap = await fetchBootstrapState();
          if (bootstrap.ok && bootstrap.data && isMounted) {
            const d = bootstrap.data;
            if (d.config) setCompanyConfig(prev => ({ ...prev, ...d.config }));
            if (Array.isArray(d.inventory)) setInventory(d.inventory);
            if (Array.isArray(d.invoices)) setInvoices(d.invoices);
            if (Array.isArray(d.transactions)) setTransactions(d.transactions);
            if (Array.isArray(d.operatives)) setOperatives(d.operatives);
            if (Array.isArray(d.tasks)) setTasks(d.tasks);
            if (Array.isArray(d.projects)) setProjects(d.projects);
            if (Array.isArray(d.notes)) setNotes(d.notes);
            if (Array.isArray(d.reminders)) setReminders(d.reminders);
            if (Array.isArray(d.staffAccounts)) setStaffAccounts(d.staffAccounts);
            if (Array.isArray(d.customModules)) setCustomModules(d.customModules);
            console.log('[SQL Client] ✅ State loaded from shared SQL Database — all visitors see the same data.');
          }
        }
      } catch (err) {
        console.warn('[SQL Client] Offline fallback active:', err.message);
      }
    }

    hydrateFromRelationalDatabase();
    return () => { isMounted = false; };
  }, []);

  // Live Polling: Re-fetch from SQL server every 15 seconds so all visitors
  // automatically see changes made by other visitors without refreshing.
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const health = await checkServerHealth();
        if (!health.online) return;
        const bootstrap = await fetchBootstrapState();
        if (bootstrap.ok && bootstrap.data) {
          const d = bootstrap.data;
          if (d.config) setCompanyConfig(prev => ({ ...prev, ...d.config }));
          if (Array.isArray(d.inventory)) setInventory(d.inventory);
          if (Array.isArray(d.invoices)) setInvoices(d.invoices);
          if (Array.isArray(d.transactions)) setTransactions(d.transactions);
          if (Array.isArray(d.operatives)) setOperatives(d.operatives);
          if (Array.isArray(d.tasks)) setTasks(d.tasks);
          if (Array.isArray(d.projects)) setProjects(d.projects);
          if (Array.isArray(d.notes)) setNotes(d.notes);
          if (Array.isArray(d.reminders)) setReminders(d.reminders);
          if (Array.isArray(d.staffAccounts)) setStaffAccounts(d.staffAccounts);
          if (Array.isArray(d.customModules)) setCustomModules(d.customModules);
        }
      } catch {
        // Silently ignore poll errors
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Relational SQL Database: Debounced Auto-Sync on state mutations
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await syncErpStateToServer({
          config: companyConfig,
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
        });
      } catch (err) {
        // Silently preserve offline resilience
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [companyConfig, inventory, invoices, transactions, operatives, tasks, projects, notes, reminders, staffAccounts, customModules]);

  // 2.3 Reminder Chrono Watcher: checks every 20 seconds for reminder timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      reminders.forEach(rem => {
        if (rem.status === 'pending') {
          const remDate = new Date(rem.timestamp);
          if (now >= remDate) {
            // Trigger push alert
            handleTriggerReminderAlert({
              id: rem.id,
              title: rem.title,
              priority: rem.priority,
              time: rem.timestamp.replace('T', ' ')
            });
            // Mark reminder status as triggered
            setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, status: 'triggered' } : r));
          }
        }
      });
    }, 20000);

    return () => clearInterval(timer);
  }, [reminders]);

  // System Audit Logger helper
  const addAuditLog = ({ user, action, details }) => {
    const newEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: user || companyConfig.leader,
      role: companyConfig.currentRole,
      action: action || 'GENERAL_UPDATE',
      details
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 199)]);
  };

  // Push notification alert trigger
  const handleTriggerReminderAlert = (alertData) => {
    playChime();
    setActiveAlerts(prev => {
      // Prevent duplicate banner alerts for same id
      if (prev.some(a => a.id === alertData.id)) return prev;
      return [alertData, ...prev];
    });
  };

  const handleDismissAlert = (alertId) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleAcknowledgeAlert = (alertId) => {
    playSuccess();
    handleDismissAlert(alertId);
    setReminders(prev => prev.map(r => r.id === alertId ? { ...r, status: 'acknowledged' } : r));
    addAuditLog({
      user: companyConfig.leader,
      action: 'REMINDER_ACKNOWLEDGED',
      details: `Acknowledged push reminder: ${alertId}`
    });
  };

  const handleSnoozeAlert = (alertId, minutes = 5) => {
    playChime();
    handleDismissAlert(alertId);
    const snoozedTime = new Date(Date.now() + minutes * 60000).toISOString().replace('T', ' ').slice(0, 16);
    setReminders(prev => prev.map(r => r.id === alertId ? { ...r, status: 'pending', timestamp: `${snoozedTime}:00` } : r));
  };

  // Quick Restock helper
  const handleQuickRestock = (itemId, addedQty = 20) => {
    playSuccess();
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStock = item.stock + addedQty;
        const newStatus = newStock > item.reorderLevel ? 'In Stock' : 'Low Stock';
        addAuditLog({
          user: companyConfig.leader,
          action: 'RAPID_RESTOCK',
          details: `Replenished +${addedQty} units for '${item.name}' (New stock: ${newStock})`
        });
        return { ...item, stock: newStock, status: newStatus };
      }
      return item;
    }));
  };

  // Record a transaction from invoice or manual action
  const handleRecordTransaction = (trx) => {
    const newTrx = {
      id: `TRX-${Date.now().toString().slice(-4)}`,
      ...trx
    };
    setTransactions(prev => [newTrx, ...prev]);
  };

  // Header Quick Action dispatch
  const handleQuickAction = (actionKey) => {
    if (actionKey === 'new-item') {
      setActiveTab('inventory');
    } else if (actionKey === 'new-invoice') {
      setActiveTab('invoicing');
    } else if (actionKey === 'new-task') {
      setActiveTab('projects');
    } else if (actionKey === 'new-note') {
      setActiveTab('notesReminders');
    } else if (actionKey === 'new-module') {
      setActiveTab('module-builder');
    }
  };

  // Export full ERP database
  const exportFullERP = () => {
    playKamuiWarp();
    const fullState = {
      exportTimestamp: new Date().toISOString(),
      system: 'Kamui ERP // Crimson Protocol',
      leader: companyConfig.leader,
      config: companyConfig,
      inventory,
      invoices,
      transactions,
      operatives,
      tasks,
      notes,
      reminders,
      rolePermissions,
      customModules,
      auditLogs,
      staffAccounts
    };

    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kamui_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addAuditLog({
      user: companyConfig.leader,
      action: 'SYSTEM_BACKUP_EXPORT',
      details: 'Exported full encrypted JSON snapshot of enterprise ERP database'
    });
  };

  // Import full ERP database with strict Zod schema validation
  const importFullERP = (importedData) => {
    const validation = validateErpBackup(importedData);
    if (!validation.ok) {
      alert(`SECURITY RESTORE ALERT: Invalid backup data structure.\n${validation.error}`);
      return;
    }
    const clean = validation.data;
    if (clean.config) setCompanyConfig(clean.config);
    if (clean.inventory) setInventory(clean.inventory);
    if (clean.invoices) setInvoices(clean.invoices);
    if (clean.transactions) setTransactions(clean.transactions);
    if (clean.operatives) setOperatives(clean.operatives);
    if (clean.tasks) setTasks(clean.tasks);
    if (clean.notes) setNotes(clean.notes);
    if (clean.reminders) setReminders(clean.reminders);
    if (clean.rolePermissions) setRolePermissions(clean.rolePermissions);
    if (clean.customModules) setCustomModules(clean.customModules);
    if (clean.staffAccounts) setStaffAccounts(clean.staffAccounts);

    addAuditLog({
      user: companyConfig.leader,
      action: 'SYSTEM_BACKUP_RESTORE',
      details: 'Successfully restored and verified ERP database from validated JSON snapshot'
    });
  };

  // Factory reset to default mastermind state
  const resetToDefaults = () => {
    playKamuiWarp();
    setCompanyConfig(INITIAL_COMPANY_CONFIG);
    setInventory(INITIAL_INVENTORY);
    setInvoices(INITIAL_INVOICES);
    setTransactions(INITIAL_TRANSACTIONS);
    setOperatives(INITIAL_OPERATIVES);
    setTasks(INITIAL_TASKS);
    setNotes(INITIAL_NOTES);
    setReminders(INITIAL_REMINDERS);
    setRolePermissions(ROLE_PERMISSIONS);
    setCustomModules(INITIAL_CUSTOM_MODULES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setStaffAccounts(INITIAL_STAFF_ACCOUNTS);
    localStorage.clear();
    setActiveTab('dashboard');
    alert('ERP has been re-synchronized to Professor D Obito factory specifications!');
  };

  // 2.4 Route Guard Check: Determines if active role has permission to view activeTab
  const hasAccessToTab = (tabKey) => {
    const isCustom = tabKey.startsWith('custom-') || tabKey === 'module-builder';
    const checkKey = isCustom ? 'customModules' : tabKey;

    if (isStaff) {
      // Check Super Admin configured Team Mode permissions
      if (companyConfig.teamModePermissions && companyConfig.teamModePermissions[checkKey]) {
        if (companyConfig.teamModePermissions[checkKey].canView === false) {
          return false;
        }
      }
      // Check menu configuration Super Admin flag
      const menuConfigItem = companyConfig.menuConfiguration?.find(m => m.key === checkKey);
      if (menuConfigItem?.isSuperAdminOnly) {
        return false;
      }
      // Check staff account allowedModules if present
      if (currentStaffAccount?.allowedModules && !currentStaffAccount.allowedModules.includes(checkKey)) {
        return false;
      }
    }

    return checkModulePermission({
      moduleKey: checkKey,
      action: 'view',
      rolePermissions,
      currentRole: companyConfig.currentRole,
      isStaff,
      currentStaffAccount
    });
  };

  // Determine active view
  const renderActiveView = () => {
    // 2.4 Strict DOM Route Guard: If role cannot view this module, render Access Denied Screen
    if (!hasAccessToTab(activeTab)) {
      return (
        <div className="page-container">
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: 600, 
              margin: '40px auto', 
              textAlign: 'center', 
              padding: '40px 24px',
              borderColor: 'rgba(239, 68, 68, 0.4)'
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ef4444' }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ color: '#ffffff', fontFamily: 'var(--font-display)', fontSize: '22px' }}>
              Access Clearance Restricted
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: 8, lineHeight: 1.6 }}>
              The module <strong>'{activeTab}'</strong> is not authorized for active role profile 
              <strong> '{companyConfig.currentRole}'</strong>. 
              Subordinate permissions are governed under the Super Admin granular RBAC matrix.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  if (!isStaff) {
                    setCompanyConfig(prev => ({
                      ...prev,
                      currentRole: 'Alexander Vance (Chief Executive Director)'
                    }));
                  }
                  setActiveTab('dashboard');
                }}
              >
                Return to Command Center
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <DashboardView 
          companyConfig={companyConfig}
          inventory={inventory}
          invoices={invoices}
          transactions={transactions}
          operatives={operatives}
          tasks={tasks}
          setTasks={setTasks}
          projects={projects}
          setActiveTab={setActiveTab}
          onQuickRestock={handleQuickRestock}
          onOpenQuickAction={handleQuickAction}
          addAuditLog={addAuditLog}
          isStaff={isStaff}
          currentStaffAccount={currentStaffAccount}
          rolePermissions={rolePermissions}
        />
      );
    }
    if (activeTab === 'inventory') {
      return (
        <InventoryView 
          inventory={inventory}
          setInventory={setInventory}
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          searchQuery={searchQuery}
        />
      );
    }
    if (activeTab === 'invoicing') {
      return (
        <InvoicingView 
          invoices={invoices}
          setInvoices={setInvoices}
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          searchQuery={searchQuery}
          onRecordTransaction={handleRecordTransaction}
        />
      );
    }
    if (activeTab === 'finance') {
      return (
        <FinanceView 
          transactions={transactions}
          setTransactions={setTransactions}
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          searchQuery={searchQuery}
        />
      );
    }
    if (activeTab === 'operatives') {
      return (
        <OperativesView 
          operatives={operatives}
          setOperatives={setOperatives}
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          searchQuery={searchQuery}
        />
      );
    }
    if (activeTab === 'projects') {
      return (
        <ProjectsView 
          tasks={tasks}
          setTasks={setTasks}
          companyConfig={companyConfig}
          operatives={operatives}
          addAuditLog={addAuditLog}
          searchQuery={searchQuery}
        />
      );
    }
    // 2.2 Google Drive Workspace View
    if (activeTab === 'googleDrive') {
      return (
        <GoogleDriveView 
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          driveAuth={driveAuth}
          setDriveAuth={setDriveAuth}
        />
      );
    }
    // 2.3 Notes and Reminders View
    if (activeTab === 'notesReminders') {
      return (
        <NotesRemindersView 
          notes={notes}
          setNotes={setNotes}
          reminders={reminders}
          setReminders={setReminders}
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          onTriggerAlert={handleTriggerReminderAlert}
        />
      );
    }
    if (activeTab === 'module-builder') {
      return (
        <CustomModuleBuilderView 
          customModules={customModules}
          setCustomModules={setCustomModules}
          companyConfig={companyConfig}
          addAuditLog={addAuditLog}
          setActiveTab={setActiveTab}
        />
      );
    }
    if (activeTab.startsWith('custom-')) {
      const targetModId = activeTab.replace('custom-', '');
      const currentModule = customModules.find(m => m.id === targetModId);
      if (currentModule) {
        return (
          <CustomModuleDataView 
            module={currentModule}
            setCustomModules={setCustomModules}
            companyConfig={companyConfig}
            addAuditLog={addAuditLog}
            searchQuery={searchQuery}
          />
        );
      }
    }
    if (activeTab === 'roles') {
      return (
        <RolesAndAuditView 
          companyConfig={companyConfig}
          setCompanyConfig={setCompanyConfig}
          rolePermissions={rolePermissions}
          setRolePermissions={setRolePermissions}
          staffAccounts={staffAccounts}
          setStaffAccounts={setStaffAccounts}
          auditLogs={auditLogs}
          searchQuery={searchQuery}
          addAuditLog={addAuditLog}
        />
      );
    }
    if (activeTab === 'settings') {
      return (
        <SettingsBackupView 
          companyConfig={companyConfig}
          setCompanyConfig={setCompanyConfig}
          staffAccounts={staffAccounts}
          setStaffAccounts={setStaffAccounts}
          isStaff={isStaff}
          onExportFullERP={exportFullERP}
          onImportFullERP={importFullERP}
          onResetToDefaults={resetToDefaults}
          addAuditLog={addAuditLog}
          onReplayLoading={handleReplayLoading}
          onSimulateTeamLogin={handleSimulateTeamLogin}
        />
      );
    }

    return null;
  };

  // Team simulation handler for Super Admin testing
  const handleSimulateTeamLogin = () => {
    const demoStaff = staffAccounts[0] || {
      id: "STAFF-001",
      name: "David Miller",
      username: "david.miller",
      role: "Director of Operations",
      department: "Operations & Facility Logistics",
      allowedModules: ["dashboard", "projects", "inventory", "notesReminders", "googleDrive"]
    };
    setIsSimulatedSession(true);
    setIsStaff(true);
    setCurrentStaffAccount(demoStaff);
    setActiveTab('dashboard');
    playSuccess();
    addAuditLog({
      user: companyConfig.leader,
      action: 'TEAM_SIMULATION_ACTIVE',
      details: `Super Admin switched to Team Mode preview as ${demoStaff.name}`
    });
  };

  const handleReturnToSuperAdmin = () => {
    // Security Guard: Only allow return if this was a simulation started by Super Admin
    if (!isSimulatedSession) {
      handleLogout();
      return;
    }
    setIsSimulatedSession(false);
    setIsStaff(false);
    setCurrentStaffAccount(null);
    setCompanyConfig(prev => ({
      ...prev,
      leader: INITIAL_COMPANY_CONFIG.leader,
      currentRole: INITIAL_COMPANY_CONFIG.currentRole
    }));
    playSuccess();
    addAuditLog({
      user: INITIAL_COMPANY_CONFIG.leader,
      action: 'RETURNED_TO_SUPER_ADMIN',
      details: 'Exited Team Mode simulation and restored Super Admin privileges'
    });
  };

  // Authentication & Session Handlers
  const handleLoginSuccess = ({ username, role, isStaff: staffFlag, account }) => {
    setIsSimulatedSession(false);
    setIsStaff(Boolean(staffFlag));
    setCurrentStaffAccount(account || null);
    setCompanyConfig(prev => ({
      ...prev,
      leader: username,
      currentRole: role
    }));
    addAuditLog({
      user: username,
      action: staffFlag ? 'STAFF_AUTHENTICATION' : 'OWNER_AUTHENTICATION',
      details: `${staffFlag ? 'Staff Member' : 'Business Owner Mastermind'} ${username} logged in successfully (${role})`
    });
    setAuthStage('authenticated');
  };

  const handleLogout = () => {
    playChime();
    addAuditLog({
      user: companyConfig.leader,
      action: 'PORTAL_LOGOUT',
      details: 'Locked session and returned to authentication portal'
    });
    setIsStaff(false);
    setCurrentStaffAccount(null);
    setAuthStage('login');
  };

  const handleReplayLoading = () => {
    playChime();
    setAuthStage('loading');
  };

  const pendingInvoicesCount = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').length;
  const activeTasksCount = tasks.filter(t => t.stage === 'in_progress').length;
  const pendingRemindersCount = reminders.filter(r => r.status === 'pending').length;

  // Step 1: Fully Editable Loading Page System
  if (authStage === 'loading') {
    return (
      <CustomizableSplashLoader 
        onLoadingComplete={() => setAuthStage('login')} 
        companyConfig={companyConfig}
      />
    );
  }

  // Step 2: Anime Mastermind & Staff Login Portal
  if (authStage === 'login') {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onReplayLoading={handleReplayLoading}
        companyConfig={companyConfig}
        staffAccounts={staffAccounts}
      />
    );
  }

  // Step 3: Authenticated ERP Command Suite
  return (
    <div className="app-container" id="kamui-erp-root">
      {/* 2.3 Floating Banner Alerts Ticker for Triggered Reminders */}
      {activeAlerts.length > 0 && (
        <div 
          id="active-reminders-banner-ticker"
          className="active-reminders-banner-ticker"
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            width: '90%',
            maxWidth: '820px',
            background: 'linear-gradient(90deg, #180509 0%, #200812 50%, #150409 100%)',
            border: '1px solid #ff2a5f',
            boxShadow: '0 0 24px rgba(255, 42, 95, 0.4), var(--glass-shadow)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            animation: 'slideDown 0.4s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 42, 95, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff2a5f', flexShrink: 0 }}>
              <BellRing size={18} className="pulse-slow" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="status-badge s_rank" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                  PUSH ALERT: {activeAlerts[0].priority}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {activeAlerts[0].time}
                </span>
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                {activeAlerts[0].title}
              </div>
            </div>
          </div>

          <div className="active-reminders-actions-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-primary"
              style={{ fontSize: '11px', padding: '5px 12px' }}
              onClick={() => handleAcknowledgeAlert(activeAlerts[0].id)}
            >
              <CheckCircle size={13} />
              <span>Acknowledge</span>
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => handleSnoozeAlert(activeAlerts[0].id, 5)}
              title="Snooze for 5 minutes"
            >
              <Clock size={13} />
              <span>Snooze</span>
            </button>
            <button
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => {
                handleDismissAlert(activeAlerts[0].id);
                setActiveTab('notesReminders');
              }}
            >
              <span>View</span>
            </button>
            <button
              onClick={() => handleDismissAlert(activeAlerts[0].id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Team Simulation Indicator Banner */}
      {isStaff && (
        <div 
          id="team-mode-active-indicator-banner"
          className="team-mode-active-indicator-banner"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 99999,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(109, 40, 217, 0.95) 100%)',
            border: '1px solid #c084fc',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5)',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#ffffff',
            backdropFilter: 'blur(10px)',
            animation: 'fadeInUp 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800 }}>Team Member View Active</div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.85)' }}>
                Viewing as {currentStaffAccount?.name || 'Staff Member'} ({currentStaffAccount?.role || 'Staff'})
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Log out and switch account"
          >
            <LogOut size={12} color="#ffffff" />
            <span>Switch Account</span>
          </button>
        </div>
      )}

      {/* Professional Work Stadium Menu Backdrop */}
      {isSidebarOpen && !isSidebarPinned && (
        <div 
          className="stadium-menu-backdrop" 
          onClick={handleCloseSidebar} 
          title="Click to Close Navigation Menu"
        />
      )}

      {/* Dynamic Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (!isSidebarPinned) {
            setIsSidebarOpen(false); // Close menu on navigation when in drawer mode
          }
        }}
        companyConfig={companyConfig}
        setCompanyConfig={setCompanyConfig}
        customModules={customModules}
        inventoryCount={inventory.length}
        pendingInvoicesCount={pendingInvoicesCount}
        activeTasksCount={activeTasksCount}
        remindersCount={pendingRemindersCount}
        onOpenNewModuleModal={() => { setActiveTab('moduleBuilder'); if (!isSidebarPinned) setIsSidebarOpen(false); }}
        onLogout={handleLogout}
        isStaff={isStaff}
        currentStaffAccount={currentStaffAccount}
        rolePermissions={rolePermissions}
        addAuditLog={addAuditLog}
        isSidebarOpen={isSidebarOpen}
        isSidebarPinned={isSidebarPinned}
        onTogglePin={handleTogglePin}
        onCloseSidebar={handleCloseSidebar}
      />

      {/* Main Work Stadium View Area */}
      <div className="app-main">
        {/* Top Header Bar */}
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          companyConfig={companyConfig}
          setCompanyConfig={setCompanyConfig}
          onOpenQuickAction={handleQuickAction}
          onLogout={handleLogout}
          onReplayLoading={handleReplayLoading}
          rolesList={Object.keys(rolePermissions)}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (!isSidebarPinned) setIsSidebarOpen(false);
          }}
          notifications={activeAlerts}
          onDismissNotification={handleDismissAlert}
          driveAuth={driveAuth}
          isStaff={isStaff}
          currentStaffAccount={currentStaffAccount}
          isSidebarOpen={isSidebarOpen || isSidebarPinned}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* View Content */}
        <main style={{ flex: 1 }}>
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Device Fixed Bottom Tab Bar: Stops elements from overlapping */}
      <MobileBottomTabBar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={() => setIsSidebarOpen(true)}
        inventoryCount={inventory.length}
        activeTasksCount={activeTasksCount}
        isStaff={isStaff}
        currentStaffAccount={currentStaffAccount}
      />
    </div>
  );
}
