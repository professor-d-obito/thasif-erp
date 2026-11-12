import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  Check, 
  Sparkles, 
  Layers, 
  HardDrive, 
  BellRing, 
  Lock, 
  Unlock,
  CheckCircle,
  HelpCircle,
  Save
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';

export default function MenuCustomizerModal({
  isOpen,
  onClose,
  companyConfig,
  setCompanyConfig,
  onOpenModuleStudio,
  addAuditLog = () => {}
}) {
  if (!isOpen) return null;

  const currentMenu = companyConfig.menuConfiguration || [];
  const [menuList, setMenuList] = useState([...currentMenu]);
  const [editingKey, setEditingKey] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  // Quick Add Custom Feature form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeature, setNewFeature] = useState({
    label: '',
    icon: 'Layers',
    category: 'Custom Features',
    isSuperAdminOnly: false
  });

  // Toggle enable/disable
  const handleToggleEnable = (key) => {
    playChime();
    setMenuList(prev => prev.map(item => {
      if (item.key === key) {
        const nextEnabled = !item.enabled;
        return { ...item, enabled: nextEnabled };
      }
      return item;
    }));
  };

  // Toggle Super Admin only
  const handleToggleAdminOnly = (key) => {
    playChime();
    setMenuList(prev => prev.map(item => {
      if (item.key === key) {
        return { ...item, isSuperAdminOnly: !item.isSuperAdminOnly };
      }
      return item;
    }));
  };

  // Reorder items: Move Up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    playChime();
    setMenuList(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Reorder items: Move Down
  const handleMoveDown = (index) => {
    if (index === menuList.length - 1) return;
    playChime();
    setMenuList(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Rename item
  const startEditing = (item) => {
    setEditingKey(item.key);
    setEditLabel(item.label);
  };

  const saveRename = (key) => {
    playSuccess();
    setMenuList(prev => prev.map(item => {
      if (item.key === key) {
        return { ...item, label: editLabel.trim() || item.label };
      }
      return item;
    }));
    setEditingKey(null);
  };

  // Add custom feature to menu
  const handleAddFeature = (e) => {
    e.preventDefault();
    if (!newFeature.label.trim()) return;

    const key = `custom_${Date.now()}`;
    const newItem = {
      key,
      label: newFeature.label.trim(),
      icon: newFeature.icon,
      category: newFeature.category,
      enabled: true,
      isSuperAdminOnly: newFeature.isSuperAdminOnly,
      order: menuList.length + 1
    };

    setMenuList(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewFeature({ label: '', icon: 'Layers', category: 'Custom Features', isSuperAdminOnly: false });
    playSuccess();

    addAuditLog({
      user: companyConfig.leader,
      action: 'MENU_FEATURE_ADDED',
      details: `Added new feature to ERP menu: '${newItem.label}'`
    });
  };

  // Save all menu changes to companyConfig
  const handleSaveAll = () => {
    playSuccess();
    setCompanyConfig(prev => ({
      ...prev,
      menuConfiguration: menuList,
      tileNames: {
        ...(prev.tileNames || {}),
        ...menuList.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.label }), {})
      }
    }));
    addAuditLog({
      user: companyConfig.leader,
      action: 'MENU_CONFIGURATION_SAVED',
      details: 'Super Admin updated adaptable menu layout and feature visibility'
    });
    onClose();
  };

  // Reset to system defaults
  const handleResetDefaults = () => {
    playChime();
    if (window.confirm('Reset navigation menu to default factory settings?')) {
      const defaultOrder = [
        { key: "dashboard", label: "Command Center", icon: "LayoutDashboard", category: "Core", enabled: true, isSuperAdminOnly: false, order: 1 },
        { key: "projects", label: "Tactical Missions & Projects", icon: "CheckSquare", category: "Core", enabled: true, isSuperAdminOnly: false, order: 2 },
        { key: "invoicing", label: "Sales & Invoicing", icon: "Receipt", category: "Core", enabled: true, isSuperAdminOnly: false, order: 3 },
        { key: "finance", label: "Treasury & Ledger", icon: "Wallet", category: "Core", enabled: true, isSuperAdminOnly: true, order: 4 },
        { key: "inventory", label: "Inventory & Armory", icon: "Package", category: "Core", enabled: true, isSuperAdminOnly: false, order: 5 },
        { key: "operatives", label: "Clan Operatives (HR)", icon: "Users", category: "Core", enabled: true, isSuperAdminOnly: false, order: 6 },
        { key: "notesReminders", label: "Notes & Reminders", icon: "BellRing", category: "Productivity", enabled: true, isSuperAdminOnly: false, order: 7 },
        { key: "googleDrive", label: "Google Drive Workspace", icon: "HardDrive", category: "Cloud Tools", enabled: true, isSuperAdminOnly: false, order: 8 },
        { key: "moduleBuilder", label: "Module Studio", icon: "Layers", category: "Extensibility", enabled: true, isSuperAdminOnly: true, order: 9 },
        { key: "roles", label: "Roles & RBAC Matrix", icon: "ShieldCheck", category: "Governance", enabled: true, isSuperAdminOnly: true, order: 10 },
        { key: "settings", label: "Settings & Security", icon: "Settings", category: "Governance", enabled: true, isSuperAdminOnly: true, order: 11 },
      ];
      setMenuList(defaultOrder);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      id="menu-customizer-modal-overlay"
      style={{ zIndex: 9999 }}
      onClick={(e) => { if (e.target.id === 'menu-customizer-modal-overlay') onClose(); }}
    >
      <div 
        className="glass-panel" 
        style={{
          width: '90%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderColor: 'rgba(255, 42, 95, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 42, 95, 0.2)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 14, 21, 0.9)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-badge s_rank" style={{ fontSize: '10.5px' }}>
                <Sparkles size={11} /> SUPER ADMIN CUSTOMIZER
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                DYNAMIC NAVIGATION ARCHITECTURE
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
              Customizable Menu & Feature Manager
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Enable/disable features (including Notes and Google Drive), reorder items, rename labels, and control staff visibility.
            </p>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Action Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Active Menu Tiles: {menuList.filter(m => m.enabled).length} Enabled / {menuList.length} Total
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button"
                className="btn-secondary" 
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={14} />
                <span>{showAddForm ? 'Cancel New Feature' : 'Add New Feature'}</span>
              </button>
              <button 
                type="button"
                className="btn-secondary" 
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={handleResetDefaults}
              >
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Add New Feature Inline Form */}
          {showAddForm && (
            <form 
              onSubmit={handleAddFeature}
              style={{
                background: 'rgba(255, 42, 95, 0.06)',
                border: '1px solid rgba(255, 42, 95, 0.3)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                Create Custom Menu Integration / Feature Tile
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Feature / Module Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Client Contracts Vault"
                    value={newFeature.label}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, label: e.target.value }))}
                    className="form-control"
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Menu Category</label>
                  <select
                    value={newFeature.category}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, category: e.target.value }))}
                    className="form-control"
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  >
                    <option value="Core">Core Operations</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Cloud Tools">Cloud Tools</option>
                    <option value="Custom Features">Custom Features</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newFeature.isSuperAdminOnly}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, isSuperAdminOnly: e.target.checked }))}
                  />
                  <span>Super Admin Only (Hide from Staff Team Login)</span>
                </label>

                <button type="submit" className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  <Plus size={14} />
                  <span>Register Feature</span>
                </button>
              </div>
            </form>
          )}

          {/* Menu Items Table / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menuList.map((item, idx) => {
              const isEditing = editingKey === item.key;
              const isIntegration = item.key === 'notesReminders' || item.key === 'googleDrive';

              return (
                <div 
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: item.enabled ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${item.enabled ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.04)'}`,
                    borderRadius: '8px',
                    opacity: item.enabled ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Left: Reorder Controls & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Reorder Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          padding: 1
                        }}
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === menuList.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === menuList.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)',
                          cursor: idx === menuList.length - 1 ? 'default' : 'pointer',
                          padding: 1
                        }}
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 20 }}>
                      #{idx + 1}
                    </span>

                    {/* Label or Edit input */}
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '12px', padding: '4px 8px', width: '200px' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => saveRename(item.key)}
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: item.enabled ? '#ffffff' : 'var(--text-muted)' }}>
                            {item.label}
                          </span>
                          {isIntegration && (
                            <span style={{
                              fontSize: '9.5px',
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}>
                              INTEGRATION
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                            title="Rename Menu Label"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Category: {item.category} • Key: <span style={{ fontFamily: 'var(--font-mono)' }}>{item.key}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Controls (Visibility Toggle & Admin Only Lock) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Role Access Tag */}
                    <button
                      type="button"
                      onClick={() => handleToggleAdminOnly(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: item.isSuperAdminOnly ? 'rgba(255, 42, 95, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${item.isSuperAdminOnly ? 'rgba(255, 42, 95, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                        color: item.isSuperAdminOnly ? 'var(--accent-crimson-light)' : '#10b981',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                      title="Click to toggle Super Admin Only vs Team Member Access"
                    >
                      {item.isSuperAdminOnly ? <Lock size={11} /> : <Unlock size={11} />}
                      <span>{item.isSuperAdminOnly ? 'Super Admin Only' : 'Team Accessible'}</span>
                    </button>

                    {/* Enable / Disable Feature Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleEnable(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: item.enabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                        border: `1px solid ${item.enabled ? '#10b981' : '#ef4444'}`,
                        color: item.enabled ? '#10b981' : '#ef4444',
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title={item.enabled ? 'Click to Disable / Remove from Menu' : 'Click to Enable Feature in Menu'}
                    >
                      {item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{item.enabled ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 14, 21, 0.95)'
        }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Changes immediately take effect in the active session and persist to LocalStorage.
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ fontSize: '12px' }}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleSaveAll}
              style={{ fontSize: '12px', padding: '8px 18px' }}
            >
              <Save size={14} />
              <span>Save Menu Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
