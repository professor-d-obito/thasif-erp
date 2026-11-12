import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  DollarSign, 
  CreditCard,
  PieChart
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function FinanceView({ 
  transactions, 
  setTransactions, 
  companyConfig, 
  addAuditLog, 
  searchQuery 
}) {
  const { style: moduleThemeStyle } = useModuleTheme('finance', companyConfig.moduleThemes);
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'Income',
    category: 'Enterprise Sales',
    amount: 5000,
    reference: `TRX-${Math.floor(100 + Math.random() * 900)}`,
    account: 'Kamui Vault Alpha',
    description: ''
  });

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0';

  // Filter list
  const filtered = transactions.filter(t => {
    const matchesType = typeFilter === 'All' || t.type === typeFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q ||
      t.id.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    playSuccess();

    const newTrx = {
      id: `TRX-${String(transactions.length + 907).padStart(3, '0')}`,
      ...formData,
      amount: Number(formData.amount) || 0
    };

    setTransactions(prev => [newTrx, ...prev]);

    addAuditLog({
      user: companyConfig.leader,
      action: 'TREASURY_TRANSACTION',
      details: `Logged ${formData.type} of ${companyConfig.currency}${newTrx.amount.toFixed(2)} under ${formData.category}`
    });

    setShowAddModal(false);
  };

  const exportLedgerCSV = () => {
    playChime();
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Reference', 'Account', 'Description'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category}"`,
      t.amount,
      `"${t.reference}"`,
      `"${t.account}"`,
      `"${t.description}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kamui_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" id="finance-treasury-page" style={moduleThemeStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            Treasury & Financial Ledger
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Real-time cashflow management, capital allocation, operational burn rate, and profit telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            id="export-ledger-csv-btn"
            className="btn-secondary"
            onClick={exportLedgerCSV}
          >
            <Download size={15} />
            <span>Export Ledger CSV</span>
          </button>
          <button 
            id="record-transaction-btn"
            className="btn-primary" 
            onClick={() => { playChime(); setShowAddModal(true); }}
          >
            <Plus size={16} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Gross Inflow (Income)</span>
            <div className="kpi-icon-wrap" style={{ color: '#34d399' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            {companyConfig.currency}{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">Sales & Licenses</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Gross Outflow (Expenses)</span>
            <div className="kpi-icon-wrap" style={{ color: '#f87171' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#f87171' }}>
            {companyConfig.currency}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="trend-pill trend-down">R&D & Payroll</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Liquid Surplus</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--accent-crimson)' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#ffffff' }}>
            {companyConfig.currency}{netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">{profitMargin}% Margin</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['All', 'Income', 'Expense'].map(type => (
          <button
            key={type}
            className={`btn-secondary ${typeFilter === type ? 'active' : ''}`}
            onClick={() => { playChime(); setTypeFilter(type); }}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: typeFilter === type ? 'var(--accent-crimson)' : 'var(--bg-surface)',
              color: typeFilter === type ? '#ffffff' : 'var(--text-secondary)',
              borderColor: typeFilter === type ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              fontWeight: typeFilter === type ? 700 : 500
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" id="transactions-ledger-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Execution Date</th>
                <th>Flow Type</th>
                <th>Category</th>
                <th>Reference #</th>
                <th>Account Vault</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No financial records match this query.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td data-label="ID">
                      <span className="table-id-pill">{t.id}</span>
                    </td>
                    <td data-label="Execution Date" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{t.date}</td>
                    <td data-label="Flow Type">
                      <span className={`status-badge ${t.type === 'Income' ? 'paid' : 'overdue'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td data-label="Category" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.category}</td>
                    <td data-label="Reference #" style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>{t.reference}</td>
                    <td data-label="Account Vault" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.account}</td>
                    <td data-label="Description" style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{t.description}</td>
                    <td data-label="Amount" style={{ 
                      textAlign: 'right', 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 800, 
                      fontSize: '13.5px',
                      color: t.type === 'Income' ? '#34d399' : '#f87171' 
                    }}>
                      {t.type === 'Income' ? '+' : '-'}{companyConfig.currency}{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay" id="record-transaction-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Treasury Transaction</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Transaction Type</label>
                    <select 
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Income">Income (+)</option>
                      <option value="Expense">Expense (-)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Amount ({companyConfig.currency})</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      required
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      placeholder="e.g. Enterprise Sales, R&D Operations"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      required
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Reference / Invoice #</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Account / Vault</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.account}
                      onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Memo / Description</label>
                  <textarea 
                    rows="2"
                    className="form-control"
                    placeholder="Enter transaction details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
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
                  id="save-transaction-submit-btn"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
