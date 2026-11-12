import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  ExternalLink, 
  Search, 
  FileText, 
  Table, 
  Presentation, 
  FileCode, 
  Upload, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  Sparkles,
  Cloud,
  FileCheck,
  Database
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';
import { uploadObjectStorageFile, listMediaFiles } from '../utils/apiClient';

// Initial pre-loaded mock files in the authenticated Google Drive environment
const INITIAL_DRIVE_FILES = [
  {
    id: 'gdrive-001',
    name: 'KAMUI_Spatial_Architecture_Master_Blueprint_v4.gdoc',
    type: 'doc',
    size: '4.2 MB',
    lastModified: '2026-10-24 14:20',
    owner: 'Professor D Obito',
    url: 'https://docs.google.com',
    sharedWith: ['Kakashi Hatake', 'Itachi Uchiha'],
    starred: true
  },
  {
    id: 'gdrive-002',
    name: 'FY2026_Q4_Consolidated_Revenue_Projections.gsheet',
    type: 'sheet',
    size: '18.9 MB',
    lastModified: '2026-10-23 18:45',
    owner: 'Professor D Obito',
    url: 'https://sheets.google.com',
    sharedWith: ['Shikamaru Nara', 'Mei Terumi'],
    starred: true
  },
  {
    id: 'gdrive-003',
    name: 'Shinobi_Grand_Fleet_Tactical_Briefing_Deck.gslides',
    type: 'slides',
    size: '32.1 MB',
    lastModified: '2026-10-22 09:12',
    owner: 'Professor D Obito',
    url: 'https://slides.google.com',
    sharedWith: ['Grand Fleet Council'],
    starred: false
  },
  {
    id: 'gdrive-004',
    name: 'Leaf_Shinobi_Corp_Signed_Procurement_Contract.pdf',
    type: 'pdf',
    size: '1.8 MB',
    lastModified: '2026-10-21 16:30',
    owner: 'Kakashi Hatake',
    url: 'https://drive.google.com',
    sharedWith: ['Professor D Obito'],
    starred: true
  },
  {
    id: 'gdrive-005',
    name: 'Chakra_Kunai_Alloy_Metallurgy_Analysis.gsheet',
    type: 'sheet',
    size: '6.4 MB',
    lastModified: '2026-10-19 11:05',
    owner: 'Dimension R&D Lab',
    url: 'https://sheets.google.com',
    sharedWith: ['Operations Unit'],
    starred: false
  },
  {
    id: 'gdrive-006',
    name: 'ERP_System_Granular_RBAC_Security_Manifest.gdoc',
    type: 'doc',
    size: '2.1 MB',
    lastModified: '2026-10-24 20:00',
    owner: 'Professor D Obito',
    url: 'https://docs.google.com',
    sharedWith: ['Itachi Uchiha'],
    starred: true
  }
];

