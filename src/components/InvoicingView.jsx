import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Eye, 
  Printer, 
  CheckCircle, 
  Trash2, 
  Download, 
  Calendar, 
  Building2, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function InvoicingView({ 
  invoices, 
  setInvoices, 
  companyConfig, 
  addAuditLog, 
  searchQuery,
  onRecordTransaction
}) {
  const { style: moduleThemeStyle } = useModuleTheme('invoicing', companyConfig.moduleThemes);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // New Invoice Form state
  const [formData, setFormData] = useState({
    client: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: 'Pending',
    items: [
      { description: 'Kamui Spatial Storage Node v4', quantity: 2, unitPrice: 2850, amount: 5700 }
    ],
    notes: 'Payment required via Subspace Wire or Konoha Bank Transfer.'
  });

  const statuses = ['All', 'Paid', 'Pending', 'Draft', 'Overdue'];

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q ||
      inv.id.toLowerCase().includes(q) ||
      inv.client.toLowerCase().includes(q) ||
      inv.clientEmail.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Calculate metrics
  const totalBilled = invoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.total, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, curr) => acc + curr.total, 0);

  // Open Create Modal
  const openCreateModal = () => {
    playChime();
    setFormData({
      client: '',
      clientEmail: '',
      clientAddress: '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Pending',
      items: [
        { description: 'Chakra Tech Tactical Hardware', quantity: 1, unitPrice: 1500, amount: 1500 }
      ],
      notes: 'Standard payment terms: Net 14 Days. Authenticated by Professor D Obito.'
    });
    setShowCreateModal(true);
  };

  // Line item manipulation
  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unitPrice) || 0;
    updated[index].amount = qty * price;
    setFormData({ ...formData, items: updated });
  };

  const addLineItem = () => {
    playChime();
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: '', quantity: 1, unitPrice: 0, amount: 0 }
      ]
    });
  };

  const removeLineItem = (index) => {
    playChime();
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index)
    });
  };

  // Calculations for current form
  const formSubtotal = formData.items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const formTaxAmount = (formSubtotal * (companyConfig.taxRate / 100));
  const formTotal = formSubtotal + formTaxAmount;

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    playSuccess();

    const newInvoice = {
      id: `INV-2026-${String(invoices.length + 85).padStart(3, '0')}`,
      ...formData,
      subtotal: formSubtotal,
      taxRate: companyConfig.taxRate,
      taxAmount: formTaxAmount,
      total: formTotal
    };

    setInvoices(prev => [newInvoice, ...prev]);

    addAuditLog({
      user: companyConfig.leader,
      action: 'INVOICE_CREATE',
      details: `Generated invoice ${newInvoice.id} for ${formData.client} totaling ${companyConfig.currency}${formTotal.toFixed(2)}`
    });

    setShowCreateModal(false);
  };

  const markInvoicePaid = (inv) => {
    playSuccess();
    setInvoices(prev => prev.map(item => {
      if (item.id === inv.id) {
        return { ...item, status: 'Paid' };
      }
      return item;
    }));

    if (viewingInvoice && viewingInvoice.id === inv.id) {
      setViewingInvoice({ ...viewingInvoice, status: 'Paid' });
    }

    // Auto-record to Treasury Ledger
    onRecordTransaction({
      date: new Date().toISOString().slice(0, 10),
      type: 'Income',
      category: 'Enterprise Sales',
      amount: inv.total,
      reference: inv.id,
      description: `Settlement for Invoice ${inv.id} - ${inv.client}`,
      account: 'Kamui Vault Alpha'
    });

    addAuditLog({
      user: companyConfig.leader,
      action: 'INVOICE_PAID',
      details: `Invoice ${inv.id} marked as Paid. Auto-deposited ${companyConfig.currency}${inv.total.toFixed(2)} to Treasury`
    });
  };

  const handleDeleteInvoice = (id) => {
    if (window.confirm(`Are you sure you want to delete invoice ${id}?`)) {
      playSuccess();
      setInvoices(prev => prev.filter(i => i.id !== id));
      addAuditLog({
        user: companyConfig.leader,
        action: 'INVOICE_DELETE',
        details: `Deleted invoice ${id}`
      });
      if (viewingInvoice && viewingInvoice.id === id) {
        setViewingInvoice(null);
      }
    }
  };

  return (
    <div className="page-container" id="invoicing-billing-page" style={moduleThemeStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            Enterprise Invoices & Billing
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Manage client billing, automated calculations, status pipelines, and official certified receipts.
          </p>
        </div>

        <button 
          id="generate-invoice-btn"
          className="btn-primary" 
          onClick={openCreateModal}
        >
          <Plus size={16} />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-title">Total Billed Lifetime</div>
          <div className="kpi-value">
            {companyConfig.currency}{totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>Across {invoices.length} total orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Settled & Collected</div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            {companyConfig.currency}{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="trend-pill trend-up">Deposited in Treasury</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Pending & Receivables</div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            {companyConfig.currency}{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="trend-pill trend-down">Pending Clearance</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {statuses.map(st => (
          <button
            key={st}
            className={`btn-secondary ${statusFilter === st ? 'active' : ''}`}
            onClick={() => { playChime(); setStatusFilter(st); }}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: statusFilter === st ? 'var(--accent-crimson)' : 'var(--bg-surface)',
              color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
              borderColor: statusFilter === st ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              fontWeight: statusFilter === st ? 700 : 500
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="glass-panel" id="invoices-table-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client Details</th>
                <th>Timeline</th>
                <th>Items Count</th>
                <th>Subtotal</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No invoices match current criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td data-label="Invoice #">
                      <span className="table-id-pill">{inv.id}</span>
                    </td>
                    <td data-label="Client Details">
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.client}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.clientEmail}</div>
                    </td>
                    <td data-label="Timeline">
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Issued: {inv.issueDate}</span>
                        <br />
                        <span style={{ color: inv.status === 'Overdue' ? '#ef4444' : 'var(--text-muted)' }}>
                          Due: {inv.dueDate}
                        </span>
                      </div>
                    </td>
                    <td data-label="Items Count">
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {inv.items.length} Line(s)
                      </span>
                    </td>
                    <td data-label="Subtotal">
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {companyConfig.currency}{inv.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td data-label="Grand Total">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>
                        {companyConfig.currency}{inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button 
                          className="action-icon-btn thumb-touch-btn"
                          onClick={() => { playChime(); setViewingInvoice(inv); }}
                          title="View Certified Invoice Document"
                          aria-label="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        {inv.status !== 'Paid' && (
                          <button 
                            className="action-icon-btn thumb-touch-btn"
                            style={{ color: 'var(--accent-emerald)' }}
                            onClick={() => markInvoicePaid(inv)}
                            title="Mark as Paid & Deposit to Treasury"
                            aria-label="Mark Paid"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button 
                          className="action-icon-btn thumb-touch-btn"
                          style={{ color: 'var(--accent-crimson)' }}
                          onClick={() => handleDeleteInvoice(inv.id)}
                          title="Delete Invoice"
                          aria-label="Delete Invoice"
                        >
                          <Trash2 size={16} />
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

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay" id="create-invoice-modal">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3>Generate Official Enterprise Invoice</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInvoice}>
              <div className="modal-body">
                {/* Client info */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Client / Organization Name</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      placeholder="e.g. Leaf Shinobi Tech Corp"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Client Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="form-control"
                      placeholder="billing@client.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Client Billing Address / Compound</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Citadel Tower 9, Upper District"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input 
                      type="date" 
                      required
                      className="form-control"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input 
                      type="date" 
                      required
                      className="form-control"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dynamic Line items */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      Invoice Line Items
                    </label>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={addLineItem}
                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr auto', gap: 8, alignItems: 'center' }}>
                        <input 
                          type="text" 
                          required
                          className="form-control"
                          placeholder="Item description / service"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        />
                        <input 
                          type="number" 
                          min="1"
                          required
                          className="form-control"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          required
                          className="form-control"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        />
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#ffffff', textAlign: 'right', paddingRight: 4 }}>
                          {companyConfig.currency}{item.amount.toFixed(2)}
                        </div>
                        <button 
                          type="button" 
                          className="action-icon-btn"
                          style={{ width: 32, height: 32, color: 'var(--accent-crimson)' }}
                          onClick={() => removeLineItem(idx)}
                          disabled={formData.items.length <= 1}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Summary */}
                <div style={{ 
                  background: 'var(--bg-input)', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-subtle)',
                  marginTop: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{companyConfig.currency}{formSubtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Tax ({companyConfig.taxRate}%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{companyConfig.currency}{formTaxAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '16px', 
                    fontWeight: 800, 
                    color: '#ffffff', 
                    borderTop: '1px solid var(--border-subtle)', 
                    paddingTop: 8 
                  }}>
                    <span>Grand Total:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-crimson-light)' }}>
                      {companyConfig.currency}{formTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes & Terms</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
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
                  id="save-invoice-submit-btn"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certified Invoice View Modal */}
      {viewingInvoice && (
        <div className="modal-overlay" id="view-invoice-modal">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            {/* Top Toolbar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 24px', 
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`status-badge ${viewingInvoice.status.toLowerCase()}`}>
                  {viewingInvoice.status}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                  {viewingInvoice.id}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {viewingInvoice.status !== 'Paid' && (
                  <button 
                    className="btn-primary" 
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => markInvoicePaid(viewingInvoice)}
                  >
                    <CheckCircle size={14} />
                    <span>Settle & Mark Paid</span>
                  </button>
                )}
                <button 
                  className="btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print Document</span>
                </button>
                <button 
                  onClick={() => setViewingInvoice(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div style={{ padding: '36px', background: '#ffffff', color: '#0f172a', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img 
                    src={companyConfig.logoUrl || '/anime/obito_avatar.jpg'} 
                    alt="Logo" 
                    style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '2px solid #ff2a5f' }}
                  />
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
                      {companyConfig.name}
                    </h1>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {companyConfig.subtitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                      Grand Mastermind: {companyConfig.leader}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ff2a5f', textTransform: 'uppercase' }}>
                    INVOICE
                  </h2>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    #{viewingInvoice.id}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                    Date: {viewingInvoice.issueDate}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e11d48', fontWeight: 600 }}>
                    Payment Due: {viewingInvoice.dueDate}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '24px 0' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.8px' }}>
                    BILLED TO:
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {viewingInvoice.client}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    {viewingInvoice.clientEmail}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: 2 }}>
                    {viewingInvoice.clientAddress || 'Global Shinobi Outpost'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.8px' }}>
                    PAYMENT CLEARANCE STATUS:
                  </div>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '4px 12px', 
                    borderRadius: 999, 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    marginTop: 6,
                    background: viewingInvoice.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                    color: viewingInvoice.status === 'Paid' ? '#15803d' : '#b45309'
                  }}>
                    {viewingInvoice.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', color: '#475569', fontWeight: 700 }}>Description</th>
                    <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: '12px', color: '#475569', fontWeight: 700 }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', color: '#475569', fontWeight: 700 }}>Unit Price</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', color: '#475569', fontWeight: 700 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                        {companyConfig.currency}{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>
                        {companyConfig.currency}{Number(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{companyConfig.currency}{viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Tax ({viewingInvoice.taxRate}%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{companyConfig.currency}{viewingInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '16px', 
                    fontWeight: 900, 
                    color: '#0f172a',
                    borderTop: '2px solid #e2e8f0',
                    paddingTop: '8px'
                  }}>
                    <span>Grand Total:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#e11d48' }}>
                      {companyConfig.currency}{viewingInvoice.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mastermind Seal & Signoff */}
              <div style={{ 
                marginTop: '40px', 
                paddingTop: '24px', 
                borderTop: '1px dashed #cbd5e1', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Official Mastermind Clearance
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#e11d48', marginTop: 4, fontFamily: 'var(--font-display)' }}>
                    PROFESSOR D OBITO // SEALED
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {viewingInvoice.notes || 'Authenticated under Crimson Protocol.'}
                  </div>
                </div>

                <div style={{ 
                  border: '2px solid #e11d48', 
                  borderRadius: '50%', 
                  width: 76, 
                  height: 76, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transform: 'rotate(-12deg)',
                  color: '#e11d48',
                  boxShadow: '0 0 10px rgba(225, 29, 72, 0.2)'
                }}>
                  <div style={{ fontSize: '9px', fontWeight: 900 }}>KAMUI</div>
                  <div style={{ fontSize: '14px', fontWeight: 900 }}>D.O</div>
                  <div style={{ fontSize: '8px', fontWeight: 700 }}>CERTIFIED</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
