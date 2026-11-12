import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  ArrowRight, 
  Code, 
  Table, 
  PlusCircle,
  HelpCircle,
  Activity,
  ShieldCheck,
  Database,
  Cpu,
  RefreshCw,
  Server,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Workflow
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';

export default function CustomModuleBuilderView({ 
  customModules = [], 
  setCustomModules = () => {}, 
  companyConfig = {}, 
  addAuditLog = () => {},
  setActiveTab = () => {}
}) {
  const [activeStudioTab, setActiveStudioTab] = useState('topology'); // 'topology' | 'components' | 'diagnostics'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  // New Module Form State
  const [moduleForm, setModuleForm] = useState({
    name: '',
    category: 'Operations',
    icon: 'Layers',
    description: '',
    fields: [
      { key: 'title', label: 'Item / Record Title', type: 'text', required: true, options: [] },
      { key: 'classification', label: 'Classification', type: 'select', required: true, options: ['Operational', 'High Priority', 'Restricted'] },
      { key: 'dateAdded', label: 'Registration Date', type: 'date', required: true, options: [] },
      { key: 'isActive', label: 'Active Status', type: 'checkbox', required: false, options: [] }
    ]
  });

  const [fieldOptionsText, setFieldOptionsText] = useState({ 1: 'Operational, High Priority, Restricted' });

  const categories = ['Operations', 'Infrastructure', 'Commercial', 'Security', 'Logistics', 'Governance'];

  // Centralized Business Processes Architecture Catalog
  const unifiedProcesses = [
    {
      id: "PROC-OPS",
      name: "Operations & Facility Management",
      category: "Core Stadium Infrastructure",
      description: "Unified pipeline orchestrating stadium seating zones, physical IoT sensors, Wi-Fi 7 arrays, and personnel directives.",
      components: ["projects", "inventory", "operatives"],
      status: "Active",
      latency: "12ms",
      syncStatus: "Real-time Telemetry",
      health: 100,
      protocol: "MQTT / WebSocket v2.4",
      lastAudit: "2 mins ago"
    },
    {
      id: "PROC-COMM",
      name: "Commercial Billing & Treasury Process",
      category: "Fiscal Architecture",
      description: "Centralized financial ledger unifying vendor receivables, VIP suite commercial invoicing, and cash reserve liquidity.",
      components: ["invoicing", "finance"],
      status: "Active",
      latency: "18ms",
      syncStatus: "Synchronized",
      health: 99.8,
      protocol: "ISO 20022 Financial Gateway",
      lastAudit: "5 mins ago"
    },
    {
      id: "PROC-CLOUD",
      name: "Collaboration & Cloud Ecosystem",
      category: "Data Integration Hub",
      description: "Unified cloud integration aggregating client agreements in Google Drive, operational notes, and alert tickers.",
      components: ["googleDrive", "notesReminders"],
      status: "Active",
      latency: "24ms",
      syncStatus: "OAuth2 Direct Stream",
      health: 100,
      protocol: "REST / gRPC Bridge",
      lastAudit: "Just now"
    },
    {
      id: "PROC-GOV",
      name: "Governance, RBAC & Security Gateway",
      category: "Enterprise Security",
      description: "Centralized authorization engine enforcing staff task scoping, module visibility restrictions, and immutable audit logs.",
      components: ["roles", "settings"],
      status: "Protected",
      latency: "5ms",
      syncStatus: "Policy Enforced",
      health: 100,
      protocol: "Zero-Trust RBAC Matrix",
      lastAudit: "1 min ago"
    },
    {
      id: "PROC-EXT",
      name: "Dynamic Extensibility & Schema Studio",
      category: "Custom Relational Architecture",
      description: "Centralized architecture where operators deploy custom schemas, dynamic relational tables, and business components.",
      components: customModules.map(m => m.name),
      status: "Ready",
      latency: "8ms",
      syncStatus: `${customModules.length} Modules Online`,
      health: 100,
      protocol: "Dynamic Schema Engine",
      lastAudit: "Active"
    }
  ];

  const addFieldRow = () => {
    playChime();
    setModuleForm(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        { 
          key: `field_${prev.fields.length + 1}`, 
          label: `Custom Field ${prev.fields.length + 1}`, 
          type: 'text', 
          required: false, 
          options: [] 
        }
      ]
    }));
  };

  const removeFieldRow = (index) => {
    playChime();
    if (moduleForm.fields.length <= 1) return;
    setModuleForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const updateFieldProperty = (index, prop, value) => {
    setModuleForm(prev => {
      const updated = [...prev.fields];
      updated[index][prop] = value;
      if (prop === 'label' && !updated[index].isKeyCustomized) {
        updated[index].key = value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      }
      return { ...prev, fields: updated };
    });
  };

  const handleOptionsChange = (index, text) => {
    setFieldOptionsText(prev => ({ ...prev, [index]: text }));
    const opts = text.split(',').map(o => o.trim()).filter(Boolean);
    updateFieldProperty(index, 'options', opts);
  };

  const handleCreateModule = (e) => {
    e.preventDefault();
    playSuccess();

    const slug = moduleForm.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    const newModuleId = `mod-${slug}-${Date.now().toString().slice(-4)}`;

    const newModule = {
      id: newModuleId,
      name: moduleForm.name,
      slug,
      icon: moduleForm.icon,
      category: moduleForm.category,
      description: moduleForm.description || `Custom business process component managed under Work Stadium Module Studio`,
      fields: moduleForm.fields,
      records: [
        {
          id: `REC-${Date.now().toString().slice(-4)}`,
          title: `Initial ${moduleForm.name} Deployment Entry`,
          classification: 'Operational',
          dateAdded: new Date().toISOString().slice(0, 10),
          isActive: true
        }
      ]
    };

    setCustomModules(prev => [...prev, newModule]);

    addAuditLog({
      user: companyConfig.leader,
      action: 'MODULE_STUDIO_DEPLOYMENT',
      details: `Integrated and deployed operational component '${newModule.name}' into centralized Module Studio architecture`
    });

    setShowCreateModal(false);
    setActiveTab(`custom-${newModule.id}`);
  };

  const handleDeleteModule = (modId, modName) => {
    if (window.confirm(`Confirm removal: This will detach custom operational component '${modName}' from the centralized Module Studio architecture. Proceed?`)) {
      playSuccess();
      setCustomModules(prev => prev.filter(m => m.id !== modId));
      addAuditLog({
        user: companyConfig.leader,
        action: 'MODULE_STUDIO_PURGE',
        details: `Purged operational component '${modName}' (${modId}) from Module Studio`
      });
    }
  };

  const handleRunDiagnostics = () => {
    playChime();
    setDiagnosticsRunning(true);
    setDiagnosticResult(null);

    setTimeout(() => {
      playSuccess();
      setDiagnosticsRunning(false);
      setDiagnosticResult({
        timestamp: new Date().toLocaleTimeString(),
        status: 'Optimal',
        checkedProcesses: 5,
        totalComponents: 12 + customModules.length,
        throughput: '1,420 msgs/sec',
        errorCount: 0,
        summary: 'All centralized business processes and operational components are unified, synchronized, and reporting 100% operational integrity.'
      });
      addAuditLog({
        user: companyConfig.leader,
        action: 'MODULE_STUDIO_DIAGNOSTIC',
        details: 'Executed complete pipeline integrity diagnostics across all unified ERP business processes'
      });
    }, 900);
  };

  return (
    <div className="page-container" id="custom-module-studio-page">
      {/* Studio Master Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '8px', 
              background: 'rgba(56, 189, 248, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--accent-cyan)' 
            }}>
              <Workflow size={22} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Module Studio Architecture
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                CENTRALIZED BUSINESS PROCESS & COMPONENT HUB
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 8, maxWidth: '800px', lineHeight: 1.5 }}>
            Module Studio refers to a centralized architecture within the ERP where various business processes 
            and operational components are unified and managed. Review live pipeline topologies, monitor subsystem health, 
            and architect extensible data entities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            id="run-studio-diagnostics-btn"
            className="btn-secondary"
            onClick={handleRunDiagnostics}
            disabled={diagnosticsRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}
          >
            <RefreshCw size={14} className={diagnosticsRunning ? "spin" : ""} />
            <span>{diagnosticsRunning ? 'Running Integrity Check...' : 'Run Studio Diagnostics'}</span>
          </button>

          <button 
            id="architect-new-module-btn"
            className="btn-primary" 
            onClick={() => { playChime(); setShowCreateModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}
          >
            <Plus size={16} />
            <span>Architect Operational Component</span>
          </button>
        </div>
      </div>

      {/* 4 Architectural Telemetry Metrics */}
      <div className="kpi-grid" style={{ marginTop: 14 }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Unified Business Processes</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-cyan)' }}>
              <Workflow size={18} />
            </div>
          </div>
          <div className="kpi-value">5 Core Systems</div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">All Synchronized</span>
            <span>Operations, Commerce, Cloud, RBAC</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Operational Components</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-emerald)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-value">{11 + customModules.length} Active</div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">{customModules.length} Custom Extensions</span>
            <span>Integrated in central layout</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pipeline Throughput</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-amber)' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>99.98%</div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">Optimal SLA</span>
            <span>Sub-20ms event distribution</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Architecture Framework</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-purple)' }}>
              <Server size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '18px' }}>Studio v4.8 Enterprise</div>
          <div className="kpi-footer">
            <span>Stadium Central Specification</span>
          </div>
        </div>
      </div>

      {/* Diagnostics Alert Result Banner */}
      {diagnosticResult && (
        <div 
          className="glass-panel" 
          style={{ 
            marginTop: 14, 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Module Studio Architecture Integrity: 100% HEALTHY
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {diagnosticResult.summary} (Verified {diagnosticResult.totalComponents} components across {diagnosticResult.checkedProcesses} pipelines at {diagnosticResult.timestamp})
              </div>
            </div>
          </div>
          <button 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '4px 10px' }}
            onClick={() => setDiagnosticResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation: Topology vs Extensible Components */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        <button
          className={activeStudioTab === 'topology' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '12px', padding: '6px 14px' }}
          onClick={() => { playChime(); setActiveStudioTab('topology'); }}
        >
          <Workflow size={14} />
          <span>Unified Business Processes Topology</span>
        </button>

        <button
          className={activeStudioTab === 'components' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '12px', padding: '6px 14px' }}
          onClick={() => { playChime(); setActiveStudioTab('components'); }}
        >
          <Database size={14} />
          <span>Custom Operational Components ({customModules.length})</span>
        </button>
      </div>

      {/* VIEW 1: UNIFIED BUSINESS PROCESS TOPOLOGY */}
      {activeStudioTab === 'topology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
          {unifiedProcesses.map(proc => (
            <div 
              key={proc.id} 
              className="glass-panel" 
              style={{ 
                padding: '18px 20px', 
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '8px', 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--accent-cyan)' 
                  }}>
                    <Server size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {proc.name}
                      </h3>
                      <span className="status-badge s_rank" style={{ fontSize: '10px' }}>
                        {proc.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID: {proc.id} • {proc.category} • Protocol: {proc.protocol}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>LATENCY</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{proc.latency}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>INTEGRATION</div>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{proc.syncStatus}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>HEALTH</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{proc.health}%</div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
                {proc.description}
              </p>

              {/* Connected Modules / Components in this process */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Unified Components:
                  </span>
                  {proc.components.map((comp, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        fontSize: '11px', 
                        background: 'var(--bg-input)', 
                        padding: '3px 8px', 
                        borderRadius: 4, 
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {comp}
                    </span>
                  ))}
                </div>

                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Audit synchronized: {proc.lastAudit}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: CUSTOM OPERATIONAL COMPONENTS */}
      {activeStudioTab === 'components' && (
        <div style={{ marginTop: 14 }}>
          {customModules.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: 'var(--accent-cyan)' }}>
                <Database size={24} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>No Custom Operational Components Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '500px', margin: '6px auto 18px auto' }}>
                Architect dynamic relational data tables, tracking matrices, or specialized operational registers within the unified Module Studio architecture.
              </p>
              <button 
                className="btn-primary" 
                onClick={() => { playChime(); setShowCreateModal(true); }}
                style={{ fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>Architect First Component</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {customModules.map(mod => (
                <div key={mod.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 38, 
                        height: 38, 
                        borderRadius: 'var(--radius-md)', 
                        background: 'rgba(56, 189, 248, 0.12)', 
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--accent-cyan)' 
                      }}>
                        <Layers size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          {mod.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {mod.category} • {mod.records ? mod.records.length : 0} Records
                        </span>
                      </div>
                    </div>

                    <button
                      className="action-icon-btn"
                      style={{ width: 30, height: 30, color: 'var(--accent-crimson)' }}
                      onClick={() => handleDeleteModule(mod.id, mod.name)}
                      title="Detach Component"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', minHeight: '38px', margin: 0 }}>
                    {mod.description}
                  </p>

                  {/* Fields pill list */}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                      Active Schema Columns ({mod.fields.length}):
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {mod.fields.map(f => (
                        <span 
                          key={f.key} 
                          style={{ 
                            fontSize: '11px', 
                            background: 'var(--bg-input)', 
                            padding: '2px 8px', 
                            borderRadius: 4, 
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {f.label} <span style={{ color: 'var(--accent-cyan)' }}>({f.type})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Launch Table Button */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 'auto' }}>
                    <button 
                      id={`launch-module-${mod.id}-btn`}
                      className="btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        playChime();
                        setActiveTab(`custom-${mod.id}`);
                      }}
                    >
                      <span>Open Component Data Table</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Architect Module Modal */}
      {showCreateModal && (
        <div className="modal-overlay" id="architect-module-modal">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3>Architect New Unified Operational Component</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModule}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Component Display Name</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      placeholder="e.g. VIP Box Management, Turnstile Telemetry, Stadium Catering Log"
                      value={moduleForm.name}
                      onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Process Category</label>
                    <select 
                      className="form-control"
                      value={moduleForm.category}
                      onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Operational Purpose / Description</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Brief description of this component's role in the centralized architecture..."
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  />
                </div>

                {/* Schema Field Builder */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                        Configure Component Schema Fields
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Define columns and data types for this unified operational component.
                      </p>
                    </div>

                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={addFieldRow}
                    >
                      + Add Schema Column
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {moduleForm.fields.map((field, idx) => (
                      <div key={idx} style={{ 
                        background: 'var(--bg-input)', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.5fr auto', gap: 8, alignItems: 'center' }}>
                          <input 
                            type="text" 
                            required
                            className="form-control"
                            placeholder="Field Label (e.g. Turnstile Sensor ID)"
                            value={field.label}
                            onChange={(e) => updateFieldProperty(idx, 'label', e.target.value)}
                          />

                          <select 
                            className="form-control"
                            value={field.type}
                            onChange={(e) => updateFieldProperty(idx, 'type', e.target.value)}
                          >
                            <option value="text">Text (String)</option>
                            <option value="number">Number (Integer / Float)</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown Selection</option>
                            <option value="checkbox">Checkbox (Boolean)</option>
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input 
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateFieldProperty(idx, 'required', e.target.checked)}
                            />
                            Required
                          </label>

                          <button 
                            type="button" 
                            className="action-icon-btn"
                            style={{ width: 30, height: 30, color: 'var(--accent-crimson)' }}
                            onClick={() => removeFieldRow(idx)}
                            disabled={moduleForm.fields.length <= 1}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {field.type === 'select' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dropdown Options:</span>
                            <input 
                              type="text" 
                              className="form-control"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              placeholder="Comma-separated: Option 1, Option 2, Option 3"
                              value={fieldOptionsText[idx] !== undefined ? fieldOptionsText[idx] : (field.options ? field.options.join(', ') : '')}
                              onChange={(e) => handleOptionsChange(idx, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  id="deploy-custom-module-submit-btn"
                >
                  Deploy Component into Architecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
