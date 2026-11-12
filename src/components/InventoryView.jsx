import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  PlusCircle, 
  MinusCircle, 
  Download, 
  AlertTriangle,
  Tag,
  Scan,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';
import { useModuleTheme } from '../utils/useModuleTheme';

export default function InventoryView({ 
  inventory, 
  setInventory, 
  companyConfig, 
  addAuditLog, 
  searchQuery 
}) {
  const { style: moduleThemeStyle } = useModuleTheme('inventory', companyConfig.moduleThemes);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state for add/edit item
  const [formData, setFormData] = useState({
    name: '',
    category: 'Chakra Tech',
    sku: '',
    stock: 10,
    reorderLevel: 5,
    costPrice: 100,
    sellingPrice: 250,
    unit: 'Units',
    supplier: 'Dimension R&D Lab',
    tags: 'High Value',
    description: ''
  });

  const categories = ['All', 'Chakra Tech', 'Cyber Optics', 'Tactical Armor', 'Armory', 'Robotics', 'Power Supplies'];

  // Filtering
  const filteredItems = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = !q || 
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));
    return matchesCategory && matchesSearch;
  });

  // Quick Scan & Rapid Stock Panel State
  const [quickScanInput, setQuickScanInput] = useState('');
  const [activeScannedItem, setActiveScannedItem] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  // Low stock items detection
  const lowStockItems = inventory.filter(item => item.stock <= item.reorderLevel);

  // Fast Barcode/SKU Scan & Search
  const handleScanSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = quickScanInput.trim().toLowerCase();
    if (!clean) return;

    const matched = inventory.find(item => 
      item.sku.toLowerCase() === clean ||
      item.id.toLowerCase() === clean ||
      item.name.toLowerCase().includes(clean)
    );

    if (matched) {
      playSuccess();
      setActiveScannedItem(matched);
      setScanMessage(`Verified SKU: ${matched.sku} (${matched.name})`);
    } else {
      playChime();
      setScanMessage(`No matching SKU found for "${quickScanInput}". Try entering SKU or product name.`);
    }
  };

  // 1-Tap Rapid Replenishment
  const handleRapidReplenish = (delta) => {
    const targetItem = activeScannedItem || lowStockItems[0] || (filteredItems.length > 0 ? filteredItems[0] : null);
    if (!targetItem) {
      setScanMessage('Select or scan an item to apply rapid replenishment.');
      return;
    }

    adjustStock(targetItem.id, delta);
    setScanMessage(`Rapid Restock: Added +${delta} units to ${targetItem.name} (${targetItem.sku}).`);
  };

  // Restock all low-stock items in 1 click
  const handleRestockAllLow = () => {
    if (lowStockItems.length === 0) {
      setScanMessage('All armory items are adequately stocked above reorder thresholds.');
      return;
    }
    playSuccess();
    setInventory(prev => prev.map(item => {
      if (item.stock <= item.reorderLevel) {
        const replenished = item.stock + 15;
        return {
          ...item,
          stock: replenished,
          status: 'In Stock'
        };
      }
      return item;
    }));
    addAuditLog({
      user: companyConfig.leader,
      action: 'BULK_STOCK_RESTOCK',
      details: `Replenished ${lowStockItems.length} low-stock inventory items (+15 each).`
    });
    setScanMessage(`Bulk Restock: Replenished ${lowStockItems.length} low-stock items (+15 units each).`);
  };

  // Rapid Stock adjustments (+/- 1 or +/- 5)
  const adjustStock = (id, delta) => {
    playSuccess();
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + delta);
        const newStatus = newStock === 0 ? 'Out of Stock' : newStock <= item.reorderLevel ? 'Low Stock' : 'In Stock';
        addAuditLog({
          user: companyConfig.leader,
          action: 'STOCK_ADJUSTMENT',
          details: `Modified stock for '${item.name}' from ${item.stock} to ${newStock} units (${delta > 0 ? '+' : ''}${delta})`
        });
        return { ...item, stock: newStock, status: newStatus };
      }
      return item;
    }));
  };

  const openAddModal = () => {
    playChime();
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Chakra Tech',
      sku: `KMI-SKU-${Math.floor(100 + Math.random() * 900)}`,
      stock: 15,
      reorderLevel: 5,
      costPrice: 200,
      sellingPrice: 480,
      unit: 'Units',
      supplier: 'Dimension R&D Lab',
      tags: 'Classified, Standard Issue',
      description: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    playChime();
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock: item.stock,
      reorderLevel: item.reorderLevel,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      unit: item.unit || 'Units',
      supplier: item.supplier || '',
      tags: item.tags ? item.tags.join(', ') : '',
      description: item.description || ''
    });
    setShowAddModal(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    playSuccess();

    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    const stockNum = Number(formData.stock) || 0;
    const reorderNum = Number(formData.reorderLevel) || 0;
    const status = stockNum === 0 ? 'Out of Stock' : stockNum <= reorderNum ? 'Low Stock' : 'In Stock';

    if (editingItem) {
      // Edit
      setInventory(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            ...formData,
            stock: stockNum,
            reorderLevel: reorderNum,
            costPrice: Number(formData.costPrice) || 0,
            sellingPrice: Number(formData.sellingPrice) || 0,
            tags: tagsArray,
            status
          };
        }
        return item;
      }));
      addAuditLog({
        user: companyConfig.leader,
        action: 'INVENTORY_EDIT',
        details: `Updated product specs for '${formData.name}' (${formData.sku})`
      });
    } else {
      // Add
      const newItem = {
        id: `PROD-${String(inventory.length + 1).padStart(3, '0')}`,
        ...formData,
        stock: stockNum,
        reorderLevel: reorderNum,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        tags: tagsArray,
        status
      };
      setInventory(prev => [newItem, ...prev]);
      addAuditLog({
        user: companyConfig.leader,
        action: 'INVENTORY_ADD',
        details: `Registered new item '${formData.name}' (SKU: ${formData.sku}) in ${formData.category}`
      });
    }

    setShowAddModal(false);
  };

  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Confirm removal of '${name}' from Armory?`)) {
      playSuccess();
      setInventory(prev => prev.filter(i => i.id !== id));
      addAuditLog({
        user: companyConfig.leader,
        action: 'INVENTORY_DELETE',
        details: `Deleted product '${name}' (${id}) from database`
      });
    }
  };

  const exportInventoryCSV = () => {
    playChime();
    const headers = ['ID', 'Name', 'Category', 'SKU', 'Stock', 'ReorderLevel', 'CostPrice', 'SellingPrice', 'Status', 'Supplier'];
    const rows = inventory.map(i => [
      i.id,
      `"${i.name}"`,
      i.category,
      i.sku,
      i.stock,
      i.reorderLevel,
      i.costPrice,
      i.sellingPrice,
      i.status,
      `"${i.supplier || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kamui_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" id="inventory-management-page" style={moduleThemeStyle}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>
            Armory & Inventory Matrix
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Manage classified artifacts, chakra hardware, field consumables, and automated reorder alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            id="export-inventory-csv-btn"
            className="btn-secondary" 
            onClick={exportInventoryCSV}
            title="Download CSV report"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button 
            id="add-inventory-item-btn"
            className="btn-primary" 
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add Armory Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Enlarged Single-Thumb Touch Targets) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn-secondary thumb-touch-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => { playChime(); setSelectedCategory(cat); }}
            style={{
              fontSize: '13px',
              padding: '8px 18px',
              minHeight: '44px',
              borderRadius: 'var(--radius-full)',
              background: selectedCategory === cat ? 'var(--accent-crimson)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
              borderColor: selectedCategory === cat ? 'var(--accent-crimson)' : 'var(--border-subtle)',
              fontWeight: selectedCategory === cat ? 800 : 600,
              flexShrink: 0
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Users: Sticky Action Panel For Fast Inventory Updates & Scanning Operations */}
      <div className="inventory-sticky-action-panel" id="inventory-sticky-action-bar">
        {/* Left: Quick SKU / Barcode Scanner */}
        <form onSubmit={handleScanSubmit} className="inventory-sticky-scanner">
          <Scan size={18} color="var(--accent-crimson)" />
          <input 
            type="text"
            id="quick-sku-scan-input"
            placeholder="Scan SKU, ID, or Item (Press Enter)..."
            value={quickScanInput}
            onChange={(e) => setQuickScanInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn-primary thumb-touch-btn" 
            style={{ padding: '6px 14px', fontSize: '12px', minHeight: '36px' }}
          >
            Scan
          </button>
        </form>

        {/* Center / Right: 1-Tap Rapid Replenishment Presets */}
        <div className="inventory-sticky-presets">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            1-Tap Restock:
          </span>
          <button 
            type="button" 
            className="rapid-restock-pill" 
            onClick={() => handleRapidReplenish(5)}
            title="Rapid Restock +5 Units"
          >
            +5
          </button>
          <button 
            type="button" 
            className="rapid-restock-pill" 
            onClick={() => handleRapidReplenish(10)}
            title="Rapid Restock +10 Units"
          >
            +10
          </button>
          <button 
            type="button" 
            className="rapid-restock-pill" 
            onClick={() => handleRapidReplenish(25)}
            title="Rapid Restock +25 Units"
          >
            +25
          </button>
          <button 
            type="button" 
            className="rapid-restock-pill" 
            onClick={() => handleRapidReplenish(50)}
            title="Rapid Restock +50 Units"
          >
            +50
          </button>

          {/* Quick Restock All Low Button */}
          {lowStockItems.length > 0 && (
            <button
              type="button"
              className="btn-outline-danger thumb-touch-btn"
              onClick={handleRestockAllLow}
              style={{ fontSize: '11.5px', padding: '6px 12px', minHeight: '36px' }}
              title="Replenish all low stock items (+15 each)"
            >
              <Zap size={14} />
              <span>Restock Low ({lowStockItems.length})</span>
            </button>
          )}

          {/* Add Item Quick Button */}
          <button 
            type="button" 
            className="btn-primary thumb-touch-btn" 
            onClick={openAddModal}
            style={{ fontSize: '12px', padding: '6px 14px', minHeight: '36px' }}
          >
            <Plus size={15} />
            <span>Add Item</span>
          </button>
        </div>

        {/* Active scan / feedback ticker */}
        {scanMessage && (
          <div style={{
            width: '100%',
            fontSize: '12px',
            color: 'var(--accent-emerald)',
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} />
              <span>{scanMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => { setScanMessage(''); setActiveScannedItem(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Inventory Data Table */}
      <div className="glass-panel" id="inventory-data-panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID & SKU</th>
                <th>Product Specs</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Quick Adjust</th>
                <th>Cost / Sale</th>
                <th>Total Valuation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No items match the current filter or search query.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLow = item.stock <= item.reorderLevel;
                  const totalVal = item.stock * item.sellingPrice;

                  return (
                    <tr 
                      key={item.id}
                      style={{
                        borderColor: activeScannedItem?.id === item.id ? 'var(--accent-crimson)' : undefined,
                        boxShadow: activeScannedItem?.id === item.id ? '0 0 16px var(--accent-crimson-glow)' : undefined
                      }}
                    >
                      <td data-label="ID & SKU">
                        <span className="table-id-pill">{item.id}</span>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>
                          {item.sku}
                        </div>
                      </td>
                      <td data-label="Product Specs">
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {item.name}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {item.tags && item.tags.map(tag => (
                            <span 
                              key={tag} 
                              style={{ 
                                fontSize: '10px', 
                                background: 'rgba(255,255,255,0.06)', 
                                padding: '1px 6px', 
                                borderRadius: 4, 
                                color: 'var(--text-secondary)' 
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td data-label="Category">
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {item.category}
                        </span>
                      </td>
                      <td data-label="Stock Level">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontSize: '15px', 
                            fontWeight: 800,
                            color: isLow ? '#ef4444' : '#ffffff'
                          }}>
                            {item.stock}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            / min {item.reorderLevel} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td data-label="Quick Adjust">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button 
                            className="action-icon-btn thumb-touch-btn"
                            onClick={() => adjustStock(item.id, -1)}
                            title="Decrease stock (-1)"
                            aria-label="Decrease stock"
                          >
                            <MinusCircle size={16} />
                          </button>
                          <button 
                            className="action-icon-btn thumb-touch-btn"
                            onClick={() => adjustStock(item.id, 1)}
                            title="Increase stock (+1)"
                            aria-label="Increase stock"
                          >
                            <PlusCircle size={16} color="var(--accent-emerald)" />
                          </button>
                          <button 
                            className="btn-secondary thumb-touch-btn"
                            style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 800 }}
                            onClick={() => adjustStock(item.id, 10)}
                            title="Bulk add (+10)"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td data-label="Cost / Sale">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{companyConfig.currency}{item.costPrice}</span>
                          {' / '}
                          <span style={{ color: 'var(--accent-crimson-light)', fontWeight: 700 }}>
                            {companyConfig.currency}{item.sellingPrice}
                          </span>
                        </div>
                      </td>
                      <td data-label="Total Valuation">
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                          {companyConfig.currency}{totalVal.toLocaleString('en-US')}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${item.status === 'In Stock' ? 'in_stock' : item.status === 'Low Stock' ? 'low_stock' : 'overdue'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button 
                            className="action-icon-btn thumb-touch-btn"
                            onClick={() => openEditModal(item)}
                            title="Edit Item Specs"
                            aria-label="Edit Item Specs"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="action-icon-btn thumb-touch-btn"
                            style={{ color: 'var(--accent-crimson)' }}
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Remove from Armory"
                            aria-label="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {showAddModal && (
        <div className="modal-overlay" id="inventory-item-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Armory Artifact Specs' : 'Register New Armory Artifact'}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Item Name / Weapon Spec</label>
                  <input 
                    type="text" 
                    required
                    className="form-control"
                    placeholder="e.g. Kamui Dimensional Transmitter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select 
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>SKU / Serial Code</label>
                    <input 
                      type="text" 
                      required
                      className="form-control"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Stock Qty</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Safety Threshold (Reorder Alert)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="form-control"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cost Price ({companyConfig.currency})</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Selling Price ({companyConfig.currency})</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Unit of Measure</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Units, Boxes, Packs"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Supplier / Foundry</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Dimension R&D Lab"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tags (Comma separated)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Classified, Sentry, High Value"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Technical Description</label>
                  <textarea 
                    rows="2"
                    className="form-control"
                    placeholder="Enter weapon or tech specifications..."
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
                  id="save-inventory-item-submit-btn"
                >
                  {editingItem ? 'Save Modifications' : 'Add to Armory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
