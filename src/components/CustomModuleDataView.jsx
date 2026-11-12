import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Download, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';

export default function CustomModuleDataView({ 
  module, 
  setCustomModules, 
  companyConfig, 
  addAuditLog, 
  searchQuery 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordFormData, setRecordFormData] = useState({});

  if (!module) return null;

  const records = module.records || [];

  // Filter records
  const filteredRecords = records.filter(rec => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) return true;
    return Object.values(rec).some(val => 
      String(val).toLowerCase().includes(q)
    );
  });

  const openAddModal = () => {
    playChime();
    setEditingRecord(null);
    const initial = {};
    module.fields.forEach(f => {
      if (f.type === 'checkbox') initial[f.key] = false;
      else if (f.type === 'select') initial[f.key] = f.options && f.options.length ? f.options[0] : '';
      else if (f.type === 'number') initial[f.key] = 0;
      else if (f.type === 'date') initial[f.key] = new Date().toISOString().slice(0, 10);
      else initial[f.key] = '';
    });
    setRecordFormData(initial);
    setShowAddModal(true);
  };

  const openEditModal = (rec) => {
    playChime();
    setEditingRecord(rec);
    setRecordFormData({ ...rec });
    setShowAddModal(true);
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    playSuccess();

    setCustomModules(prev => prev.map(m => {
      if (m.id === module.id) {
        let updatedRecords;
        if (editingRecord) {
          updatedRecords = m.records.map(r => r.id === editingRecord.id ? { ...recordFormData } : r);
        } else {
          const newRecord = {
            id: `REC-${Date.now().toString().slice(-4)}`,
            ...recordFormData
          };
          updatedRecords = [newRecord, ...(m.records || [])];
        }
        return { ...m, records: updatedRecords };
      }
      return m;
    }));

    addAuditLog({
      user: companyConfig.leader,
      action: editingRecord ? 'CUSTOM_RECORD_EDIT' : 'CUSTOM_RECORD_ADD',
      details: `${editingRecord ? 'Edited' : 'Appended'} record in '${module.name}' dataset`
    });

    setShowAddModal(false);
  };

  const handleDeleteRecord = (recId) => {
    if (window.confirm(`Confirm removal of record ${recId} from ${module.name}?`)) {
      playSuccess();
      setCustomModules(prev => prev.map(m => {
        if (m.id === module.id) {
          return {
            ...m,
            records: (m.records || []).filter(r => r.id !== recId)
          };
        }
        return m;
      }));

      addAuditLog({
        user: companyConfig.leader,
        action: 'CUSTOM_RECORD_DELETE',
        details: `Deleted record ${recId} from '${module.name}'`
      });
    }
  };

  const exportCSV = () => {
    playChime();
    const headers = ['ID', ...module.fields.map(f => f.label)];
    const rows = records.map(r => [
      r.id,
      ...module.fields.map(f => `"${r[f.key] !== undefined ? r[f.key] : ''}"`)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${module.slug}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" id={`custom-module-${module.id}-page`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
              {module.name}
            </h2>
            <span className="status-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)' }}>
              {module.category}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            {module.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn-secondary"
            onClick={exportCSV}
            title="Download CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button 
            id={`add-record-${module.id}-btn`}
            className="btn-primary" 
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add {module.name} Record</span>
          </button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="glass-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                {module.fields.map(field => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={module.fields.length + 2} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No records found in this dataset. Click "Add {module.name} Record" to begin!
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id}>
                    <td data-label="ID">
                      <span className="table-id-pill">{rec.id}</span>
                    </td>
                    {module.fields.map(field => {
                      const val = rec[field.key];

                      return (
                        <td key={field.key} data-label={field.label}>
                          {field.type === 'checkbox' ? (
                            val ? (
                              <span className="status-badge paid" style={{ fontSize: '10px' }}><Check size={11} /> YES</span>
                            ) : (
                              <span className="status-badge overdue" style={{ fontSize: '10px' }}><X size={11} /> NO</span>
                            )
                          ) : field.type === 'select' ? (
                            <span className="status-badge draft" style={{ color: 'var(--text-primary)' }}>
                              {val || '—'}
                            </span>
                          ) : field.type === 'number' ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                              {Number(val).toLocaleString('en-US')}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-primary)' }}>
                              {val || '—'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button 
                          className="action-icon-btn"
                          style={{ width: 30, height: 30 }}
                          onClick={() => openEditModal(rec)}
                          title="Edit Record"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          className="action-icon-btn"
                          style={{ width: 30, height: 30, color: 'var(--accent-crimson)' }}
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Add / Edit Record Modal */}
      {showAddModal && (
        <div className="modal-overlay" id="custom-record-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingRecord ? `Edit ${module.name} Record` : `Add New Entry to ${module.name}`}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecord}>
              <div className="modal-body">
                {module.fields.map(field => (
                  <div key={field.key} className="form-group">
                    <label>
                      {field.label} {field.required && <span style={{ color: 'var(--accent-crimson)' }}>*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select 
                        required={field.required}
                        className="form-control"
                        value={recordFormData[field.key] || ''}
                        onChange={(e) => setRecordFormData({ ...recordFormData, [field.key]: e.target.value })}
                      >
                        {field.options && field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox"
                          checked={Boolean(recordFormData[field.key])}
                          onChange={(e) => setRecordFormData({ ...recordFormData, [field.key]: e.target.checked })}
                        />
                        <span>Enable / Verified for this record</span>
                      </label>
                    ) : field.type === 'date' ? (
                      <input 
                        type="date"
                        required={field.required}
                        className="form-control"
                        value={recordFormData[field.key] || ''}
                        onChange={(e) => setRecordFormData({ ...recordFormData, [field.key]: e.target.value })}
                      />
                    ) : field.type === 'number' ? (
                      <input 
                        type="number"
                        required={field.required}
                        className="form-control"
                        value={recordFormData[field.key] || 0}
                        onChange={(e) => setRecordFormData({ ...recordFormData, [field.key]: Number(e.target.value) })}
                      />
                    ) : (
                      <input 
                        type="text"
                        required={field.required}
                        className="form-control"
                        placeholder={`Enter ${field.label}...`}
                        value={recordFormData[field.key] || ''}
                        onChange={(e) => setRecordFormData({ ...recordFormData, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
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
                  id="save-custom-record-submit-btn"
                >
                  {editingRecord ? 'Save Modifications' : 'Commit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
