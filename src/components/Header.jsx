import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Volume2, 
  VolumeX, 
  Palette, 
  Plus, 
  Shield, 
  Sparkles,
  LogOut,
  RotateCcw,
  HardDrive,
  BellRing,
  ExternalLink,
  FileText,
  Package,
  Receipt,
  CheckSquare,
  X,
  Sliders,
  Check,
  Database,
  MoreVertical,
  User
} from 'lucide-react';
import { playChime, toggleSound, playSuccess } from '../utils/audio';
import { checkServerHealth } from '../utils/apiClient';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  companyConfig, 
  setCompanyConfig, 
  onOpenQuickAction,
  onLogout,
  onReplayLoading,
  rolesList = [],
  setActiveTab = () => {},
  notifications = [],
  onDismissNotification = () => {},
  driveAuth = {},
  isStaff = false,
  currentStaffAccount = null,
  isSidebarOpen = false,
  onToggleSidebar = () => {}
}) {
const STADIUM_THEMES = [
  { id: 'stadium-cobalt', name: 'Executive Cobalt & Obsidian', accent: '#2563eb', bg: '#07090e', desc: 'Enterprise Boardroom' },
  { id: 'stadium-emerald', name: 'Slate Arena & Precision Emerald', accent: '#10b981', bg: '#050e0a', desc: 'High-Performance Turf' },
  { id: 'stadium-amber', name: 'Graphite Monolith & Apex Gold', accent: '#f59e0b', bg: '#0d0d0f', desc: 'Luxury Institutional' },
  { id: 'stadium-crimson', name: 'Carbon Titanium & Athletic Crimson', accent: '#e11d48', bg: '#0a0809', desc: 'Athletic Command' },
  { id: 'stadium-indigo', name: 'Midnight Space & Cyber Indigo', accent: '#6366f1', bg: '#080814', desc: 'High-Tech Operations' },
  { id: 'stadium-cyan', name: 'Oceanic Deep & Polar Cyan', accent: '#06b6d4', bg: '#050d12', desc: 'Deep Telemetry Grid' },
  { id: 'stadium-daylight', name: 'Executive Daylight & Navy Platinum', accent: '#2563eb', bg: '#f8fafc', desc: 'Crisp Light Mode' }
];

const BASE_OPTIONS = [
  { id: 'obsidian', label: 'Obsidian', hex: '#07090e' },
  { id: 'carbon', label: 'Carbon', hex: '#0a0809' },
  { id: 'slate', label: 'Slate Arena', hex: '#050e0a' },
  { id: 'indigo', label: 'Midnight Space', hex: '#080814' },
  { id: 'daylight', label: 'Platinum Light', hex: '#f8fafc' },
];

const ACCENT_OPTIONS = [
  { id: '#2563eb', label: 'Cobalt', hex: '#2563eb' },
  { id: '#10b981', label: 'Emerald', hex: '#10b981' },
  { id: '#f59e0b', label: 'Apex Gold', hex: '#f59e0b' },
  { id: '#e11d48', label: 'Crimson', hex: '#e11d48' },
  { id: '#6366f1', label: 'Indigo', hex: '#6366f1' },
  { id: '#06b6d4', label: 'Polar Cyan', hex: '#06b6d4' },
];

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [themeTab, setThemeTab] = useState('presets'); // 'presets' | 'mixer'
  const [customBase, setCustomBase] = useState('obsidian');
  const [customAccent, setCustomAccent] = useState('#2563eb');

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);
  const [sqlServerStatus, setSqlServerStatus] = useState({ online: false, engine: 'Connecting...' });
  const mobileUserMenuRef = useRef(null);

  const searchContainerRef = useRef(null);

  // Poll SQL Backend Server Health
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const res = await checkServerHealth();
      if (isMounted) {
        setSqlServerStatus(res);
      }
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(e.target)) {
        setShowMobileUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSoundToggle = () => {
    const isNowOn = toggleSound();
    setCompanyConfig(prev => ({ ...prev, soundEnabled: isNowOn }));
  };

  const handleThemeSelect = (themeName) => {
    playChime();
    setCompanyConfig(prev => ({ ...prev, theme: themeName }));
    document.documentElement.setAttribute('data-theme', themeName);
    // Reset any inline overrides
    document.documentElement.style.cssText = '';
    setShowThemeMenu(false);
  };

  const handleApplyCustomMixer = () => {
    playSuccess();
    const root = document.documentElement;
    const isLight = customBase === 'daylight';
    const baseBg = isLight ? '#f8fafc' : customBase === 'carbon' ? '#0a0809' : customBase === 'slate' ? '#050e0a' : customBase === 'indigo' ? '#080814' : '#07090e';
    const secBg = isLight ? '#f1f5f9' : '#0c101a';
    const cardBg = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(14, 19, 32, 0.82)';

    root.style.setProperty('--bg-primary', baseBg);
    root.style.setProperty('--bg-secondary', secBg);
    root.style.setProperty('--bg-card', cardBg);
    root.style.setProperty('--accent-crimson', customAccent);
    root.style.setProperty('--accent-crimson-light', customAccent);
    root.style.setProperty('--accent-crimson-glow', `${customAccent}55`);
    root.style.setProperty('--border-accent', `${customAccent}77`);
    root.style.setProperty('--text-highlight', customAccent);

    setCompanyConfig(prev => ({
      ...prev,
      theme: 'custom-combination',
      customThemePalette: { base: customBase, accent: customAccent }
    }));
    setShowThemeMenu(false);
  };

  const handleRoleSelect = (roleName) => {
    playChime();
    setCompanyConfig(prev => ({ ...prev, currentRole: roleName }));
    setShowRoleMenu(false);
  };

  // Check whether active staff member has permission to view a module in search
  const canStaffAccess = (key) => {
    if (!isStaff) return true;
    if (companyConfig.teamModePermissions && companyConfig.teamModePermissions[key]?.canView === false) {
      return false;
    }
    const menuItem = companyConfig.menuConfiguration?.find(m => m.key === key);
    if (menuItem?.isSuperAdminOnly) {
      return false;
    }
    if (currentStaffAccount?.allowedModules && !currentStaffAccount.allowedModules.includes(key)) {
      return false;
    }
    return true;
  };

  const handleSelectNavFromSearch = (tabKey) => {
    playChime();
    setActiveTab(tabKey);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const isGoogleDriveQuery = canStaffAccess('googleDrive') && (!searchQuery || 
    'google drive'.includes(searchQuery.toLowerCase()) || 
    'drive'.includes(searchQuery.toLowerCase()) ||
    'cloud'.includes(searchQuery.toLowerCase()) ||
    'workspace'.includes(searchQuery.toLowerCase()));

  const isNotesQuery = canStaffAccess('notesReminders') && (!searchQuery ||
    'notes'.includes(searchQuery.toLowerCase()) ||
    'reminders'.includes(searchQuery.toLowerCase()));

  return (
    <header className="app-header" id="app-top-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      {/* 1. LEFT TOP: Three-Dot Menu Launcher for Hidden Stadium Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1 }}>
        <button 
          id="stadium-menu-toggle-btn"
          className="stadium-menu-dot-btn"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close Stadium Menu" : "Open Stadium Menu"}
          aria-label="Toggle Stadium Navigation Menu"
          style={{
            borderColor: isSidebarOpen ? 'var(--accent-crimson)' : 'var(--border-subtle)',
            background: isSidebarOpen ? 'rgba(37, 99, 235, 0.16)' : 'var(--bg-surface)'
          }}
        >
          <div className="stadium-menu-dots-cluster">
            <span className="stadium-menu-dot" />
            <span className="stadium-menu-dot" />
            <span className="stadium-menu-dot" />
          </div>
        </button>

        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0, overflow: 'hidden' }}
          onClick={() => setActiveTab('dashboard')}
          title="Return to Stadium Operations"
        >
          <img 
            src={companyConfig.logoUrl || '/stadium_logo.svg'} 
            alt="Work Stadium Logo" 
            style={{ width: 28, height: 28, borderRadius: '6px', objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800, 
              fontSize: '13.5px', 
              color: 'var(--text-primary)', 
              lineHeight: 1.15,
              letterSpacing: '0.2px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0
            }}>
              <span className="brand-title-text" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {companyConfig.name || 'VERTEX WORK STADIUM ERP'}
              </span>
              <span className="stadium-ops-badge" style={{ 
                fontSize: '9px', 
                background: 'rgba(37, 99, 235, 0.16)', 
                color: 'var(--accent-crimson)', 
                border: '1px solid rgba(37, 99, 235, 0.35)', 
                padding: '1px 6px', 
                borderRadius: '4px', 
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                flexShrink: 0
              }}>
                STADIUM OPS
              </span>
            </span>
            <span style={{ 
              fontSize: '9px', 
              color: 'var(--text-muted)', 
              fontFamily: 'var(--font-body)', 
              fontWeight: 500,
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isStaff ? `Staff Workspace // ${currentStaffAccount?.name || 'Operative'}` : 'Executive Stadium Command'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global Search Bar with RBAC Filtering */}
      <div className="header-search" ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
        <Search size={16} color="var(--text-muted)" />
        <input 
          id="global-erp-search-input"
          type="text" 
          placeholder="Search stadium operations, inventory, initiatives..." 
          value={searchQuery}
          onFocus={() => setShowSearchDropdown(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchDropdown(true);
          }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
          >
            Clear
          </button>
        )}

        {/* Global Navigation & Search Dropdown */}
        {showSearchDropdown && (
          <div 
            id="global-search-dropdown-menu"
            style={{
              position: 'absolute',
              top: '115%',
              left: 0,
              width: '100%',
              minWidth: '320px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--glass-shadow)',
              padding: '8px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
              Quick Navigation Links
            </div>

            {/* Google Drive Link */}
            {isGoogleDriveQuery && (
              <button
                id="search-dropdown-google-drive-link"
                className="nav-item-btn"
                style={{
                  padding: '8px 10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onClick={() => handleSelectNavFromSearch('googleDrive')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={16} color="#3b82f6" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>
                      Google Drive
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {driveAuth.isAuthenticated 
                        ? `Connected (${driveAuth.email})` 
                        : 'Enterprise Cloud Repository • OAuth 2.0'}
                    </div>
                  </div>
                </div>
                <span className="status-badge" style={{ fontSize: '10px', padding: '2px 6px', borderColor: '#3b82f6', color: '#60a5fa' }}>
                  Jump <ExternalLink size={10} style={{ display: 'inline', marginLeft: 2 }} />
                </span>
              </button>
            )}

            {/* Notes & Action Items Quick Link */}
            {isNotesQuery && (
              <button
                id="search-dropdown-notes-link"
                className="nav-item-btn"
                style={{ padding: '8px 10px' }}
                onClick={() => handleSelectNavFromSearch('notesReminders')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellRing size={16} color="var(--accent-purple)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Executive Notes & Action Items
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Briefings archive & scheduled operations alerts
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Role-Filtered Shortcuts */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {canStaffAccess('dashboard') && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', flex: 1 }}
                  onClick={() => handleSelectNavFromSearch('dashboard')}
                >
                  Operations
                </button>
              )}
              {canStaffAccess('inventory') && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', flex: 1 }}
                  onClick={() => handleSelectNavFromSearch('inventory')}
                >
                  Asset Control
                </button>
              )}
              {canStaffAccess('projects') && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', flex: 1 }}
                  onClick={() => handleSelectNavFromSearch('projects')}
                >
                  Initiatives
                </button>
              )}
              {canStaffAccess('invoicing') && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px', flex: 1 }}
                  onClick={() => handleSelectNavFromSearch('invoicing')}
                >
                  Commercial Billing
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dimensional Status indicator */}
      <div className="header-status-pill-container" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div 
          className="header-status-pill-container"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 7, 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-full)', 
            background: sqlServerStatus.online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.08)',
            border: `1px solid ${sqlServerStatus.online ? 'rgba(16, 185, 129, 0.35)' : 'rgba(37, 99, 235, 0.25)'}`,
            fontSize: '11px',
            fontFamily: 'var(--font-mono)'
          }}
          title={sqlServerStatus.online ? `Connected to ${sqlServerStatus.engine} on port 5000` : 'Local client-side persistence active'}
        >
          <span style={{ 
            width: 7, 
            height: 7, 
            borderRadius: '50%', 
            background: sqlServerStatus.online ? '#10b981' : 'var(--accent-crimson)', 
            boxShadow: `0 0 8px ${sqlServerStatus.online ? '#10b981' : 'var(--accent-crimson)'}` 
          }}></span>
          <Database size={12} color={sqlServerStatus.online ? '#34d399' : 'var(--accent-crimson)'} />
          <span style={{ color: 'var(--text-secondary)' }}>SQL DB:</span>
          <span style={{ color: sqlServerStatus.online ? '#34d399' : 'var(--accent-crimson-light)', fontWeight: 700 }}>
            {sqlServerStatus.online ? 'SQLITE / POSTGRES ONLINE' : 'SYNCHRONIZED'}
          </span>
        </div>
      </div>

      {/* Header Action Controls */}
      <div className="header-actions">
        {/* Quick Create Action Button */}
        <div style={{ position: 'relative' }}>
          <button 
            id="quick-create-dropdown-btn"
            className="btn-primary"
            onClick={() => {
              playChime();
              setShowQuickMenu(!showQuickMenu);
            }}
          >
            <Plus size={15} />
            <span>Create</span>
          </button>

          {showQuickMenu && (
            <div 
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 220,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--glass-shadow)',
                padding: '6px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <button 
                id="quick-add-note-btn"
                className="nav-item-btn"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAction('new-note');
                }}
              >
                <BellRing size={14} color="var(--accent-purple)" />
                + New Intel Note / Reminder
              </button>
              <button 
                id="quick-add-item-btn"
                className="nav-item-btn"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAction('new-item');
                }}
              >
                + New Inventory Item
              </button>
              <button 
                id="quick-add-invoice-btn"
                className="nav-item-btn"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAction('new-invoice');
                }}
              >
                + Generate Invoice
              </button>
              <button 
                id="quick-add-task-btn"
                className="nav-item-btn"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAction('new-task');
                }}
              >
                + New Tactical Mission
              </button>
              <button 
                id="quick-add-module-btn"
                className="nav-item-btn"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenQuickAction('new-module');
                }}
              >
                <Sparkles size={14} color="var(--accent-purple)" />
                + Custom ERP Module
              </button>
            </div>
          )}
        </div>

        {/* 2.3 Notifications Bell with Push Alerts Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            id="notifications-bell-btn"
            className="action-icon-btn"
            onClick={() => { playChime(); setShowNotificationsMenu(!showNotificationsMenu); }}
            title="Active Notifications & Reminders"
            style={{
              position: 'relative',
              borderColor: notifications.length > 0 ? 'rgba(255, 42, 95, 0.5)' : 'var(--border-subtle)',
              color: notifications.length > 0 ? 'var(--accent-crimson)' : 'var(--text-secondary)'
            }}
          >
            <BellRing size={17} />
            {notifications.length > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'var(--accent-crimson)',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  width: 17,
                  height: 17,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 6px var(--accent-crimson)'
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {showNotificationsMenu && (
            <div
              id="notifications-dropdown-menu"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 320,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--glass-shadow)',
                padding: '12px',
                zIndex: 70,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Active Push Alerts</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notifications.length} pending</span>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No active push alerts. Reminders will notify here when timestamps trigger.
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div 
                    key={notif.id || index}
                    style={{
                      background: 'rgba(255, 42, 95, 0.08)',
                      border: '1px solid rgba(255, 42, 95, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{notif.title}</span>
                      <button
                        onClick={() => onDismissNotification(notif.id || index)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                      <span className="status-badge s_rank" style={{ fontSize: '9px', padding: '1px 5px' }}>{notif.priority || 'High'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{notif.time || 'Just now'}</span>
                    </div>
                  </div>
                ))
              )}

              <button
                className="btn-secondary"
                style={{ width: '100%', fontSize: '11px', padding: '6px', marginTop: 4, justifyContent: 'center' }}
                onClick={() => {
                  setShowNotificationsMenu(false);
                  setActiveTab('notesReminders');
                }}
              >
                Manage All Notes & Reminders
              </button>
            </div>
          )}
        </div>

        {/* Audio Toggle */}
        <button 
          id="sound-sfx-toggle-btn"
          className="action-icon-btn" 
          onClick={handleSoundToggle}
          title={companyConfig.soundEnabled ? "Mute Sound Synthesizer" : "Enable Sound Effects"}
        >
          {companyConfig.soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        {/* Work Stadium Theme Engine (Multiple-Choice & Combinations) */}
        <div style={{ position: 'relative' }}>
          <button 
            id="theme-selector-btn"
            className="action-icon-btn" 
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="Work Stadium Theme Customization"
            style={{ 
              borderColor: showThemeMenu ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              color: showThemeMenu ? 'var(--accent-crimson)' : 'var(--text-secondary)'
            }}
          >
            <Palette size={17} />
          </button>

          {showThemeMenu && (
            <div 
              id="work-stadium-theme-menu-popover"
              style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: 320,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--glass-shadow)',
                padding: '12px',
                zIndex: 80,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={14} color="var(--accent-crimson)" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                    Theme Customization
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setThemeTab('presets')}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: themeTab === 'presets' ? 'var(--accent-crimson)' : 'transparent',
                      color: themeTab === 'presets' ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Curated ({STADIUM_THEMES.length})
                  </button>
                  <button
                    onClick={() => setThemeTab('mixer')}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: themeTab === 'mixer' ? 'var(--accent-crimson)' : 'transparent',
                      color: themeTab === 'mixer' ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Color Mixer
                  </button>
                </div>
              </div>

              {themeTab === 'presets' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 270, overflowY: 'auto' }}>
                  {STADIUM_THEMES.map((theme) => {
                    const isActive = companyConfig.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        id={`theme-opt-${theme.id}`}
                        className="nav-item-btn"
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isActive ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                          borderColor: isActive ? 'var(--accent-crimson)' : 'transparent'
                        }}
                        onClick={() => handleThemeSelect(theme.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: '50%', 
                            background: theme.accent, 
                            border: `2px solid ${theme.bg}`, 
                            boxShadow: `0 0 8px ${theme.accent}66`,
                            flexShrink: 0 
                          }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? '#ffffff' : 'var(--text-primary)' }}>
                              {theme.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {theme.desc}
                            </div>
                          </div>
                        </div>
                        {isActive && <Check size={14} color="var(--accent-crimson)" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Multiple-Choice Color Combination Mixer */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 5 }}>
                      1. Stadium Base Atmosphere:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                      {BASE_OPTIONS.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setCustomBase(b.id)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: 4,
                            background: b.hex,
                            border: customBase === b.id ? '2px solid var(--accent-crimson)' : '1px solid rgba(255,255,255,0.15)',
                            color: b.id === 'daylight' ? '#0f172a' : '#f8fafc',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 5 }}>
                      2. Primary Stadium Accent Token:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                      {ACCENT_OPTIONS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setCustomAccent(a.id)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.04)',
                            border: customAccent === a.id ? `2px solid ${a.hex}` : '1px solid var(--border-subtle)',
                            color: a.hex,
                            fontSize: '10.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.hex }} />
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Combination Live Preview */}
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: customBase === 'daylight' ? '#ffffff' : '#0c101a',
                    border: `1.5px solid ${customAccent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: customAccent, boxShadow: `0 0 8px ${customAccent}` }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: customBase === 'daylight' ? '#0f172a' : '#f8fafc' }}>
                        Live Stadium Palette
                      </span>
                    </div>
                    <button
                      onClick={handleApplyCustomMixer}
                      className="btn-primary"
                      style={{ fontSize: '10.5px', padding: '4px 10px', background: customAccent, borderColor: customAccent }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Selector Badge */}
        <div style={{ position: 'relative' }}>
          <button 
            id="active-role-selector-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Shield size={13} color="var(--accent-crimson)" />
            <span>{companyConfig.currentRole.split(' ')[0]}</span>
          </button>

          {showRoleMenu && (
            <div 
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 250,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--glass-shadow)',
                padding: '8px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 8px' }}>
                Simulate Role Clearance:
              </div>
              {rolesList.map(role => (
                <button 
                  key={role}
                  className={`nav-item-btn ${companyConfig.currentRole === role ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(role)}
                  style={{ fontSize: '12px' }}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Replay Intro Splash */}
        <button 
          id="header-replay-loading-btn"
          className="action-icon-btn"
          onClick={onReplayLoading}
          title="Replay Video Splash Screen"
          style={{ borderColor: 'rgba(234, 179, 8, 0.4)', color: '#eab308' }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Lock / Logout Button */}
        <button 
          id="header-logout-btn"
          className="action-icon-btn header-hide-mobile"
          onClick={onLogout}
          title="Lock Session & Log Out"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
        >
          <LogOut size={16} />
        </button>

        {/* ── MOBILE ONLY: 3-dot User & Logout Menu ── */}
        <div ref={mobileUserMenuRef} style={{ position: 'relative' }} className="header-show-mobile-only">
          <button
            id="mobile-user-dots-btn"
            className="action-icon-btn"
            onClick={() => setShowMobileUserMenu(prev => !prev)}
            title="User Options"
            style={{
              borderColor: showMobileUserMenu ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              color: showMobileUserMenu ? 'var(--accent-crimson)' : 'var(--text-secondary)'
            }}
          >
            <MoreVertical size={18} />
          </button>

          {showMobileUserMenu && (
            <div
              id="mobile-user-dropdown"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 230,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--glass-shadow)',
                padding: '10px',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {/* User Info Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--accent-crimson)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={18} color="#fff" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isStaff ? (currentStaffAccount?.name || 'Staff') : (companyConfig.leader || 'Admin')}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {isStaff ? (currentStaffAccount?.role || 'Operative') : 'Executive Admin'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2px 0' }} />

              {/* Sound Toggle */}
              <button
                className="nav-item-btn"
                onClick={() => { handleSoundToggle(); setShowMobileUserMenu(false); }}
              >
                {companyConfig.soundEnabled ? <Volume2 size={15} color="var(--accent-crimson)" /> : <VolumeX size={15} color="var(--text-muted)" />}
                <span style={{ fontSize: '13px' }}>{companyConfig.soundEnabled ? 'Mute Sound' : 'Enable Sound'}</span>
              </button>

              {/* Theme */}
              <button
                className="nav-item-btn"
                onClick={() => { setShowMobileUserMenu(false); setShowThemeMenu(true); }}
              >
                <Palette size={15} color="var(--accent-purple)" />
                <span style={{ fontSize: '13px' }}>Change Theme</span>
              </button>

              {/* Replay Splash */}
              <button
                className="nav-item-btn"
                onClick={() => { setShowMobileUserMenu(false); onReplayLoading(); }}
                style={{ color: '#eab308' }}
              >
                <RotateCcw size={15} color="#eab308" />
                <span style={{ fontSize: '13px' }}>Replay Intro</span>
              </button>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '2px 0' }} />

              {/* Logout */}
              <button
                id="mobile-logout-btn"
                className="nav-item-btn"
                onClick={() => { setShowMobileUserMenu(false); onLogout(); }}
                style={{ color: '#f87171' }}
              >
                <LogOut size={15} color="#f87171" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
