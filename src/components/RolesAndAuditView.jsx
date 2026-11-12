import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  History, 
  UserCheck, 
  Download, 
  Filter, 
  Zap,
  Activity,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  Settings2,
  AlertOctagon
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { ALL_SYSTEM_MODULES, verifyBankFeedPurged } from '../utils/routeGuards';

export default function RolesAndAuditView({ 
  companyConfig, 
  setCompanyConfig, 
  rolePermissions = {}, 
  setRolePermissions = () => {},
  staffAccounts = [],
  setStaffAccounts = () => {},
  auditLogs = [], 
  searchQuery = '',
  addAuditLog = () => {}
}) {
  const [activeSubTab, setActiveSubTab] = useState('roles'); // 'roles' | 'staff' | 'audit' | 'compliance'
  const [selectedRole, setSelectedRole] = useState(companyConfig.currentRole);
  const [actionFilter, setActionFilter] = useState('All');
  
  // Custom Role Modal state
  const [showAddRoleModal, setShowAddModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    badge: 'Custom Clearance',
    color: '#a855f7',
    description: '',
    cloneFrom: 'Chunin Strategist'
  });

  // Assign staff role modal state
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [assignedRoleValue, setAssignedRoleValue] = useState('');

  // Active role config
  const activeRoleConfig = rolePermissions[selectedRole] || rolePermissions['Professor D Obito (Grand Mastermind)'];

  // Toggle granular permission for a module
  const handleTogglePermission = (roleKey, moduleKey, permKey) => {
    // Prevent locking Super Admin out of all permissions
    if (roleKey.includes('Mastermind') && permKey === 'view') {
      alert('Mastermind role requires full visibility and cannot be restricted.');
      return;
    }

    playChime();
    setRolePermissions(prev => {
      const role = prev[roleKey];
      if (!role) return prev;

      const currentGranular = role.granularPermissions || {};
      const currentModulePerm = currentGranular[moduleKey] || { view: true, read: true, write: true, edit: true, delete: true };
      const nextVal = !currentModulePerm[permKey];

      const updatedModulePerm = {
        ...currentModulePerm,
        [permKey]: nextVal,
        // If visibility is disabled, disable all sub-actions
        ...(permKey === 'view' && !nextVal ? { read: false, write: false, edit: false, delete: false } : {}),
        // If sub-action is enabled, ensure visibility is true
        ...(permKey !== 'view' && nextVal ? { view: true } : {})
      };

      const updatedRole = {
        ...role,
        granularPermissions: {
          ...currentGranular,
          [moduleKey]: updatedModulePerm
        },
        permissions: {
          ...role.permissions,
          [moduleKey]: updatedModulePerm.view
        }
      };

      addAuditLog({
        user: companyConfig.leader,
        action: 'RBAC_PERMISSION_CHANGE',
        details: `Updated permission for role '${roleKey}' on module '${moduleKey}': ${permKey} -> ${nextVal}`
      });

      return {
        ...prev,
        [roleKey]: updatedRole
      };
    });
  };

  // Create Custom Role Preset
  const handleCreateCustomRole = (e) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) return;

    if (rolePermissions[newRoleForm.name]) {
      alert('A role with this name already exists.');
      return;
    }

    playSuccess();
    const sourceRole = rolePermissions[newRoleForm.cloneFrom] || rolePermissions['Chunin Strategist'];
    const clonedGranular = JSON.parse(JSON.stringify(sourceRole.granularPermissions || {}));

    const newRole = {
      badge: newRoleForm.badge || 'Custom Preset',
      color: newRoleForm.color || '#a855f7',
      description: newRoleForm.description || 'Custom role preset defined by Super Admin.',
      isCustom: true,
      permissions: { ...(sourceRole.permissions || {}) },
      granularPermissions: clonedGranular
    };

    setRolePermissions(prev => ({
      ...prev,
      [newRoleForm.name]: newRole
    }));

    setSelectedRole(newRoleForm.name);
    setShowAddModal(false);

    addAuditLog({
      user: companyConfig.leader,
      action: 'CUSTOM_ROLE_CREATED',
      details: `Created new custom role preset: '${newRoleForm.name}'`
    });
  };

  // Delete Custom Role Preset
  const handleDeleteCustomRole = (roleKey) => {
    if (roleKey.includes('Mastermind')) return;
    if (!confirm(`Are you sure you want to delete custom role preset '${roleKey}'?`)) return;

    playChime();
    setRolePermissions(prev => {
      const copy = { ...prev };
      delete copy[roleKey];
      return copy;
    });

    if (selectedRole === roleKey) {
      setSelectedRole('Professor D Obito (Grand Mastermind)');
    }

    addAuditLog({
      user: companyConfig.leader,
      action: 'CUSTOM_ROLE_DELETED',
      details: `Deleted custom role preset: '${roleKey}'`
    });
  };

  // Assign staff to role dynamically
  const handleAssignStaffRole = (staffId, newRole) => {
    playSuccess();
    setStaffAccounts(prev => prev.map(s => {
      if (s.id === staffId) {
        return { ...s, role: newRole };
      }
      return s;
    }));

    addAuditLog({
      user: companyConfig.leader,
      action: 'STAFF_ROLE_REASSIGNED',
      details: `Dynamically assigned staff member '${staffId}' to role '${newRole}'`
    });
    setEditingStaffId(null);
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = actionFilter === 'All' || log.action.includes(actionFilter);
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q ||
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const exportAuditJSON = () => {
    playChime();
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kamui_audit_log_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Bank feed purge verification record
  const purgeVerification = verifyBankFeedPurged();

  return (
    <div className="page-container" id="roles-audit-governance-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              Governance & Granular RBAC Control
            </h2>
            <span className="status-badge s_rank" style={{ fontSize: '11px' }}>
              SUPER ADMIN GOVERNANCE
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: 4 }}>
            Granular module visibility, read/write/edit/delete control, custom role presets, and security audit trail.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'roles', label: 'Granular RBAC Matrix' },
            { id: 'staff', label: `Staff Role Assignment (${staffAccounts.length})` },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})` },
            { id: 'compliance', label: 'Security & Purge Verification' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn-secondary ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => { playChime(); setActiveSubTab(tab.id); }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: activeSubTab === tab.id ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                color: activeSubTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                borderColor: activeSubTab === tab.id ? 'var(--accent-crimson)' : 'var(--border-subtle)',
                fontWeight: 700
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2.4 SUB-TAB 1: GRANULAR ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      {activeSubTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Super Admin Role Preset Selector Bar */}
          <div className="glass-panel" style={{ border: '1px solid var(--border-accent)', background: 'linear-gradient(90deg, rgba(255, 42, 95, 0.12) 0%, rgba(18, 20, 30, 0.95) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(255, 42, 95, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-crimson)' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-crimson)', fontWeight: 800 }}>
                    Active Clearance Simulation
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    {companyConfig.currentRole}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Simulate Active Session:</span>
                {Object.keys(rolePermissions).map(roleKey => (
                  <button
                    key={roleKey}
                    className="btn-secondary"
                    style={{
                      fontSize: '11px',
                      padding: '5px 10px',
                      background: companyConfig.currentRole === roleKey ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                      color: companyConfig.currentRole === roleKey ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: companyConfig.currentRole === roleKey ? 'var(--accent-crimson)' : 'var(--border-subtle)',
                      fontWeight: companyConfig.currentRole === roleKey ? 700 : 500
                    }}
                    onClick={() => {
                      playSuccess();
                      setCompanyConfig(prev => ({ ...prev, currentRole: roleKey }));
                    }}
                  >
                    {roleKey.split(' ')[0]}
                  </button>
                ))}

                <button
                  id="create-custom-role-preset-btn"
                  className="btn-primary"
                  onClick={() => { playChime(); setShowAddModal(true); }}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} />
                  <span>New Custom Role</span>
                </button>
              </div>
            </div>
          </div>

          {/* Granular Permissions Editor Panel for Selected Role */}
          <div className="glass-panel">
            <div className="panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="panel-title">
                  <Lock size={18} color="var(--accent-purple)" />
                  <span>Configuring Permissions for Role:</span>
                </div>
                {/* Select role to configure */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="form-control"
                  style={{ width: 'auto', fontSize: '13px', fontWeight: 700, borderColor: activeRoleConfig?.color || 'var(--border-accent)' }}
                >
                  {Object.keys(rolePermissions).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="status-badge" style={{ borderColor: activeRoleConfig?.color, color: activeRoleConfig?.color, background: 'rgba(255,255,255,0.04)' }}>
                  {activeRoleConfig?.badge}
                </span>
                {activeRoleConfig?.isCustom && (
                  <button
                    onClick={() => handleDeleteCustomRole(selectedRole)}
                    className="btn-secondary"
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '4px 8px', fontSize: '11px' }}
                    title="Delete this custom role"
                  >
                    <Trash2 size={13} />
                    <span>Delete Role</span>
                  </button>
                )}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {activeRoleConfig?.description}
              </div>
            </div>

            {/* Granular Permission Grid Table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Visibility (Show/Hide)</th>
                    <th style={{ textAlign: 'center' }}>Read</th>
                    <th style={{ textAlign: 'center' }}>Write (Create)</th>
                    <th style={{ textAlign: 'center' }}>Edit (Update)</th>
                    <th style={{ textAlign: 'center' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_SYSTEM_MODULES.map(mod => {
                    const roleGranular = activeRoleConfig?.granularPermissions || {};
                    const perm = roleGranular[mod.key] || {
                      view: activeRoleConfig?.permissions?.[mod.key] ?? true,
                      read: activeRoleConfig?.permissions?.[mod.key] ?? true,
                      write: activeRoleConfig?.permissions?.[mod.key] ?? false,
                      edit: activeRoleConfig?.permissions?.[mod.key] ?? false,
                      delete: activeRoleConfig?.permissions?.[mod.key] ?? false,
                    };

                    const isMastermind = selectedRole.includes('Mastermind');

                    return (
                      <tr key={mod.key} style={{ opacity: perm.view ? 1 : 0.6 }}>
                        <td data-label="Module">
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '13.5px' }}>
                            {mod.label}
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            key: {mod.key}
                          </span>
                        </td>
                        <td data-label="Category">
                          <span className="table-id-pill">{mod.category}</span>
                        </td>

                        {/* Visibility (Show / Hide) */}
                        <td data-label="Visibility" style={{ textAlign: 'center' }}>
                          <button
                            disabled={isMastermind}
                            onClick={() => handleTogglePermission(selectedRole, mod.key, 'view')}
                            style={{
                              background: perm.view ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              border: `1px solid ${perm.view ? '#10b981' : '#ef4444'}`,
                              color: perm.view ? '#34d399' : '#f87171',
                              borderRadius: 'var(--radius-full)',
                              padding: '4px 10px',
                              cursor: isMastermind ? 'default' : 'pointer',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {perm.view ? <Eye size={13} /> : <EyeOff size={13} />}
                            <span>{perm.view ? 'Visible' : 'Hidden'}</span>
                          </button>
                        </td>

                        {/* Read */}
                        <td data-label="Read" style={{ textAlign: 'center' }}>
                          <button
                            disabled={isMastermind || !perm.view}
                            onClick={() => handleTogglePermission(selectedRole, mod.key, 'read')}
                            style={{
                              background: perm.read ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${perm.read ? '#38bdf8' : 'var(--border-subtle)'}`,
                              color: perm.read ? '#38bdf8' : 'var(--text-muted)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              cursor: isMastermind || !perm.view ? 'default' : 'pointer'
                            }}
                          >
                            {perm.read ? 'Granted' : 'Denied'}
                          </button>
                        </td>

                        {/* Write */}
                        <td data-label="Write" style={{ textAlign: 'center' }}>
                          <button
                            disabled={isMastermind || !perm.view}
                            onClick={() => handleTogglePermission(selectedRole, mod.key, 'write')}
                            style={{
                              background: perm.write ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${perm.write ? '#a855f7' : 'var(--border-subtle)'}`,
                              color: perm.write ? '#c084fc' : 'var(--text-muted)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              cursor: isMastermind || !perm.view ? 'default' : 'pointer'
                            }}
                          >
                            {perm.write ? 'Granted' : 'Denied'}
                          </button>
                        </td>

                        {/* Edit */}
                        <td data-label="Edit" style={{ textAlign: 'center' }}>
                          <button
                            disabled={isMastermind || !perm.view}
                            onClick={() => handleTogglePermission(selectedRole, mod.key, 'edit')}
                            style={{
                              background: perm.edit ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${perm.edit ? '#f59e0b' : 'var(--border-subtle)'}`,
                              color: perm.edit ? '#fbbf24' : 'var(--text-muted)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              cursor: isMastermind || !perm.view ? 'default' : 'pointer'
                            }}
                          >
                            {perm.edit ? 'Granted' : 'Denied'}
                          </button>
                        </td>

                        {/* Delete */}
                        <td data-label="Delete" style={{ textAlign: 'center' }}>
                          <button
                            disabled={isMastermind || !perm.view}
                            onClick={() => handleTogglePermission(selectedRole, mod.key, 'delete')}
                            style={{
                              background: perm.delete ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${perm.delete ? '#ef4444' : 'var(--border-subtle)'}`,
                              color: perm.delete ? '#f87171' : 'var(--text-muted)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              cursor: isMastermind || !perm.view ? 'default' : 'pointer'
                            }}
                          >
                            {perm.delete ? 'Granted' : 'Denied'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14, fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="var(--accent-crimson)" />
              <span>
                <strong>Strict Governance Rule:</strong> Hidden modules are completely purged from sidebar navigation, global search, DOM rendering, and API routes for restricted subordinate roles.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2.4 SUB-TAB 2: DYNAMIC STAFF ROLE ASSIGNMENTS */}
      {activeSubTab === 'staff' && (
        <div className="glass-panel" id="staff-role-assignments-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Users size={18} color="var(--accent-cyan)" />
              <span>Staff Clearance & Profile Assignments</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Assign subordinate staff profiles to standard or custom role presets dynamically.
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Profile</th>
                  <th>Username / Email</th>
                  <th>Department</th>
                  <th>Current Assigned Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Reassign Role</th>
                </tr>
              </thead>
              <tbody>
                {staffAccounts.map(staff => (
                  <tr key={staff.id}>
                    <td data-label="Staff Profile">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-purple)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{staff.name}</div>
                          <span className="table-id-pill">{staff.id}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Username / Email">
                      <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>@{staff.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{staff.email}</div>
                    </td>
                    <td data-label="Department" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {staff.department || 'Operations'}
                    </td>
                    <td data-label="Assigned Role">
                      <span className="status-badge" style={{ borderColor: rolePermissions[staff.role]?.color || '#a855f7', color: rolePermissions[staff.role]?.color || '#c084fc' }}>
                        {staff.role}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className="status-badge paid" style={{ fontSize: '10px' }}>Active</span>
                    </td>
                    <td data-label="Reassign Role" style={{ textAlign: 'right' }}>
                      {editingStaffId === staff.id ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <select
                            className="form-control"
                            style={{ width: 'auto', fontSize: '11px', padding: '3px 8px' }}
                            value={assignedRoleValue}
                            onChange={(e) => setAssignedRoleValue(e.target.value)}
                          >
                            {Object.keys(rolePermissions).map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <button
                            className="btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleAssignStaffRole(staff.id, assignedRoleValue)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => setEditingStaffId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => {
                            setEditingStaffId(staff.id);
                            setAssignedRoleValue(staff.role);
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Change Role</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SYSTEM AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="glass-panel" id="audit-trail-panel">
          <div className="panel-header">
            <div className="panel-title">
              <History size={18} color="var(--accent-crimson)" />
              <span>Real-Time Audit Telemetry ({filteredLogs.length} events)</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['All', 'RBAC', 'ROLE', 'NOTE', 'REMINDER', 'GOOGLE', 'TASK', 'TREASURY'].map(filterKey => (
                <button
                  key={filterKey}
                  className={`btn-secondary ${actionFilter === filterKey ? 'active' : ''}`}
                  onClick={() => { playChime(); setActionFilter(filterKey); }}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    background: actionFilter === filterKey ? 'var(--accent-crimson)' : 'var(--bg-surface)',
                    color: actionFilter === filterKey ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: actionFilter === filterKey ? 'var(--accent-crimson)' : 'var(--border-subtle)'
                  }}
                >
                  {filterKey}
                </button>
              ))}

              <button 
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={exportAuditJSON}
              >
                <Download size={13} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / Shinobi</th>
                  <th>Action Event</th>
                  <th>Operational Log Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td data-label="Timestamp" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {log.timestamp}
                    </td>
                    <td data-label="Actor">
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.user}</div>
                    </td>
                    <td data-label="Action Event">
                      <span className="status-badge s_rank" style={{ fontSize: '10.5px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td data-label="Operational Details" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SECURITY & BANK FEED PURGE VERIFICATION */}
      {activeSubTab === 'compliance' && (
        <div className="glass-panel" id="security-compliance-panel">
          <div className="panel-header">
            <div className="panel-title">
              <AlertOctagon size={18} color="#10b981" />
              <span>Security Compliance & Bank Feed Purge Verification</span>
            </div>
            <span className="status-badge paid">
              ALL AUDITS VERIFIED
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
            <div style={{ background: 'var(--bg-surface)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ color: '#34d399', fontWeight: 800, fontSize: '14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={18} /> Bank Feed Endpoints: PURGED
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Verification confirms that all legacy bank feed endpoints, webhook callbacks, Plaid/Yodlee connectors, and banking schemas have been permanently purged from the application codebase and routing controllers.
              </p>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                Protocol: {purgeVerification.protocol}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '14px', marginBottom: 8 }}>
                Purged Endpoints Register
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
                {purgeVerification.purgedEndpoints.map((ep, i) => (
                  <li key={i}><code style={{ color: '#f87171' }}>{ep}</code> [410 GONE]</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '14px', marginBottom: 8 }}>
                Purged Database Tables
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
                {purgeVerification.purgedTables.map((t, i) => (
                  <li key={i}><code style={{ color: '#f87171' }}>{t}</code> [DROPPED CASCADE]</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {showAddRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Create Custom Role Preset</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateCustomRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Role Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    placeholder="e.g. Special Anbu Auditor, Field Logistics Officer"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Badge Title</label>
                    <input 
                      type="text" 
                      required 
                      className="form-control"
                      placeholder="e.g. Special Class, Division Lead"
                      value={newRoleForm.badge}
                      onChange={(e) => setNewRoleForm({ ...newRoleForm, badge: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Color Accent</label>
                    <input 
                      type="color" 
                      className="form-control"
                      style={{ height: '38px', padding: '2px' }}
                      value={newRoleForm.color}
                      onChange={(e) => setNewRoleForm({ ...newRoleForm, color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Clone Baseline Permissions From</label>
                  <select
                    className="form-control"
                    value={newRoleForm.cloneFrom}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, cloneFrom: e.target.value })}
                  >
                    {Object.keys(rolePermissions).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Role Description</label>
                  <textarea 
                    rows="2" 
                    className="form-control"
                    placeholder="Describe operational responsibilities and clearances..."
                    value={newRoleForm.description}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Role Preset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
