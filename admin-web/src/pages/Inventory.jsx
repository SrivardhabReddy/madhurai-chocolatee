import React, { useState, useEffect } from 'react';
import { Boxes, Plus, AlertTriangle, ArrowUpDown, History, Check, X } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Inventory() {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // '', 'low_stock', 'out_of_stock'

  // Modals
  const [restockModal, setRestockModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Forms
  const [restockQty, setRestockQty] = useState('');
  const [restockRef, setRestockRef] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  const [adjustType, setAdjustType] = useState('DAMAGED');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const loadInventory = () => {
    setLoading(true);
    Promise.all([
      adminApi.getInventoryOverview(filter),
      adminApi.getInventoryTransactions()
    ]).then(([ovRes, txRes]) => {
      if (ovRes.success) setOverview(ovRes.data);
      if (txRes.success) setTransactions(txRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !restockQty) return;
    try {
      const res = await adminApi.restock({
        product_id: selectedProduct.product_id,
        quantity: parseInt(restockQty, 10),
        reference_id: restockRef,
        notes: restockNotes
      });
      if (res.success) {
        setRestockModal(false);
        setRestockQty('');
        setRestockRef('');
        setRestockNotes('');
        loadInventory();
      }
    } catch (err) {
      alert(err.message || 'Restock failed.');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQty) return;
    try {
      const res = await adminApi.adjustStock({
        product_id: selectedProduct.product_id,
        adjustment_type: adjustType,
        quantity: parseInt(adjustQty, 10),
        notes: adjustNotes
      });
      if (res.success) {
        setAdjustModal(false);
        setAdjustQty('');
        setAdjustNotes('');
        loadInventory();
      }
    } catch (err) {
      alert(err.message || 'Adjustment failed.');
    }
  };

  return (
    <div>
      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>TOTAL MONITORED PRODUCTS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px' }}>
            {overview?.summary?.totalProducts || 0}
          </div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>LOW STOCK WARNINGS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--warning)', marginTop: '4px' }}>
            {overview?.summary?.lowStockCount || 0}
          </div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>OUT OF STOCK ITEMS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--danger)', marginTop: '4px' }}>
            {overview?.summary?.outOfStockCount || 0}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setFilter('')}
          className={`btn-admin ${filter === '' ? 'btn-admin-dark' : 'btn-admin-outline'} btn-admin-sm`}
        >
          All Inventory
        </button>
        <button
          onClick={() => setFilter('low_stock')}
          className={`btn-admin ${filter === 'low_stock' ? 'btn-admin-dark' : 'btn-admin-outline'} btn-admin-sm`}
        >
          Low Stock Only
        </button>
        <button
          onClick={() => setFilter('out_of_stock')}
          className={`btn-admin ${filter === 'out_of_stock' ? 'btn-admin-dark' : 'btn-admin-outline'} btn-admin-sm`}
        >
          Out of Stock Only
        </button>
      </div>

      {/* Stock Overview Table */}
      <div className="admin-table-container" style={{ marginBottom: '36px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit / Weight</th>
              <th>Current Stock</th>
              <th>Low Stock Threshold</th>
              <th>Status</th>
              <th>Stock Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading stock levels...</td></tr>
            ) : overview?.items?.length > 0 ? (
              overview.items.map(p => (
                <tr key={p.product_id}>
                  <td><strong>{p.product_name}</strong></td>
                  <td>{p.category_name || 'General'}</td>
                  <td>{p.weight} ({p.selling_unit})</td>
                  <td>
                    <strong style={{ fontSize: '1.05rem', color: p.current_stock <= 0 ? 'var(--danger)' : p.current_stock <= p.low_stock_threshold ? 'var(--warning)' : 'var(--admin-text-main)' }}>
                      {p.current_stock}
                    </strong>
                  </td>
                  <td>{p.low_stock_threshold} units</td>
                  <td>
                    <span className={`status-pill ${p.stock_status === 'IN_STOCK' ? 'pill-success' : p.stock_status === 'LOW_STOCK' ? 'pill-warning' : 'pill-danger'}`}>
                      {p.stock_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setSelectedProduct(p); setRestockModal(true); }}
                        className="btn-admin btn-admin-primary btn-admin-sm"
                      >
                        <Plus size={14} />
                        <span>Restock</span>
                      </button>
                      <button
                        onClick={() => { setSelectedProduct(p); setAdjustModal(true); }}
                        className="btn-admin btn-admin-outline btn-admin-sm"
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No items match filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transactions Audit Log Table */}
      <div className="admin-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} style={{ color: 'var(--admin-accent)' }} />
          <span>Warehouse Stock Movement Log (Audit Trail)</span>
        </h3>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>Type</th>
                <th>Delta Qty</th>
                <th>Prev Stock</th>
                <th>New Stock</th>
                <th>Reference</th>
                <th>User / Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                      {new Date(t.created_at).toLocaleString('en-IN')}
                    </td>
                    <td><strong>{t.product_name}</strong></td>
                    <td>
                      <span className={`status-pill ${t.type === 'RESTOCK' ? 'pill-success' : t.type === 'SALE' ? 'pill-info' : t.type === 'CANCELLATION' ? 'pill-warning' : 'pill-danger'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td><strong>{t.type === 'SALE' || t.type === 'DAMAGED' || t.type === 'EXPIRED' ? `-${t.quantity}` : `+${t.quantity}`}</strong></td>
                    <td>{t.previous_stock}</td>
                    <td><strong>{t.new_stock}</strong></td>
                    <td>{t.reference_id || 'N/A'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                      {t.notes} {t.created_by && `(${t.created_by})`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No transaction history recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Restock Inventory</h3>
              <button onClick={() => setRestockModal(false)}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
              Product: <strong>{selectedProduct.product_name}</strong> (Current Stock: {selectedProduct.current_stock})
            </p>

            <form onSubmit={handleRestock}>
              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Quantity to Add *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="admin-input"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Batch Reference / PO Number</label>
                <input
                  type="text"
                  value={restockRef}
                  onChange={(e) => setRestockRef(e.target.value)}
                  placeholder="e.g. BATCH-2026-PB02"
                  className="admin-input"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="admin-label">Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Fresh small batch roasting"
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setRestockModal(false)} className="btn-admin btn-admin-outline">Cancel</button>
                <button type="submit" className="btn-admin btn-admin-primary">Confirm Restock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {adjustModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Stock Adjustment</h3>
              <button onClick={() => setAdjustModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAdjust}>
              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Adjustment Reason *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="admin-select"
                >
                  <option value="DAMAGED">DAMAGED (Reduces stock)</option>
                  <option value="EXPIRED">EXPIRED (Reduces stock)</option>
                  <option value="RETURN">RETURN (Increases stock)</option>
                  <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Units Affected *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 5"
                  className="admin-input"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="admin-label">Audit Notes *</label>
                <textarea
                  required
                  rows="2"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Describe reason for stock variance"
                  className="admin-textarea"
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setAdjustModal(false)} className="btn-admin btn-admin-outline">Cancel</button>
                <button type="submit" className="btn-admin btn-admin-dark">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
