import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Wallet, 
  Users, 
  CheckSquare, 
  Layers, 
  ShieldCheck, 
  Settings, 
  Sparkles,
  Plus,
  Box,
  Compass,
  FileText,
  LogOut,
  HardDrive,
  BellRing,
  Sliders,
  Crown,
  X,
  Pin,
  PinOff
} from 'lucide-react';
import { playChime } from '../utils/audio';
import { checkModulePermission } from '../utils/routeGuards';
import MenuCustomizerModal from './MenuCustomizerModal';

const ICON_MAP = {
  LayoutDashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  CheckSquare: CheckSquare,
  projects: CheckSquare,
  Receipt: Receipt,
  invoicing: Receipt,
  Wallet: Wallet,
  finance: Wallet,
  Package: Package,
  inventory: Package,
  Users: Users,
  operatives: Users,
  BellRing: BellRing,
  notesReminders: BellRing,
  HardDrive: HardDrive,
  googleDrive: HardDrive,
  Layers: Layers,
  moduleBuilder: Layers,
  ShieldCheck: ShieldCheck,
  roles: ShieldCheck,
  Settings: Settings,
  settings: Settings,
  FileText: FileText,
  Box: Box,
  Compass: Compass
};

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  companyConfig = {}, 
  setCompanyConfig = () => {},
  customModules = [], 
  inventoryCount = 0,
  pendingInvoicesCount = 0,
  activeTasksCount = 0,
  remindersCount = 0,
  onOpenNewModuleModal = () => {},
  onLogout = () => {},
  isStaff = false,
  currentStaffAccount = null,
  rolePermissions = {},
  addAuditLog = () => {},
  isSidebarOpen = false,
  isSidebarPinned = false,
  onTogglePin = () => {},
  onCloseSidebar = () => {}
}) {
  const [isMenuCustomizerOpen, setIsMenuCustomizerOpen] = useState(false);

  // Check RBAC permission for a module
  const canAccess = (moduleKey, isSuperAdminOnly = false) => {
    // If feature is flagged Super Admin Only in menuConfiguration
    if (isSuperAdminOnly && isStaff) {
      return false;
    }

    // Check against Super Admin Team Mode permissions configuration
    if (isStaff && companyConfig.teamModePermissions) {
      const teamPerm = companyConfig.teamModePermissions[moduleKey];
      if (teamPerm && teamPerm.canView === false) {
        return false;
      }
    }

    return checkModulePermission({
      moduleKey,
      action: 'view',
      rolePermissions,
      currentRole: companyConfig.currentRole,
      isStaff,
      currentStaffAccount
    });
  };

  const handleNav = (tabId) => {
    playChime();
    setActiveTab(tabId);
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };

  // Get active menu items sorted by order
  const menuConfig = companyConfig.menuConfiguration && companyConfig.menuConfiguration.length > 0 
    ? [...companyConfig.menuConfiguration].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [
        { key: "dashboard", label: "Executive Dashboard", icon: "LayoutDashboard", category: "Core", enabled: true, isSuperAdminOnly: false, order: 1 },
        { key: "projects", label: "Strategic Initiatives", icon: "CheckSquare", category: "Core", enabled: true, isSuperAdminOnly: false, order: 2 },
        { key: "invoicing", label: "Commercial Billing", icon: "Receipt", category: "Core", enabled: true, isSuperAdminOnly: false, order: 3 },
        { key: "finance", label: "Treasury & Ledger", icon: "Wallet", category: "Core", enabled: true, isSuperAdminOnly: true, order: 4 },
        { key: "inventory", label: "Stadium Infrastructure", icon: "Package", category: "Core", enabled: true, isSuperAdminOnly: false, order: 5 },
        { key: "operatives", label: "Personnel Directory", icon: "Users", category: "Core", enabled: true, isSuperAdminOnly: false, order: 6 },
        { key: "notesReminders", label: "Operational Notes", icon: "BellRing", category: "Productivity", enabled: true, isSuperAdminOnly: false, order: 7 },
        { key: "googleDrive", label: "Corporate Drive", icon: "HardDrive", category: "Cloud Tools", enabled: true, isSuperAdminOnly: false, order: 8 },
        { key: "moduleBuilder", label: "Module Studio", icon: "Layers", category: "Extensibility", enabled: true, isSuperAdminOnly: true, order: 9 },
        { key: "roles", label: "Governance & RBAC", icon: "ShieldCheck", category: "Governance", enabled: true, isSuperAdminOnly: true, order: 10 },
        { key: "settings", label: "System Configuration", icon: "Settings", category: "Governance", enabled: true, isSuperAdminOnly: true, order: 11 },
      ];

  // Group menu items by category
  const categories = ['Core', 'Productivity', 'Cloud Tools', 'Extensibility', 'Governance', 'Custom Features'];

  const getBadgeForModule = (key) => {
    if (key === 'inventory' && inventoryCount > 0) return inventoryCount;
    if (key === 'invoicing' && pendingInvoicesCount > 0) return pendingInvoicesCount;
    if (key === 'projects' && activeTasksCount > 0) return activeTasksCount;
    if (key === 'notesReminders' && remindersCount > 0) return remindersCount;
    return null;
  };

  return (
    <aside 
      className={`app-sidebar stadium-sidebar-drawer ${isSidebarOpen || isSidebarPinned ? 'stadium-sidebar-open' : ''} ${isSidebarPinned ? 'stadium-sidebar-pinned' : ''}`} 
      id="sidebar-navigation"
      aria-label="Navigation Menu"
    >
      {/* Brand Header */}
      <div className="sidebar-header" style={{ position: 'relative' }}>
        <img 
          src={companyConfig.logoUrl || '/stadium_logo.svg'} 
          alt="Work Stadium Logo" 
          className="sidebar-brand-avatar"
          id="sidebar-brand-img"
          style={{ width: 38, height: 38, borderRadius: '8px', objectFit: 'contain' }}
        />
        <div className="sidebar-brand-info" style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13.5px', letterSpacing: '0.04em' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {companyConfig.name || 'WORK STADIUM ERP'}
            </span>
            <span className="brand-pulse-dot" title="Core Online"></span>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {companyConfig.leader || 'Alexander Vance'}
          </p>
        </div>

        {/* Header Controls: Pin and Close Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Optional Pin / Dock button (Desktop convenience) */}
          <button 
            id="sidebar-pin-btn"
            className="sidebar-control-btn"
            onClick={onTogglePin}
            title={isSidebarPinned ? "Unpin Menu (Switch to Drawer Mode)" : "Pin Menu (Persistent Docked Layout)"}
            aria-label={isSidebarPinned ? "Unpin Menu" : "Pin Menu"}
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '6px', 
              color: isSidebarPinned ? 'var(--accent-crimson)' : 'var(--text-secondary)',
              background: isSidebarPinned ? 'rgba(255, 42, 95, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isSidebarPinned ? '1px solid var(--accent-crimson)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
          >
            {isSidebarPinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>

          {/* Close Button for Operator Drawer Control */}
          <button 
            id="sidebar-close-btn"
            className="sidebar-close-btn"
            onClick={onCloseSidebar}
            title="Close Navigation Menu (Esc)"
            aria-label="Close Navigation Menu"
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '6px', 
              color: 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Role / Mode Badge */}
      <div style={{ padding: '0 16px 12px 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isStaff ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 42, 95, 0.12)',
          border: `1px solid ${isStaff ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 42, 95, 0.35)'}`,
          padding: '6px 10px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isStaff ? (
              <Users size={12} color="var(--accent-purple)" />
            ) : (
              <Crown size={12} color="var(--accent-crimson)" />
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: isStaff ? 'var(--accent-purple)' : 'var(--accent-crimson)',
              fontFamily: 'var(--font-mono)'
            }}>
              {isStaff ? 'TEAM MEMBER MODE' : 'SUPER ADMIN'}
            </span>
          </div>

          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {isStaff ? (currentStaffAccount?.role || 'Staff') : 'Full Access'}
          </span>
        </div>
      </div>

      {/* Adaptable Navigation List */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
        {categories.map(cat => {
          const itemsInCat = menuConfig.filter(m => {
            const matchesCat = m.category === cat || (cat === 'Core' && !m.category);
            return matchesCat && m.enabled !== false && canAccess(m.key, m.isSuperAdminOnly);
          });

          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div className="sidebar-section-title">
                {cat === 'Core' ? 'Core Operations' : cat}
              </div>

              {itemsInCat.map(item => {
                const IconComponent = ICON_MAP[item.icon] || ICON_MAP[item.key] || LayoutDashboard;
                const badge = getBadgeForModule(item.key);
                const isActive = activeTab === item.key;

                return (
                  <button 
                    key={item.key}
                    id={`nav-${item.key}-btn`}
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.key)}
                  >
                    <span className="nav-item-icon-container">
                      <IconComponent size={18} />
                    </span>
                    <span className="nav-item-label">{item.label}</span>
                    {badge !== null && (
                      <span className="nav-badge" style={{ fontSize: '10.5px' }}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Dynamic Custom Modules Section */}
        {customModules.length > 0 && canAccess('customModules') && (
          <div style={{ marginBottom: 14 }}>
            <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Custom Modules</span>
              <span style={{ fontSize: '9px', background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-purple)', padding: '1px 5px', borderRadius: 4 }}>
                {customModules.length}
              </span>
            </div>

            {customModules.map(mod => {
              const IconComp = ICON_MAP[mod.icon] || Box;
              const tabId = `custom-${mod.id}`;
              const isActive = activeTab === tabId;

              return (
                <button
                  key={mod.id}
                  id={`nav-custom-${mod.id}-btn`}
                  className={`nav-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleNav(tabId)}
                >
                  <span className="nav-item-icon-container">
                    <IconComp size={18} />
                  </span>
                  <span className="nav-item-label">{mod.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Super Admin Quick Menu Customizer Button */}
        {!isStaff && (
          <div style={{ padding: '8px 12px', marginTop: 4 }}>
            <button
              id="sidebar-customize-menu-trigger-btn"
              type="button"
              className="btn-secondary"
              onClick={() => { playChime(); setIsMenuCustomizerOpen(true); }}
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: 6,
                fontSize: '11px',
                padding: '7px 10px',
                background: 'rgba(255, 42, 95, 0.08)',
                borderColor: 'rgba(255, 42, 95, 0.25)',
                color: 'var(--accent-crimson-light)'
              }}
              title="Super Admin: Add/Remove Features & Customize Menu Order"
            >
              <Sliders size={13} />
              <span>Customize Navigation</span>
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button 
          id="sidebar-logout-btn"
          className="btn-secondary" 
          style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: '12px' }}
          onClick={() => {
            playChime();
            onLogout();
          }}
        >
          <LogOut size={15} />
          <span>Exit ERP Session</span>
        </button>
      </div>

      {/* Menu Customizer Modal for Super Admin */}
      <MenuCustomizerModal 
        isOpen={isMenuCustomizerOpen}
        onClose={() => setIsMenuCustomizerOpen(false)}
        companyConfig={companyConfig}
        setCompanyConfig={setCompanyConfig}
        onOpenModuleStudio={() => { setIsMenuCustomizerOpen(false); setActiveTab('moduleBuilder'); }}
        addAuditLog={addAuditLog}
      />
    </aside>
  );
}
