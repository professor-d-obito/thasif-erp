import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield, 
  Trash2, 
  Edit2, 
  LayoutGrid, 
  List, 
  Award,
  Zap
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function OperativesView({ 
  operatives, 
  setOperatives, 
  companyConfig, 
  addAuditLog, 
  searchQuery 
}) {
  const { style: moduleThemeStyle } = useModuleTheme('operatives', companyConfig.moduleThemes);
  const [selectedDept, setSelectedDept] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOperative, setEditingOperative] = useState(null);

  const departments = ['All', 'Executive Strategy', 'Operations & Tactics', 'Cyber Security & Intel', 'Logistics & Analytics', 'Sales & Foreign Relations'];

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    rank: 'Jonin Commander',
    department: 'Operations & Tactics',
    email: '',
    phone: '',
    status: 'Active',
    salary: 120000,
    skills: 'Tactical Planning, Intel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    missionsCompleted: 10
  });

  // Filter
  const filtered = operatives.filter(op => {
    const matchesDept = selectedDept === 'All' || op.department === selectedDept;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q ||
      op.name.toLowerCase().includes(q) ||
      op.role.toLowerCase().includes(q) ||
      op.rank.toLowerCase().includes(q) ||
      op.email.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const totalPayroll = operatives.reduce((acc, curr) => acc + (curr.salary || 0), 0);

  const openAddModal = () => {
    playChime();
    setEditingOperative(null);
    setFormData({
      name: '',
      role: 'Tactical Operations Specialist',
      rank: 'Jonin Commander',
      department: 'Operations & Tactics',
      email: '',
      phone: '+81 90-7777-KUNAI',
      status: 'Active',
      salary: 115000,
      skills: 'Infiltration, Reconnaissance, Cyber Warfare',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      missionsCompleted: 5
    });
    setShowAddModal(true);
  };

  const openEditModal = (op) => {
    playChime();
    setEditingOperative(op);
    setFormData({
      name: op.name,
      role: op.role,
      rank: op.rank,
      department: op.department,
      email: op.email,
      phone: op.phone,
      status: op.status,
      salary: op.salary,
      skills: op.skills ? op.skills.join(', ') : '',
      avatar: op.avatar,
      missionsCompleted: op.missionsCompleted || 0
    });
    setShowAddModal(true);
  };

  const handleSaveOperative = (e) => {
    e.preventDefault();
    playSuccess();

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);

    if (editingOperative) {
      setOperatives(prev => prev.map(op => {
        if (op.id === editingOperative.id) {
          return {
            ...op,
            ...formData,
            salary: Number(formData.salary) || 0,
            skills: skillsArray
          };
        }
        return op;
      }));
      addAuditLog({
        user: companyConfig.leader,
        action: 'OPERATIVE_EDIT',
        details: `Updated dossier for operative '${formData.name}' (${formData.rank})`
      });
    } else {
      const newOp = {
        id: `OP-${String(operatives.length + 1).padStart(3, '0')}`,
        ...formData,
        salary: Number(formData.salary) || 0,
        skills: skillsArray
      };
      setOperatives(prev => [...prev, newOp]);
      addAuditLog({
        user: companyConfig.leader,
        action: 'OPERATIVE_RECRUIT',
        details: `Enlisted new operative '${formData.name}' into ${formData.department} at ${formData.rank}`
      });
    }

    setShowAddModal(false);
  };

  const handleDeleteOperative = (id, name) => {
    if (window.confirm(`Confirm de-registration of operative ${name}?`)) {
      playSuccess();
      setOperatives(prev => prev.filter(op => op.id !== id));
      addAuditLog({
        user: companyConfig.leader,
        action: 'OPERATIVE_DISCHARGE',
        details: `Discharged operative ${name} (${id})`
      });
    }
  };

  return (
    <div className="page-container" id="operatives-hr-page" style={moduleThemeStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            Clan Operatives & Human Resources
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Elite shinobi roster, command hierarchy, mission assignments, and department payroll.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
            <button
              className="action-icon-btn"
              style={{ width: 32, height: 32, border: 'none', background: viewMode === 'grid' ? 'var(--bg-card-hover)' : 'transparent', color: viewMode === 'grid' ? 'var(--accent-crimson)' : 'var(--text-muted)' }}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className="action-icon-btn"
              style={{ width: 32, height: 32, border: 'none', background: viewMode === 'table' ? 'var(--bg-card-hover)' : 'transparent', color: viewMode === 'table' ? 'var(--accent-crimson)' : 'var(--text-muted)' }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>

          <button 
            id="enlist-operative-btn"
            className="btn-primary" 
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Enlist Operative</span>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-title">Total Active Roster</div>
          <div className="kpi-value">{operatives.length} Specialists</div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">100% Operational Capacity</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Annualized Payroll</div>
          <div className="kpi-value" style={{ color: '#ffffff' }}>
            {companyConfig.currency}{totalPayroll.toLocaleString('en-US')}
          </div>
          <div className="kpi-footer">
            <span>Stipends & High-Risk Combat Bonus</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Field Deployment Status</div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {operatives.filter(o => o.status === 'On Mission').length} On Mission
          </div>
          <div className="kpi-footer">
            <span>{operatives.filter(o => o.status === 'Active').length} Garrison / Command Ready</span>
          </div>
        </div>
      </div>

      {/* Department Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {departments.map(dept => (
          <button
            key={dept}
            className={`btn-secondary ${selectedDept === dept ? 'active' : ''}`}
            onClick={() => { playChime(); setSelectedDept(dept); }}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: selectedDept === dept ? 'var(--accent-crimson)' : 'var(--bg-surface)',
              color: selectedDept === dept ? '#ffffff' : 'var(--text-secondary)',
              borderColor: selectedDept === dept ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              fontWeight: selectedDept === dept ? 700 : 500
            }}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filtered.map(op => {
            const isMastermind = op.rank.includes('Mastermind') || op.rank.includes('Kage');

            return (
              <div 
                key={op.id} 
                className="glass-panel" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 14, 
                  position: 'relative',
                  border: isMastermind ? '1px solid var(--accent-crimson)' : '1px solid var(--border-subtle)',
                  boxShadow: isMastermind ? '0 0 20px var(--accent-crimson-glow)' : 'var(--glass-shadow)'
                }}
              >
                {/* Header card info */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <img 
                    src={op.avatar || '/anime/obito_avatar.jpg'} 
                    alt={op.name}
                    style={{ 
                      width: 58, 
                      height: 58, 
                      borderRadius: 'var(--radius-md)', 
                      objectFit: 'cover',
                      border: isMastermind ? '2px solid var(--accent-crimson)' : '1px solid var(--border-accent)'
                    }} 
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="table-id-pill">{op.id}</span>
                      <span className={`status-badge ${op.status === 'Active' ? 'active' : 'pending'}`}>
                        {op.status}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: 3 }}>
                      {op.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-crimson-light)', fontWeight: 600 }}>
                      {op.role}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={14} color="var(--accent-purple)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rank:</span> {op.rank}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={14} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dept:</span> {op.department}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} color="var(--text-muted)" />
                    <span>{op.email}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  {op.skills && op.skills.map(skill => (
                    <span 
                      key={skill}
                      style={{ 
                        fontSize: '11px', 
                        background: 'var(--bg-input)', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer with actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Salary: </span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {companyConfig.currency}{op.salary ? op.salary.toLocaleString('en-US') : '0'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="action-icon-btn" 
                      style={{ width: 30, height: 30 }}
                      onClick={() => openEditModal(op)}
                      title="Edit Dossier"
                    >
                      <Edit2 size={13} />
                    </button>
                    {!isMastermind && (
                      <button 
                        className="action-icon-btn" 
                        style={{ width: 30, height: 30, color: 'var(--accent-crimson)' }}
                        onClick={() => handleDeleteOperative(op.id, op.name)}
                        title="Discharge"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Operative</th>
                  <th>Rank & Role</th>
                  <th>Department</th>
                  <th>Contact Email</th>
                  <th>Status</th>
                  <th>Annual Salary</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(op => (
                  <tr key={op.id}>
                    <td data-label="Operative">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img 
                          src={op.avatar || '/anime/obito_avatar.jpg'} 
                          alt={op.name} 
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{op.name}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{op.id}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Rank & Role">
                      <div style={{ fontWeight: 600, color: 'var(--accent-crimson-light)' }}>{op.rank}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{op.role}</div>
                    </td>
                    <td data-label="Department">{op.department}</td>
                    <td data-label="Contact Email" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{op.email}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${op.status === 'Active' ? 'active' : 'pending'}`}>
                        {op.status}
                      </span>
                    </td>
                    <td data-label="Annual Salary" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                      {companyConfig.currency}{op.salary ? op.salary.toLocaleString('en-US') : '0'}
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button 
                          className="action-icon-btn"
                          style={{ width: 30, height: 30 }}
                          onClick={() => openEditModal(op)}
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Operative Modal */}
      {showAddModal && (
        <div className="modal-overlay" id="operative-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingOperative ? 'Modify Operative Dossier' : 'Enlist New Clan Operative'}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOperative}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Operative Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Rank</label>
                    <select 
                      className="form-control"
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    >
                      <option value="Jonin Commander">Jonin Commander</option>
                      <option value="Special Jonin">Special Jonin</option>
                      <option value="Chunin Strategist">Chunin Strategist</option>
                      <option value="Academy Tech Specialist">Academy Tech Specialist</option>
                      <option value="Kage / Mastermind">Kage / Mastermind</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <select 
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      {departments.filter(d => d !== 'All').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Functional Role / Title</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      placeholder="e.g. Lead Infiltration Architect"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Salary ({companyConfig.currency})</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Skills & Jutsus (Comma separated)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Fire Style, Encryption, Quantum Mechanics"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Avatar Image URL</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  id="save-operative-submit-btn"
                >
                  Save Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