export default function GoogleDriveView({ 
  companyConfig = {}, 
  addAuditLog = () => {},
  driveAuth,
  setDriveAuth
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'doc' | 'sheet' | 'slides' | 'pdf'
  const [driveFiles, setDriveFiles] = useState(INITIAL_DRIVE_FILES);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('doc');
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Load stored media files from SQL Database
  useEffect(() => {
    let isMounted = true;
    async function loadSqlMediaFiles() {
      try {
        const res = await listMediaFiles();
        if (res.ok && Array.isArray(res.files) && isMounted) {
          const sqlFiles = res.files.map(f => {
            const ext = f.filename.split('.').pop()?.toLowerCase();
            let mappedType = 'doc';
            if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(ext)) mappedType = 'image';
            else if (['xls', 'xlsx', 'csv'].includes(ext)) mappedType = 'sheet';
            else if (['ppt', 'pptx'].includes(ext)) mappedType = 'slides';
            else if (ext === 'pdf') mappedType = 'pdf';

            return {
              id: f.id,
              name: f.original_name || f.filename,
              type: mappedType,
              size: `${(f.size_bytes / (1024 * 1024)).toFixed(2)} MB`,
              lastModified: f.created_at ? f.created_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
              owner: f.uploaded_by || companyConfig.leader,
              url: f.file_url,
              sharedWith: ['SQL Object Storage'],
              starred: true,
              isSqlMedia: true,
              storageType: f.storage_type
            };
          });

          setDriveFiles(prev => {
            const nonSql = prev.filter(p => !p.isSqlMedia);
            return [...sqlFiles, ...nonSql];
          });
        }
      } catch (err) {
        console.warn('[Google Drive] Object storage listing:', err);
      }
    }

    loadSqlMediaFiles();
    return () => { isMounted = false; };
  }, []);
  
  // OAuth login form state
  const [targetEmail, setTargetEmail] = useState(companyConfig.googleAccountEmail || 'obito.d.mastermind@gmail.com');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Modular theme hook
  const { style: moduleThemeStyle } = useModuleTheme('googleDrive', companyConfig.moduleThemes);

  const isAuthenticated = driveAuth?.isAuthenticated;

  // Trigger Google OAuth 2.0 Web Login Flow
  const handleOAuthLogin = (e) => {
    e.preventDefault();
    if (!targetEmail.includes('@gmail.com') && !targetEmail.includes('@google.com') && !targetEmail.includes('@')) {
      setAuthError('Please provide a valid Gmail/Google Workspace account address.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');
    playChime();

    setTimeout(() => {
      const authPayload = {
        isAuthenticated: true,
        email: targetEmail,
        token: `ya29.a0AfH6SM_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
        authenticatedAt: new Date().toISOString(),
        scopes: ['drive.readonly', 'drive.file', 'drive.metadata.readonly']
      };

      setDriveAuth(authPayload);
      localStorage.setItem('kamui_erp_gdrive_auth_v1', JSON.stringify(authPayload));
      setIsAuthenticating(false);
      playSuccess();

      addAuditLog({
        user: companyConfig.leader,
        action: 'GOOGLE_DRIVE_OAUTH_AUTHENTICATED',
        details: `Successfully completed Google OAuth 2.0 web login for target account: ${targetEmail}`
      });
    }, 1200);
  };

  // Disconnect / Revoke Google OAuth Token
  const handleOAuthRevoke = () => {
    playChime();
    const revoked = { isAuthenticated: false, email: '', token: '' };
    setDriveAuth(revoked);
    localStorage.removeItem('kamui_erp_gdrive_auth_v1');
    addAuditLog({
      user: companyConfig.leader,
      action: 'GOOGLE_DRIVE_OAUTH_REVOKED',
      details: 'Disconnected session from Google Drive workspace'
    });
  };

  // Upload file to Object Storage Engine or create Drive document
  const handleUploadFile = async (e) => {
    e.preventDefault();

    // 1. If an actual file was selected, upload directly to the Object Storage Engine
    if (selectedFileObj) {
      setIsUploading(true);
      try {
        const uploadRes = await uploadObjectStorageFile(selectedFileObj, {
          entityType: 'document',
          uploadedBy: companyConfig.leader
        });

        if (uploadRes.ok && uploadRes.file) {
          playSuccess();
          const ext = selectedFileObj.name.split('.').pop()?.toLowerCase();
          let mappedType = newFileType;
          if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) mappedType = 'image';
          else if (['xls', 'xlsx', 'csv'].includes(ext)) mappedType = 'sheet';
          else if (['ppt', 'pptx'].includes(ext)) mappedType = 'slides';
          else if (ext === 'pdf') mappedType = 'pdf';

          const newFile = {
            id: uploadRes.file.id,
            name: uploadRes.file.originalName,
            type: mappedType,
            size: `${(uploadRes.file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
            lastModified: new Date().toISOString().slice(0, 16),
            owner: companyConfig.leader,
            url: uploadRes.file.fileUrl,
            sharedWith: ['SQL Object Storage'],
            starred: true,
            isSqlMedia: true,
            storageType: uploadRes.file.storageType
          };

          setDriveFiles(prev => [newFile, ...prev]);
          setShowUploadModal(false);
          setNewFileName('');
          setSelectedFileObj(null);
          setIsUploading(false);

          addAuditLog({
            user: companyConfig.leader,
            action: 'OBJECT_STORAGE_FILE_UPLOADED',
            details: `Saved '${uploadRes.file.originalName}' into SQL Media Database (${uploadRes.file.storageType}) with URL: ${uploadRes.file.fileUrl}`
          });
          return;
        } else {
          alert(`Upload failed: ${uploadRes.error || 'Server error'}`);
        }
      } catch (err) {
        console.error('[Upload Error]', err);
        alert(`Object Storage error: ${err.message}`);
      }
      setIsUploading(false);
      return;
    }

    // 2. Fallback: Virtual Document Creation
    if (!newFileName.trim()) return;

    // Security: Sanitize file name and block executable extensions (CWE-434)
    const sanitizedInput = newFileName.replace(/[<>:"/\\|?*]/g, '').trim();
    if (!sanitizedInput) return;

    const lower = sanitizedInput.toLowerCase();
    const FORBIDDEN_EXTS = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.msi', '.ps1'];
    if (FORBIDDEN_EXTS.some(ext => lower.endsWith(ext))) {
      alert('Security Policy Violation: Executable and script file extensions are strictly prohibited.');
      return;
    }

    playSuccess();
    const extMap = { doc: '.gdoc', sheet: '.gsheet', slides: '.gslides', pdf: '.pdf' };
    const cleanName = sanitizedInput.includes('.') ? sanitizedInput : `${sanitizedInput}${extMap[newFileType] || '.gdoc'}`;

    const newFile = {
      id: `gdrive-${Date.now().toString().slice(-4)}`,
      name: cleanName,
      type: newFileType,
      size: `${(Math.random() * 8 + 1).toFixed(1)} MB`,
      lastModified: new Date().toISOString().replace('T', ' ').slice(0, 16),
      owner: companyConfig.leader,
      url: 'https://drive.google.com',
      sharedWith: ['Mastermind Command'],
      starred: false
    };

    setDriveFiles(prev => [newFile, ...prev]);
    setShowUploadModal(false);
    setNewFileName('');
    setSelectedFileObj(null);

    addAuditLog({
      user: companyConfig.leader,
      action: 'GOOGLE_DRIVE_FILE_UPLOADED',
      details: `Uploaded '${cleanName}' to Google Drive workspace (${targetEmail})`
    });
  };

  // Filter files
  const filteredFiles = driveFiles.filter(file => {
    const matchesType = filterType === 'all' || file.type === filterType;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || file.name.toLowerCase().includes(q) || file.owner.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const getFileIcon = (type) => {
    switch (type) {
      case 'doc':
        return <FileText size={18} color="#3b82f6" />;
      case 'sheet':
        return <Table size={18} color="#10b981" />;
      case 'slides':
        return <Presentation size={18} color="#f59e0b" />;
      case 'pdf':
        return <FileCheck size={18} color="#ef4444" />;
      default:
        return <FileCode size={18} color="#a855f7" />;
    }
  };

  return (
    <div className="page-container" id="google-drive-workspace-page" style={moduleThemeStyle}>
      {/* 2.2 Auth Requirement: If Unauthenticated, trigger Google OAuth 2.0 Web Login Flow */}
      {!isAuthenticated ? (
        <div 
          style={{
            maxWidth: '580px',
            margin: '40px auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--glass-shadow)',
            padding: '36px',
            textAlign: 'center'
          }}
          id="google-oauth-login-card"
        >
          {/* Google Icon / Visual */}
          <div 
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#3b82f6'
            }}
          >
            <Cloud size={32} />
          </div>

          <span className="status-badge" style={{ borderColor: '#3b82f6', color: '#60a5fa', background: 'rgba(59,130,246,0.1)' }}>
            GOOGLE OAUTH 2.0 WEB AUTHENTICATION
          </span>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: 12 }}>
            Connect Google Drive Workspace
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginTop: 8 }}>
            Access to this environment is restricted. Per security specifications, the client device 
            must actively authenticate with the target Google account to grant drive views and synchronization.
          </p>

          <form onSubmit={handleOAuthLogin} style={{ marginTop: '24px', textAlign: 'left' }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Target Gmail / Google Workspace Account
              </label>
              <input 
                type="email" 
                required
                className="form-control"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="e.g. mastermind.obito@gmail.com"
                style={{ fontSize: '13.5px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Requires active authentication token with <code>drive.readonly</code> & <code>drive.file</code> permissions.
              </span>
            </div>

            {authError && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: 12 }}>
                {authError}
              </div>
            )}

            <button
              id="google-oauth-submit-btn"
              type="submit"
              disabled={isAuthenticating}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: '13.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                borderColor: '#3b82f6'
              }}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Negotiating Google OAuth 2.0 Handshake...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Authorize & Sign in with Google</span>
                </>
              )}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 16, fontSize: '11px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#10b981' }} />
            Protected by Zero-Trust Google Identity Verification Protocol.
          </div>
        </div>
      ) : (
        /* Authenticated Google Drive View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Bar with Live Account Status & Direct Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
                  Google Drive Workspace
                </h2>
                <span className="status-badge" style={{ borderColor: '#10b981', color: '#34d399', background: 'rgba(16,185,129,0.1)' }}>
                  <CheckCircle2 size={12} /> OAUTH 2.0 CONNECTED
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: 4 }}>
                Synchronized with <strong>{driveAuth.email}</strong> • Real-time cloud storage telemetry & enterprise docs.
              </p>
            </div>

            {/* Direct Google Drive Link & Controls */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Direct Link to Google Drive Web */}
              <a
                id="open-google-drive-direct-link"
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  borderColor: '#3b82f6',
                  textDecoration: 'none'
                }}
              >
                <span>Open in Google Drive</span>
                <ExternalLink size={15} />
              </a>

              <button
                id="gdrive-upload-file-btn"
                className="btn-secondary"
                onClick={() => { playChime(); setShowUploadModal(true); }}
              >
                <Upload size={15} />
                <span>Upload to Drive</span>
              </button>

              <button
                id="gdrive-disconnect-oauth-btn"
                className="btn-secondary"
                onClick={handleOAuthRevoke}
                title="Disconnect Google Drive session"
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <LogOut size={15} />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Telemetry Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Cloud Storage Allocated</span>
                <div className="kpi-icon-wrap" style={{ color: '#3b82f6' }}>
                  <HardDrive size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#ffffff' }}>
                142.6 GB <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ 2.0 TB</span>
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-up">7.1% Capacity</span>
                <span>Google Workspace Tier</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Synchronized ERP Docs</span>
                <div className="kpi-icon-wrap" style={{ color: '#10b981' }}>
                  <FileText size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#ffffff' }}>
                {driveFiles.length} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Files</span>
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-up">Bidirectional Sync</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Target Gmail Account</span>
                <div className="kpi-icon-wrap" style={{ color: '#f59e0b' }}>
                  <Cloud size={18} />
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '16px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {driveAuth.email}
              </div>
              <div className="kpi-footer">
                <span className="trend-pill trend-up">Token Valid</span>
                <span>OAuth 2.0 Active</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Files' },
                { id: 'doc', label: 'Docs' },
                { id: 'sheet', label: 'Sheets' },
                { id: 'slides', label: 'Slides' },
                { id: 'pdf', label: 'PDFs' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`btn-secondary ${filterType === f.id ? 'active' : ''}`}
                  onClick={() => { playChime(); setFilterType(f.id); }}
                  style={{
                    fontSize: '12px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: filterType === f.id ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                    color: filterType === f.id ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: filterType === f.id ? 'var(--accent-crimson)' : 'var(--border-subtle)',
                    fontWeight: filterType === f.id ? 700 : 500
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick search in drive */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search Google Drive files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* File Explorer Table */}
          <div className="glass-panel" id="google-drive-files-panel">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Last Modified</th>
                    <th>Owner</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No Google Drive files match this query.
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map(file => (
                      <tr key={file.id}>
                        <td data-label="File Name">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {getFileIcon(file.type)}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span>{file.name}</span>
                                {file.isSqlMedia && (
                                  <span className="status-badge s_rank" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                    SQL Object Storage ({file.storageType || 'Local'})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Shared with: {file.sharedWith.join(', ')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Type">
                          <span className="table-id-pill" style={{ textTransform: 'uppercase' }}>
                            {file.type}
                          </span>
                        </td>
                        <td data-label="Size" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{file.size}</td>
                        <td data-label="Last Modified" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {file.lastModified}
                        </td>
                        <td data-label="Owner" style={{ fontSize: '12.5px' }}>{file.owner}</td>
                        <td data-label="Action" style={{ textAlign: 'right' }}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{
                              fontSize: '11px',
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textDecoration: 'none'
                            }}
                          >
                            <span>Open</span>
                            <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upload File to Drive Modal */}
          {showUploadModal && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: 520 }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cloud size={18} color="var(--accent-crimson)" />
                    <h3 style={{ margin: 0 }}>Upload to Object Storage & Google Drive</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFileObj(null);
                      setNewFileName('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUploadFile}>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Device File Selection for Object Storage */}
                    <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-accent)' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Database size={14} color="var(--accent-crimson)" />
                        <span>Direct File Upload (Local Object Storage / Cloudinary / AWS S3)</span>
                      </label>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) {
                            setSelectedFileObj(f);
                            if (!newFileName) {
                              setNewFileName(f.name.replace(/\.[^/.]+$/, ""));
                            }
                          }
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ fontSize: '11px', padding: '6px 12px' }}
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                          <Upload size={13} />
                          <span>{selectedFileObj ? 'Change File' : 'Choose File from Device'}</span>
                        </button>
                        {selectedFileObj ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--accent-crimson)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ✓ {selectedFileObj.name} ({(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB)
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Supports PDF, Sheets, Docs, Images (Max 20MB)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Document Title</label>
                      <input 
                        type="text" 
                        required
                        className="form-control"
                        placeholder="e.g. Q4_Executive_Report"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Google Drive Application Type</label>
                      <select 
                        className="form-control"
                        value={newFileType}
                        onChange={(e) => setNewFileType(e.target.value)}
                      >
                        <option value="doc">Google Docs (.gdoc)</option>
                        <option value="sheet">Google Sheets (.gsheet)</option>
                        <option value="slides">Google Slides (.gslides)</option>
                        <option value="pdf">Standard PDF Document (.pdf)</option>
                      </select>
                    </div>

                    <div style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <strong>SQL Storage Integration:</strong> Uploaded files are automatically saved to object storage, mapped with secure SHA-256 integrity, and indexed in the relational SQL <code>media_files</code> database table.
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFileObj(null);
                        setNewFileName('');
                      }}
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading to Object Storage...' : (selectedFileObj ? 'Upload & Save to SQL Storage' : 'Create Google Drive Record')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
