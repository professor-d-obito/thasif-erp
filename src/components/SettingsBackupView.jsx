import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
  Edit2,
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  Palette,
  Image,
  Type,
  Layout,
  Sparkles,
  Camera,
  Film,
  HardDrive,
  BellRing,
  Play,
  Check,
  Sliders,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { GRADIENT_PRESETS, DEFAULT_MODULE_BACKGROUNDS } from '../utils/useModuleTheme';
import { uploadObjectStorageFile } from '../utils/apiClient';
import CustomizableSplashLoader from './CustomizableSplashLoader';

const DEFAULT_TILE_NAMES = {
  dashboard: "Executive Dashboard",
  inventory: "Stadium Infrastructure",
  invoicing: "Commercial Billing",
  finance: "Treasury & Ledger",
  operatives: "Personnel Directory",
  projects: "Strategic Initiatives",
  notesReminders: "Operational Notes",
  googleDrive: "Corporate Drive",
  moduleBuilder: "Module Studio",
  roles: "Governance & RBAC",
  settings: "System Configuration"
};

const THEME_OPTIONS = [
  { id: 'stadium-cobalt', label: 'Stadium Cobalt (Classic Arena)', color: '#38bdf8', secondary: '#1e40af' },
  { id: 'stadium-emerald', label: 'Stadium Emerald (Pitch Turf)', color: '#10b981', secondary: '#065f46' },
  { id: 'stadium-amber', label: 'Stadium Floodlight (High Voltage)', color: '#f59e0b', secondary: '#b45309' },
  { id: 'stadium-crimson', label: 'Stadium Crimson (Championship)', color: '#ef4444', secondary: '#991b1b' },
  { id: 'stadium-indigo', label: 'Stadium Night Vision (Sleek Arena)', color: '#818cf8', secondary: '#3730a3' },
  { id: 'stadium-cyan', label: 'Stadium Glacier (Digital Broadcast)', color: '#06b6d4', secondary: '#0e7490' },
  { id: 'stadium-daylight', label: 'Stadium Daylight (Executive Suite)', color: '#0284c7', secondary: '#0369a1' },
];

export default function SettingsBackupView({ 
  companyConfig, 
  setCompanyConfig, 
  staffAccounts = [],
  setStaffAccounts,
  onExportFullERP, 
  onImportFullERP, 
  onResetToDefaults,
  addAuditLog,
  isStaff = false,
  onReplayLoading = () => {},
  onSimulateTeamLogin = () => {}
}) {
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'splashScreen' | 'teamPermissions' | 'security' | 'moduleThemes' | 'backup'
  
  // Custom Color Combination Mixer state
  const [mixerBase, setMixerBase] = useState('stadium-cobalt');
  const [mixerAccent, setMixerAccent] = useState('#38bdf8');

  // Primary Form State
  const [formData, setFormData] = useState({
    ...companyConfig,
    tileNames: companyConfig.tileNames || { ...DEFAULT_TILE_NAMES },
    moduleThemes: companyConfig.moduleThemes || { ...DEFAULT_MODULE_BACKGROUNDS },
    splashConfig: companyConfig.splashConfig || {
      mediaType: 'video',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-with-lights-41551-large.mp4',
      mediaName: 'Futuristic Hyperdrive Tunnel (MP4)',
      title: companyConfig.name || 'WORK STADIUM ERP',
      subtitle: companyConfig.subtitle || 'Centralized Operations & Enterprise Infrastructure Architecture',
      logoUrl: companyConfig.logoUrl || '/stadium_logo.svg',
      duration: 3.5,
      accentColor: '#38bdf8',
      showProgressBar: true,
      showSteps: true,
      allowSkip: true,
      soundEnabled: true,
      loadingSteps: [
        'Initializing Work Stadium Neural Core...',
        'Validating Multi-Tier RBAC Staff Clearance...',
        'Synchronizing Operational Facility Telemetry...',
        'Connecting Centralized Module Studio Architecture...'
      ]
    },
    teamModePermissions: companyConfig.teamModePermissions || {
      dashboard: { canView: true, level: "Standard Access" },
      projects: { canView: true, level: "Standard Access" },
      invoicing: { canView: true, level: "Read Only" },
      finance: { canView: false, level: "Restricted" },
      inventory: { canView: true, level: "Standard Access" },
      operatives: { canView: true, level: "Read Only" },
      notesReminders: { canView: true, level: "Full Access" },
      googleDrive: { canView: true, level: "Standard Access" },
      customModules: { canView: false, level: "Restricted" },
      roles: { canView: false, level: "Restricted" },
      settings: { canView: false, level: "Restricted" }
    }
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPreviewingSplash, setIsPreviewingSplash] = useState(false);

  // Hidden file inputs for image & video uploads
  const fileInputRef = useRef(null);
  const logoUploadRef = useRef(null);
  const avatarUploadRef = useRef(null);
  const bannerUploadRef = useRef(null);
  const loginBgUploadRef = useRef(null);
  const splashMediaUploadRef = useRef(null);

  // Background theming state
  const [selectedModuleForBg, setSelectedModuleForBg] = useState('dashboard');
  const [bgInputMode, setBgInputMode] = useState('gradient');
  const [bgCustomColor, setBgCustomColor] = useState('#0f172a');
  const [bgCustomGradient, setBgCustomGradient] = useState(GRADIENT_PRESETS[0].value);
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.8);
  const bgImageFileRef = useRef(null);

  // Staff Account Management state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Jonin Commander',
    department: 'Operations & Tactics'
  });
  const [showStaffPasswordInput, setShowStaffPasswordInput] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [resetStaffPasswordVal, setResetStaffPasswordVal] = useState('');

  // Save global branding & system naming
  const handleSaveBranding = (e) => {
    if (e) e.preventDefault();
    playSuccess();

    setCompanyConfig(prev => ({
      ...prev,
      name: formData.name,
      subtitle: formData.subtitle,
      leader: formData.leader,
      leaderTitle: formData.leaderTitle,
      logoUrl: formData.logoUrl,
      bannerUrl: formData.bannerUrl,
      loginBgUrl: formData.loginBgUrl,
      loginAvatarUrl: formData.loginAvatarUrl,
      loginTitle: formData.loginTitle,
      loginSubtitle: formData.loginSubtitle,
      currency: formData.currency || '$',
      taxRate: Number(formData.taxRate) || 8.5,
      theme: formData.theme,
      tileNames: formData.tileNames
    }));

    // Update document title dynamically
    document.title = `${formData.name} // Crimson Protocol — ${formData.leader}`;
    document.documentElement.setAttribute('data-theme', formData.theme || 'kamui-dark');

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    addAuditLog({
      user: formData.leader,
      action: 'GLOBAL_SYSTEM_NAMING_UPDATED',
      details: `Updated ERP Name to '${formData.name}' and system branding`
    });
  };

  // Save Loading Screen Splash Settings
  const handleSaveSplashSettings = () => {
    playSuccess();
    setCompanyConfig(prev => ({
      ...prev,
      splashConfig: formData.splashConfig
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    addAuditLog({
      user: formData.leader,
      action: 'SPLASH_LOADING_PAGE_CUSTOMIZED',
      details: `Super Admin customized splash loading media (${formData.splashConfig.mediaType})`
    });
  };

  // Save Team Mode View Permissions
  const handleSaveTeamPermissions = () => {
    playSuccess();
    setCompanyConfig(prev => ({
      ...prev,
      teamModePermissions: formData.teamModePermissions
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    addAuditLog({
      user: formData.leader,
      action: 'TEAM_MODE_PERMISSIONS_UPDATED',
      details: 'Super Admin updated view permissions for Team mode logins'
    });
  };

  // Toggle module view permission for Team mode
  const handleToggleTeamModuleView = (moduleKey) => {
    playChime();
    setFormData(prev => {
      const current = prev.teamModePermissions?.[moduleKey] || { canView: true, level: 'Standard Access' };
      const nextCanView = !current.canView;
      return {
        ...prev,
        teamModePermissions: {
          ...prev.teamModePermissions,
          [moduleKey]: {
            ...current,
            canView: nextCanView,
            level: nextCanView ? current.level : 'Restricted'
          }
        }
      };
    });
  };

  // Change clearance level for Team mode
  const handleChangeTeamModuleLevel = (moduleKey, level) => {
    playChime();
    setFormData(prev => {
      const current = prev.teamModePermissions?.[moduleKey] || { canView: true, level: 'Standard Access' };
      return {
        ...prev,
        teamModePermissions: {
          ...prev.teamModePermissions,
          [moduleKey]: {
            ...current,
            canView: level !== 'Restricted',
            level
          }
        }
      };
    });
  };

  // Handle image file uploads to Object Storage Engine (Local / Cloudinary / AWS S3)
  const handleImageFileUpload = async (field, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const uploadRes = await uploadObjectStorageFile(file, {
        entityType: 'branding',
        entityId: field,
        uploadedBy: formData.leader || 'Administrator'
      });

      if (uploadRes.ok && uploadRes.file?.fileUrl) {
        setFormData(prev => ({ ...prev, [field]: uploadRes.file.fileUrl }));
        playSuccess();
        if (addAuditLog) {
          addAuditLog({
            user: formData.leader,
            action: 'OBJECT_STORAGE_UPLOAD',
            details: `Uploaded '${file.name}' to Object Storage (${uploadRes.file.storageType}) with SQL ID: ${uploadRes.file.id}`
          });
        }
        return;
      }
    } catch (err) {
      console.warn('[Object Storage] Falling back to client base64 storage:', err);
    }

    // Offline / Local fallback
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setFormData(prev => ({ ...prev, [field]: dataUrl }));
      playSuccess();
    };
    reader.readAsDataURL(file);
  };

  // Handle splash media upload (video or image) to Object Storage Engine
  const handleSplashMediaUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please upload a valid video (MP4, WebM) or image (PNG, JPG, GIF, WebP).');
      return;
    }

    try {
      const uploadRes = await uploadObjectStorageFile(file, {
        entityType: 'splash_media',
        uploadedBy: formData.leader || 'Administrator'
      });

      if (uploadRes.ok && uploadRes.file?.fileUrl) {
        setFormData(prev => ({
          ...prev,
          splashConfig: {
            ...prev.splashConfig,
            mediaType: isVideo ? 'video' : 'image',
            mediaUrl: uploadRes.file.fileUrl,
            mediaName: file.name
          }
        }));
        playSuccess();
        if (addAuditLog) {
          addAuditLog({
            user: formData.leader,
            action: 'SPLASH_MEDIA_OBJECT_STORAGE_SAVED',
            details: `Persisted splash media '${file.name}' into Object Storage (${uploadRes.file.storageType})`
          });
        }
        return;
      }
    } catch (err) {
      console.warn('[Object Storage] Splash upload fallback:', err);
    }

    // Offline fallback
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setFormData(prev => ({
        ...prev,
        splashConfig: {
          ...prev.splashConfig,
          mediaType: isVideo ? 'video' : 'image',
          mediaUrl: dataUrl,
          mediaName: file.name
        }
      }));
      playSuccess();
    };
    reader.readAsDataURL(file);
  };

  // Staff Account CRUD
  const handleCreateStaffAccount = (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.username || !staffForm.password) {
      alert('Please fill out all staff credentials.');
      return;
    }

    const newStaff = {
      id: `STAFF-${Date.now().toString().slice(-4)}`,
      name: staffForm.name,
      username: staffForm.username.toLowerCase(),
      email: staffForm.email || `${staffForm.username.toLowerCase()}@kamui-business.com`,
      password: staffForm.password,
      role: staffForm.role,
      department: staffForm.department,
      status: 'Active',
      allowedModules: ["dashboard", "projects", "inventory", "notesReminders", "googleDrive"]
    };

    setStaffAccounts(prev => [newStaff, ...prev]);
    setShowAddStaffModal(false);
    setStaffForm({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'Jonin Commander',
      department: 'Operations & Tactics'
    });
    playSuccess();

    addAuditLog({
      user: formData.leader,
      action: 'STAFF_MEMBER_ENLISTED',
      details: `Created new staff account: ${newStaff.name} (${newStaff.role})`
    });
  };

  const handleToggleStaffStatus = (staffId) => {
    playChime();
    setStaffAccounts(prev => prev.map(s => {
      if (s.id === staffId) {
        const nextStatus = s.status === 'Active' ? 'Suspended' : 'Active';
        addAuditLog({
          user: formData.leader,
          action: 'STAFF_STATUS_TOGGLED',
          details: `Changed account status for ${s.name} to ${nextStatus}`
        });
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleDeleteStaff = (staffId, name) => {
    if (window.confirm(`Permanently remove staff member ${name}?`)) {
      playSuccess();
      setStaffAccounts(prev => prev.filter(s => s.id !== staffId));
      addAuditLog({
        user: formData.leader,
        action: 'STAFF_ACCOUNT_DELETED',
        details: `Deleted staff login for ${name} (${staffId})`
      });
    }
  };

  return (
    <div className="page-container" id="settings-backup-page">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              Super Admin Customization & Governance Studio
            </h2>
            <span className="status-badge s_rank">
              <Sparkles size={11} /> TOTAL SYSTEM ACCESS
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: 2 }}>
            Edit ERP name, custom media uploads, loading page system, and team mode view permissions.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        {!isStaff && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              id="settings-tab-branding-btn"
              className={`btn-secondary ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('branding'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'branding' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeTab === 'branding' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700
              }}
            >
              <Type size={14} />
              <span>System Naming & Branding</span>
            </button>

            <button
              id="settings-tab-splash-btn"
              className={`btn-secondary ${activeTab === 'splashScreen' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('splashScreen'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'splashScreen' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeTab === 'splashScreen' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700
              }}
            >
              <Film size={14} />
              <span>Loading Page System</span>
            </button>

            <button
              id="settings-tab-team-permissions-btn"
              className={`btn-secondary ${activeTab === 'teamPermissions' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('teamPermissions'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'teamPermissions' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeTab === 'teamPermissions' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700
              }}
            >
              <ShieldCheck size={14} />
              <span>Team Mode Permissions</span>
            </button>

            <button
              id="settings-tab-security-btn"
              className={`btn-secondary ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('security'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'security' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeTab === 'security' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700
              }}
            >
              <Users size={14} />
              <span>Staff Accounts</span>
            </button>

            <button
              id="settings-tab-module-themes-btn"
              className={`btn-secondary ${activeTab === 'moduleThemes' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('moduleThemes'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'moduleThemes' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeTab === 'moduleThemes' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700
              }}
            >
              <Layout size={14} />
              <span>Module Theming</span>
            </button>

            <button
              id="settings-tab-backup-btn"
              className={`btn-secondary ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveTab('backup'); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeTab === 'backup' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeTab === 'backup' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700
              }}
            >
              <Download size={14} />
              <span>Vault & Backups</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 700, fontSize: '13px' }}>
            Settings successfully synchronized and persisted to global ERP state!
          </span>
        </div>
      )}

      {/* Restricted notice for Staff members */}
      {isStaff && (
        <div className="glass-panel" style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck size={24} color="var(--accent-purple)" />
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '15px' }}>Staff Access Restricted</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                You are currently logged in with a Team Member account. System naming, custom media uploads, and view permissions configuration are reserved exclusively for the Super Admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: GLOBAL SYSTEM NAMING, BRANDING & LOGOS
          ========================================================================= */}
      {!isStaff && activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* System Naming Card */}
          <div className="glass-panel" id="system-naming-card">
            <div className="panel-header">
              <div className="panel-title">
                <Type size={18} color="var(--accent-crimson)" />
                <span>Global System Naming & Identity (Core Specification)</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                GLOBAL SCOPE // PERSISTENT
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>ERP System Name</label>
                <input 
                  type="text" 
                  id="system-name-input"
                  required
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. NEXUS CLOUD ERP"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Reflected across top headers, browser tab title, login gateways, and splash loader.
                </span>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>System Tagline / Subtitle</label>
                <input 
                  type="text" 
                  id="system-tagline-input"
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Autonomous Enterprise Operating Matrix"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Official business mission statement or operational motto.
                </span>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Super Admin / Founder Name</label>
                <input 
                  type="text" 
                  required
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  value={formData.leader || ''}
                  onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Super Admin Official Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  value={formData.leaderTitle || ''}
                  onChange={(e) => setFormData({ ...formData, leaderTitle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Currency Symbol</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontSize: '13px', width: '120px' }}
                  value={formData.currency || '$'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Palette size={16} color="var(--accent-cyan)" />
                    <span>Work Stadium Theme Customization & Multiple-Choice Color Combinations</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    7 Curated Stadium Themes + Interactive Color Combination Builder
                  </span>
                </div>

                {/* 1. Curated Presets Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginTop: 6 }}>
                  {THEME_OPTIONS.map(theme => {
                    const isSelected = (formData.theme || 'stadium-cobalt') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          playChime();
                          setFormData({ ...formData, theme: theme.id });
                          document.documentElement.setAttribute('data-theme', theme.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                          border: `1.5px solid ${isSelected ? theme.color : 'var(--border-subtle)'}`,
                          color: '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: theme.color, boxShadow: `0 0 8px ${theme.color}` }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.secondary }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {theme.label}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {theme.id}
                          </div>
                        </div>
                        {isSelected && <Check size={14} color={theme.color} />}
                      </button>
                    );
                  })}
                </div>

                {/* 2. Interactive Multiple-Choice Color Combination Mixer */}
                <div style={{
                  marginTop: 16,
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sliders size={14} color="var(--accent-cyan)" />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                        Multiple-Choice Color Combiner (Create Custom Stadium Variant)
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                      Combine Base Arena Palette + Accent Illumination
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 14, alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>1. Base Theme Blueprint:</span>
                      <select
                        className="form-control"
                        style={{ marginTop: 4, fontSize: '12px' }}
                        value={mixerBase}
                        onChange={(e) => setMixerBase(e.target.value)}
                      >
                        <option value="stadium-cobalt">Cobalt Deep Arena</option>
                        <option value="stadium-emerald">Emerald Turf Arena</option>
                        <option value="stadium-amber">Floodlight Voltage Arena</option>
                        <option value="stadium-crimson">Championship Crimson Arena</option>
                        <option value="stadium-indigo">Night Vision Indigo Arena</option>
                        <option value="stadium-cyan">Glacier Broadcast Arena</option>
                        <option value="stadium-daylight">Daylight Executive Arena</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>2. Accent Light Tone:</span>
                      <select
                        className="form-control"
                        style={{ marginTop: 4, fontSize: '12px' }}
                        value={mixerAccent}
                        onChange={(e) => setMixerAccent(e.target.value)}
                      >
                        <option value="#38bdf8">Cyan / Cobalt (#38bdf8)</option>
                        <option value="#10b981">Pitch Turf Emerald (#10b981)</option>
                        <option value="#f59e0b">Floodlight Amber (#f59e0b)</option>
                        <option value="#ef4444">Championship Crimson (#ef4444)</option>
                        <option value="#818cf8">Broadcast Indigo (#818cf8)</option>
                        <option value="#06b6d4">Glacier Ice (#06b6d4)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '11.5px', padding: '8px 14px', width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          playSuccess();
                          setFormData({ ...formData, theme: mixerBase });
                          document.documentElement.setAttribute('data-theme', mixerBase);
                          document.documentElement.style.setProperty('--accent-primary', mixerAccent);
                          document.documentElement.style.setProperty('--accent-cyan', mixerAccent);
                          addAuditLog({
                            user: formData.leader,
                            action: 'THEME_CUSTOM_COMBINATION_APPLIED',
                            details: `Synthesized custom stadium theme combination: Base '${mixerBase}' with accent '${mixerAccent}'`
                          });
                        }}
                      >
                        <Sparkles size={13} />
                        <span>Apply Color Combination</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Media Uploads Card (Logo & Avatars) */}
          <div className="glass-panel" id="custom-media-uploads-card">
            <div className="panel-title" style={{ marginBottom: 14 }}>
              <Image size={18} color="var(--accent-purple)" />
              <span>Custom Media Uploads & Branding Assets</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Organization Logo */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <img 
                    src={formData.logoUrl || '/anime/obito_avatar.jpg'} 
                    alt="Logo Preview" 
                    style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid var(--accent-crimson)' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Organization Logo</label>
                  <input 
                    type="file" 
                    ref={logoUploadRef} 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageFileUpload('logoUrl', e)}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ fontSize: '11px', padding: '6px 12px', alignSelf: 'flex-start' }}
                    onClick={() => logoUploadRef.current && logoUploadRef.current.click()}
                  >
                    <Camera size={13} />
                    <span>Upload Logo Image</span>
                  </button>
                </div>
              </div>

              {/* Login Background Wallpaper */}
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <img 
                    src={formData.loginBgUrl || '/anime/kamui_banner.jpg'} 
                    alt="Wallpaper Preview" 
                    style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid var(--accent-purple)' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Login Screen Wallpaper</label>
                  <input 
                    type="file" 
                    ref={loginBgUploadRef} 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageFileUpload('loginBgUrl', e)}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ fontSize: '11px', padding: '6px 12px', alignSelf: 'flex-start' }}
                    onClick={() => loginBgUploadRef.current && loginBgUploadRef.current.click()}
                  >
                    <Camera size={13} />
                    <span>Upload Login Wallpaper</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" id="save-branding-btn" className="btn-primary" style={{ padding: '10px 24px', fontSize: '13px' }}>
                <Save size={15} />
                <span>Save Global Naming & Branding</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =========================================================================
          TAB 2: LOADING PAGE SYSTEM STUDIO & CUSTOM MEDIA UPLOADS
          ========================================================================= */}
      {!isStaff && activeTab === 'splashScreen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" id="loading-page-system-studio">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <Film size={18} color="var(--accent-crimson)" />
                  <span>Loading Page System: Fully Editable Splash Studio</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 2 }}>
                  Customize media uploads (MP4/WebM videos, GIFs, images), title text, duration, progress bar color, and loading sequence messages.
                </p>
              </div>

              {/* Live Preview Button */}
              <button
                type="button"
                id="preview-loading-splash-btn"
                className="btn-primary"
                onClick={() => { playChime(); setIsPreviewingSplash(true); }}
                style={{ fontSize: '12px', padding: '8px 16px', background: 'linear-gradient(135deg, #ff2a5f 0%, #a855f7 100%)' }}
              >
                <Play size={14} />
                <span>Live Test / Preview Splash</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 14 }}>
              {/* Left Column: Splash Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Media Type Selector */}
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>Loading Media Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 6 }}>
                    {[
                      { id: 'video', label: 'Custom Video (MP4)', desc: 'Auto-play cinematic loop' },
                      { id: 'image', label: 'Custom Image / GIF', desc: 'High-res image or GIF' },
                      { id: 'cyber', label: 'Cyber Matrix Grid', desc: 'Futuristic canvas tech' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          splashConfig: { ...formData.splashConfig, mediaType: type.id }
                        })}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          textAlign: 'left',
                          background: formData.splashConfig?.mediaType === type.id ? 'rgba(255, 42, 95, 0.15)' : 'var(--bg-input)',
                          border: `1px solid ${formData.splashConfig?.mediaType === type.id ? 'var(--accent-crimson)' : 'var(--border-subtle)'}`,
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{type.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media Upload / URL Input */}
                <div className="form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>Custom Media Asset Upload</label>
                  <input 
                    type="file" 
                    ref={splashMediaUploadRef}
                    accept="video/*,image/*"
                    style={{ display: 'none' }}
                    onChange={handleSplashMediaUpload}
                  />

                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input 
                      type="text"
                      className="form-control"
                      style={{ fontSize: '12px' }}
                      placeholder="Enter direct video/image URL or upload file..."
                      value={formData.splashConfig?.mediaUrl || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, mediaUrl: e.target.value }
                      })}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => splashMediaUploadRef.current && splashMediaUploadRef.current.click()}
                      style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      <Upload size={13} />
                      <span>Upload Media File</span>
                    </button>
                  </div>
                </div>

                {/* Splash Title & Subtitle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Splash Header Title</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.splashConfig?.title || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, title: e.target.value }
                      })}
                      placeholder="e.g. NEXUS CLOUD ERP"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Splash Tagline</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.splashConfig?.subtitle || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, subtitle: e.target.value }
                      })}
                      placeholder="e.g. Enterprise Operating Matrix"
                    />
                  </div>
                </div>

                {/* Duration & Accent Color */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      <span>Loading Duration</span>
                      <span style={{ color: 'var(--accent-crimson)', fontFamily: 'var(--font-mono)' }}>
                        {formData.splashConfig?.duration || 3.5}s
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="1.5"
                      max="10"
                      step="0.5"
                      value={formData.splashConfig?.duration || 3.5}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, duration: parseFloat(e.target.value) }
                      })}
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Loading Bar Glow Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input 
                        type="color"
                        value={formData.splashConfig?.accentColor || '#ff2a5f'}
                        onChange={(e) => setFormData({
                          ...formData,
                          splashConfig: { ...formData.splashConfig, accentColor: e.target.value }
                        })}
                        style={{ width: 36, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      />
                      <input 
                        type="text"
                        className="form-control"
                        style={{ fontSize: '12px', width: '100px' }}
                        value={formData.splashConfig?.accentColor || '#ff2a5f'}
                        onChange={(e) => setFormData({
                          ...formData,
                          splashConfig: { ...formData.splashConfig, accentColor: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.splashConfig?.allowSkip !== false}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, allowSkip: e.target.checked }
                      })}
                    />
                    <span>Allow Users to Skip Intro</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.splashConfig?.showProgressBar !== false}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, showProgressBar: e.target.checked }
                      })}
                    />
                    <span>Show Animated Progress Track</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.splashConfig?.showSteps !== false}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, showSteps: e.target.checked }
                      })}
                    />
                    <span>Display Loading Sequence Steps</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={formData.splashConfig?.soundEnabled !== false}
                      onChange={(e) => setFormData({
                        ...formData,
                        splashConfig: { ...formData.splashConfig, soundEnabled: e.target.checked }
                      })}
                    />
                    <span>Play Warp Audio Chime on Finish</span>
                  </label>
                </div>

                {/* Save Button */}
                <div style={{ marginTop: 8 }}>
                  <button 
                    type="button" 
                    id="save-splash-config-btn"
                    className="btn-primary" 
                    onClick={handleSaveSplashSettings}
                    style={{ padding: '10px 24px', fontSize: '13px' }}
                  >
                    <Save size={15} />
                    <span>Save Loading Page Configuration</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Thumbnail & Preview Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  Live Splash Media Frame:
                </div>

                <div style={{
                  height: '280px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `2px solid ${formData.splashConfig?.accentColor || '#ff2a5f'}`,
                  position: 'relative',
                  background: '#06070a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 25px ${(formData.splashConfig?.accentColor || '#ff2a5f')}33`
                }}>
                  {formData.splashConfig?.mediaType === 'video' ? (
                    <video 
                      key={formData.splashConfig?.mediaUrl}
                      src={formData.splashConfig?.mediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-with-lights-41551-large.mp4'} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : formData.splashConfig?.mediaType === 'image' ? (
                    <img 
                      src={formData.splashConfig?.mediaUrl || '/anime/kamui_banner.jpg'} 
                      alt="Splash Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#ff2a5f' }}>
                      <Sparkles size={36} />
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: 8 }}>Cyber Grid Active</div>
                    </div>
                  )}

                  {/* Overlay Mock Header */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    textAlign: 'center'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                      {formData.splashConfig?.title || 'NEXUS CLOUD ERP'}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', maxWidth: 260, marginTop: 4 }}>
                      {formData.splashConfig?.subtitle || 'Enterprise Operating Matrix'}
                    </p>
                    <div style={{
                      width: '60%',
                      height: 5,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 999,
                      marginTop: 14,
                      overflow: 'hidden'
                    }}>
                      <div style={{ width: '65%', height: '100%', background: formData.splashConfig?.accentColor || '#ff2a5f', borderRadius: 999 }} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { playChime(); setIsPreviewingSplash(true); }}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '9px' }}
                >
                  <Play size={14} color="var(--accent-crimson)" />
                  <span>Launch Full-Screen Interactive Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TEAM MODE VIEW PERMISSIONS MATRIX (CORE SPECIFICATION)
          ========================================================================= */}
      {!isStaff && activeTab === 'teamPermissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" id="team-mode-view-permissions-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <ShieldCheck size={18} color="var(--accent-purple)" />
                  <span>Configure Specific View Permissions for Team Mode Logins</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 2 }}>
                  Super Admin governance: Control exactly which modules and operational workspaces staff members can view upon logging in with Team credentials.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  id="test-team-view-btn"
                  className="btn-secondary"
                  onClick={() => {
                    playChime();
                    onSimulateTeamLogin();
                  }}
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                  title="Simulate Team Member View"
                >
                  <Users size={14} color="var(--accent-purple)" />
                  <span>Test As Team Member</span>
                </button>
                <button
                  type="button"
                  id="save-team-permissions-btn"
                  className="btn-primary"
                  onClick={handleSaveTeamPermissions}
                  style={{ fontSize: '12px', padding: '8px 18px' }}
                >
                  <Save size={14} />
                  <span>Save Team Permissions</span>
                </button>
              </div>
            </div>

            {/* Permissions Matrix Table */}
            <div className="table-responsive" style={{ marginTop: 14 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Module / Feature</th>
                    <th>Category</th>
                    <th>Team Login Visibility</th>
                    <th>Access Clearance Level</th>
                    <th>Security Enforcement</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'dashboard', name: 'Executive Dashboard & Telemetry', category: 'Core', desc: 'KPI cards, task completion rates, payment liquidity' },
                    { key: 'projects', name: 'Strategic Initiatives & Projects', category: 'Core', desc: 'Milestone tracking, assigned operational directives, SLAs' },
                    { key: 'invoicing', name: 'Commercial Billing & Invoices', category: 'Core', desc: 'Client billing, commercial receivables, fiscal tax statements' },
                    { key: 'finance', name: 'Treasury & Ledger', category: 'Core', desc: 'Executive cash balances, bank ledgers, financial reserves' },
                    { key: 'inventory', name: 'Stadium Infrastructure & Hardware', category: 'Core', desc: 'Physical equipment, turnstiles, Wi-Fi 7 arrays, restock levels' },
                    { key: 'operatives', name: 'Personnel Directory (HR)', category: 'Core', desc: 'Staff directory, department allocations, shift responsibilities' },
                    { key: 'notesReminders', name: 'Operational Notes & Reminders', category: 'Productivity', desc: 'Executive briefings, push reminder alerts' },
                    { key: 'googleDrive', name: 'Corporate Google Drive', category: 'Cloud Tools', desc: 'Shared architectural blueprints, vendor contracts, client files' },
                    { key: 'customModules', name: 'Module Studio Custom Components', category: 'Extensibility', desc: 'Dynamic relational tables unified in Module Studio' },
                    { key: 'roles', name: 'Governance & RBAC Matrix', category: 'Governance', desc: 'Staff clearance levels and audit trail (Super Admin restricted)' },
                    { key: 'settings', name: 'System Configuration & Security', category: 'Governance', desc: 'Master credentials, global system renaming, theme customization' },
                  ].map(mod => {
                    const perm = formData.teamModePermissions?.[mod.key] || { canView: true, level: 'Standard Access' };
                    const isStrictlyAdmin = mod.key === 'roles' || mod.key === 'settings';

                    return (
                      <tr key={mod.key}>
                        <td data-label="Module">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>{mod.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mod.desc}</span>
                          </div>
                        </td>
                        <td data-label="Category">
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {mod.category}
                          </span>
                        </td>
                        <td data-label="Team Visibility">
                          <button
                            type="button"
                            disabled={isStrictlyAdmin}
                            onClick={() => handleToggleTeamModuleView(mod.key)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: isStrictlyAdmin ? 'not-allowed' : 'pointer',
                              background: isStrictlyAdmin ? 'rgba(239, 68, 68, 0.1)' : (perm.canView ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                              border: `1px solid ${isStrictlyAdmin ? '#ef4444' : (perm.canView ? '#10b981' : '#ef4444')}`,
                              color: isStrictlyAdmin ? '#ef4444' : (perm.canView ? '#10b981' : '#ef4444'),
                              opacity: isStrictlyAdmin ? 0.7 : 1
                            }}
                          >
                            {isStrictlyAdmin ? <Lock size={12} /> : (perm.canView ? <Eye size={12} /> : <EyeOff size={12} />)}
                            <span>{isStrictlyAdmin ? 'Locked (Admin Only)' : (perm.canView ? 'Visible in Team Mode' : 'Hidden from Team')}</span>
                          </button>
                        </td>
                        <td data-label="Permission Level">
                          <select
                            disabled={isStrictlyAdmin}
                            value={isStrictlyAdmin ? 'Restricted' : perm.level}
                            onChange={(e) => handleChangeTeamModuleLevel(mod.key, e.target.value)}
                            className="form-control"
                            style={{ fontSize: '11.5px', padding: '5px 10px', width: '150px' }}
                          >
                            <option value="Full Access">Full Access (Edit & Delete)</option>
                            <option value="Standard Access">Standard Access (View & Add)</option>
                            <option value="Read Only">Read Only (View Only)</option>
                            <option value="Restricted">Restricted (Hidden)</option>
                          </select>
                        </td>
                        <td data-label="Enforcement">
                          <span style={{
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            color: perm.canView && !isStrictlyAdmin ? '#10b981' : 'var(--text-muted)'
                          }}>
                            {perm.canView && !isStrictlyAdmin ? 'STRIPPED IF RESTRICTED' : 'ENFORCED: ZERO ACCESS'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: STAFF DIRECTORY & RBAC ACCOUNTS
          ========================================================================= */}
      {!isStaff && activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" id="staff-directory-management-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <Users size={18} color="var(--accent-purple)" />
                  <span>Team Members & Staff Directory Governance</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Manage team staff accounts, assign roles, reset passwords, or suspend access.
                </p>
              </div>

              <button 
                id="add-staff-modal-open-btn"
                className="btn-primary" 
                style={{ fontSize: '12px' }}
                onClick={() => { playChime(); setShowAddStaffModal(true); }}
              >
                <UserPlus size={14} />
                <span>Enlist New Staff Member</span>
              </button>
            </div>

            <div className="table-responsive" style={{ marginTop: 12 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Assigned Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffAccounts.map((staff) => (
                    <tr key={staff.id}>
                      <td data-label="Full Name" style={{ fontWeight: 700, color: '#ffffff' }}>{staff.name}</td>
                      <td data-label="Username" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{staff.username}</td>
                      <td data-label="Email" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{staff.email}</td>
                      <td data-label="Assigned Role">
                        <span className="status-badge a_rank" style={{ fontSize: '10.5px' }}>
                          {staff.role}
                        </span>
                      </td>
                      <td data-label="Department" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{staff.department}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${staff.status === 'Active' ? 'paid' : 'overdue'}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button 
                            className="action-icon-btn"
                            style={{ width: 28, height: 28 }}
                            onClick={() => handleToggleStaffStatus(staff.id)}
                            title={staff.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {staff.status === 'Active' ? <Lock size={13} color="#f87171" /> : <Unlock size={13} color="#34d399" />}
                          </button>
                          <button 
                            className="action-icon-btn"
                            style={{ width: 28, height: 28, color: 'var(--accent-crimson)' }}
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: DYNAMIC MODULE BACKGROUNDS
          ========================================================================= */}
      {!isStaff && activeTab === 'moduleThemes' && (
        <div className="glass-panel" id="module-themes-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Layout size={18} color="var(--accent-crimson)" />
                <span>Per-Module Background Theming Engine</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Set custom gradients, colors, or image wallpapers independently for each module.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 14 }}>
            <div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>Select Target Module</label>
                <select
                  value={selectedModuleForBg}
                  onChange={(e) => setSelectedModuleForBg(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '12px' }}
                >
                  {Object.keys(formData.tileNames || {}).map(key => (
                    <option key={key} value={key}>{formData.tileNames[key]} ({key})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: '12px', fontWeight: 700 }}>Gradient Presets</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 6 }}>
                  {GRADIENT_PRESETS.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setBgCustomGradient(preset.value)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: preset.value,
                        border: bgCustomGradient === preset.value ? '2px solid #ffffff' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ffffff'
                      }}
                    >
                      {preset.name}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const updatedThemes = {
                    ...(formData.moduleThemes || {}),
                    [selectedModuleForBg]: { type: 'gradient', value: bgCustomGradient, overlayOpacity: bgOverlayOpacity }
                  };
                  setFormData(prev => ({ ...prev, moduleThemes: updatedThemes }));
                  setCompanyConfig(prev => ({ ...prev, moduleThemes: updatedThemes }));
                  playSuccess();
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2000);
                }}
                style={{ marginTop: 16 }}
              >
                <Save size={14} />
                <span>Apply Background to {selectedModuleForBg}</span>
              </button>
            </div>

            {/* Preview Box */}
            <div style={{
              height: '240px',
              borderRadius: '12px',
              background: bgCustomGradient,
              border: '1px solid var(--border-accent)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span className="status-badge s_rank" style={{ fontSize: '10px' }}>LIVE PREVIEW</span>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '16px' }}>{selectedModuleForBg.toUpperCase()} VIEW</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Custom styling engine active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: DATA VAULT & BACKUPS
          ========================================================================= */}
      {!isStaff && activeTab === 'backup' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div className="glass-panel">
            <div className="panel-title" style={{ marginBottom: 10, fontSize: '14px' }}>
              <Download size={16} color="var(--accent-purple)" />
              <span>Export System Backup</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 14 }}>
              Download an encrypted JSON file containing inventory, invoices, staff accounts, branding, and ledger.
            </p>
            <button 
              id="export-full-system-btn"
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              onClick={onExportFullERP}
            >
              <Download size={14} />
              <span>Export JSON Backup</span>
            </button>
          </div>

          <div className="glass-panel">
            <div className="panel-title" style={{ marginBottom: 10, fontSize: '14px' }}>
              <Upload size={16} color="var(--accent-cyan)" />
              <span>Restore Backup</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 14 }}>
              Load a previously saved JSON snapshot to restore all data, branding, and permissions.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const parsed = JSON.parse(ev.target.result);
                    onImportFullERP(parsed);
                    playSuccess();
                  } catch (err) {
                    alert('Invalid JSON file format.');
                  }
                };
                reader.readAsText(file);
              }}
            />
            <button 
              id="import-full-system-btn"
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <Upload size={14} />
              <span>Import Backup</span>
            </button>
          </div>

          <div className="glass-panel" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="panel-title" style={{ marginBottom: 10, fontSize: '14px', color: '#f87171' }}>
              <ShieldAlert size={16} />
              <span>Factory Reset</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: 14 }}>
              Reset ERP back to default factory settings, initial branding, and staff accounts.
            </p>
            <button 
              id="reset-defaults-btn"
              className="btn-outline-danger" 
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all ERP data to default factory state?")) {
                  onResetToDefaults();
                }
              }}
            >
              <RotateCcw size={14} />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Enlist New Staff Member */}
      {showAddStaffModal && (
        <div className="modal-overlay" id="add-staff-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enlist New Staff Member (Team Login)</h3>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaffAccount}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Staff Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="form-control"
                    placeholder="e.g. Minato Namikaze"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Login Username</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      placeholder="e.g. minato"
                      value={staffForm.username}
                      onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Work Email</label>
                    <input 
                      type="email" 
                      required
                      className="form-control"
                      placeholder="minato@kamui-business.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Initial Staff Password</label>
                  <div className="input-with-icon">
                    <KeyRound size={16} className="input-icon" />
                    <input 
                      type={showStaffPasswordInput ? "text" : "password"}
                      required
                      className="form-control"
                      style={{ paddingLeft: '38px', paddingRight: '38px' }}
                      placeholder="Set password for this staff member"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowStaffPasswordInput(!showStaffPasswordInput)}
                    >
                      {showStaffPasswordInput ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned Department</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Operations & Tactics"
                      value={staffForm.department}
                      onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Role Clearance</label>
                    <select
                      className="form-control"
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    >
                      <option value="Jonin Commander">Jonin Commander (Senior Staff)</option>
                      <option value="Chunin Strategist">Chunin Strategist (Logistics & Billing)</option>
                      <option value="Academy Observer">Academy Observer (Read-Only Guest)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddStaffModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <UserPlus size={14} />
                  <span>Register Staff Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Live Interactive Splash Preview Modal */}
      {isPreviewingSplash && (
        <CustomizableSplashLoader
          isPreviewMode={true}
          onClosePreview={() => setIsPreviewingSplash(false)}
          companyConfig={{
            ...companyConfig,
            splashConfig: formData.splashConfig,
            name: formData.name,
            subtitle: formData.subtitle,
            logoUrl: formData.logoUrl
          }}
        />
      )}
    </div>
  );
}
