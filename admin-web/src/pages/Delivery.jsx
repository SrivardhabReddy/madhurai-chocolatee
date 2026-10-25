import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Plus, Trash2, Edit2, Sliders, CheckCircle, X, Upload } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export default function Delivery() {
  const [activeTab, setActiveTab] = useState('area-limit'); // 'area-limit', 'rules', 'pincodes', 'zones', 'settings'
  const [rules, setRules] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [zones, setZones] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Delivery Area Limit State
  const [areaLimitForm, setAreaLimitForm] = useState({
    active: true,
    limitCity: 'Nellore & Gudur',
    allowedCities: 'Gudur, Nellore, Tirupati, Sullurpeta, Naidupeta, Kavali, Chennai, Bengaluru, Hyderabad, Madurai',
    bannerText: '🚚 Handcrafted Fresh Chocolates: Express Delivery available across Gudur, Nellore & South India Hubs!',
    preset: 'UPTO_NELLORE'
  });
  const [savingAreaLimit, setSavingAreaLimit] = useState(false);
  const [areaLimitSuccess, setAreaLimitSuccess] = useState('');
  const [testPin, setTestPin] = useState('524101');
  const [testPinResult, setTestPinResult] = useState(null);
  const [testingPin, setTestingPin] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [showRawAreaText, setShowRawAreaText] = useState(false);

  const getAreasList = () => {
    return (areaLimitForm.allowedCities || '')
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
  };

  const handleAddArea = (areaName) => {
    const toAdd = (areaName || newAreaInput).trim();
    if (!toAdd) return;
    
    // Support comma separated inputs
    const parts = toAdd.split(',').map(p => p.trim()).filter(Boolean);
    const current = getAreasList();
    const updated = [...current];
    
    parts.forEach(part => {
      if (!updated.some(a => a.toLowerCase() === part.toLowerCase())) {
        updated.push(part);
      }
    });

    setAreaLimitForm(prev => ({
      ...prev,
      allowedCities: updated.join(', '),
      preset: 'CUSTOM'
    }));
    setNewAreaInput('');
  };

  const handleRemoveArea = (areaToRemove) => {
    const current = getAreasList();
    const updated = current.filter(a => a.toLowerCase() !== areaToRemove.toLowerCase());
    setAreaLimitForm(prev => ({
      ...prev,
      allowedCities: updated.join(', '),
      preset: 'CUSTOM'
    }));
  };

  const handleClearAllAreas = () => {
    if (window.confirm('Clear all allowed delivery area names?')) {
      setAreaLimitForm(prev => ({
        ...prev,
        allowedCities: '',
        preset: 'CUSTOM'
      }));
    }
  };

  // Search & Filters
  const [pinSearch, setPinSearch] = useState('');

  // Rule Form Modal
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    rule_type: 'QUANTITY', // 'QUANTITY', 'ORDER_VALUE', 'PINCODE', 'AREA', 'PRODUCT'
    condition_field: 'quantity',
    operator: '>=',
    condition_value: '5',
    delivery_charge: '0',
    free_delivery: 1,
    priority: 4,
    description: ''
  });

  // Pincode Form Modal
  const [pincodeModal, setPincodeModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);
  const [pinForm, setPinForm] = useState({
    pincode: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    zone_id: '',
    is_serviceable: 1,
    cod_available: 1,
    delivery_charge: '40',
    min_delivery_days: '2',
    max_delivery_days: '5'
  });

  // Bulk Pincode Modal
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      adminApi.getDeliveryRules(),
      adminApi.getPincodes({ q: pinSearch }),
      adminApi.getZones(),
      adminApi.getDeliverySettings()
    ]).then(([rRes, pRes, zRes, sRes]) => {
      if (rRes.success) setRules(rRes.data);
      if (pRes.success) setPincodes(pRes.data);
      if (zRes.success) setZones(zRes.data);
      if (sRes.success) {
        const sMap = sRes.data.reduce((acc, s) => { acc[s.setting_key] = s.setting_value; return acc; }, {});
        setSettings(sMap);
        setAreaLimitForm({
          active: sMap.delivery_area_limit_active !== 'false',
          limitCity: sMap.delivery_area_limit_city || 'Nellore',
          allowedCities: sMap.delivery_allowed_cities || 'Nellore, Madurai, Chennai, Bengaluru, Hyderabad',
          bannerText: sMap.delivery_area_banner_text || '🚚 Handcrafted Fresh Cacao: Express Delivery available up to Nellore (AP) & South India Hubs!',
          preset: sMap.delivery_area_preset || 'UPTO_NELLORE'
        });
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [pinSearch]);

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await adminApi.updateDeliveryRule(editingRule.id, ruleForm);
      } else {
        await adminApi.createDeliveryRule(ruleForm);
      }
      setRuleModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save delivery rule.');
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Delete this delivery rule?')) {
      await adminApi.deleteDeliveryRule(id);
      loadData();
    }
  };

  const handleSavePincode = async (e) => {
    e.preventDefault();
    try {
      if (editingPincode) {
        await adminApi.updatePincode(editingPincode.id, pinForm);
      } else {
        await adminApi.createPincode(pinForm);
      }
      setPincodeModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save pincode.');
    }
  };

  const handleDeletePincode = async (id) => {
    if (window.confirm('Delete this pincode record?')) {
      await adminApi.deletePincode(id);
      loadData();
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    // Parse CSV-like format: Pincode, City, State
    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const parsed = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        pincode: parts[0],
        city: parts[1] || 'City',
        state: parts[2] || 'State',
        delivery_charge: 40,
        min_delivery_days: 2,
        max_delivery_days: 5
      };
    }).filter(p => p.pincode && p.pincode.length === 6);

    try {
      const res = await adminApi.bulkImportPincodes(parsed);
      alert(res.message);
      setBulkModal(false);
      setBulkText('');
      loadData();
    } catch (err) {
      alert(err.message || 'Import failed.');
    }
  };

  const handleSaveAreaLimit = async (e) => {
    if (e) e.preventDefault();
    setSavingAreaLimit(true);
    setAreaLimitSuccess('');
    try {
      await adminApi.updateDeliverySettings({
        delivery_area_limit_active: areaLimitForm.active ? 'true' : 'false',
        delivery_area_limit_city: areaLimitForm.limitCity.trim(),
        delivery_allowed_cities: areaLimitForm.allowedCities.trim(),
        delivery_area_banner_text: areaLimitForm.bannerText.trim(),
        delivery_area_preset: areaLimitForm.preset
      });
      setAreaLimitSuccess('Delivery boundary limit successfully saved and applied!');
      setTimeout(() => setAreaLimitSuccess(''), 5000);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update delivery area limit.');
    } finally {
      setSavingAreaLimit(false);
    }
  };

  const applyPreset = (presetKey) => {
    if (presetKey === 'UPTO_NELLORE') {
      setAreaLimitForm(prev => ({
        ...prev,
        active: true,
        limitCity: 'Nellore & Gudur',
        allowedCities: 'Gudur, Nellore, Tirupati, Sullurpeta, Naidupeta, Kavali, Chennai, Bengaluru, Hyderabad, Madurai',
        bannerText: '🚚 Handcrafted Fresh Chocolates: Express Delivery available across Gudur, Nellore & South India Hubs!',
        preset: 'UPTO_NELLORE'
      }));
    } else if (presetKey === 'GUDUR_LOCAL') {
      setAreaLimitForm(prev => ({
        ...prev,
        active: true,
        limitCity: 'Gudur & Nellore District',
        allowedCities: 'Gudur, Nellore, Tirupati, Sullurpeta, Naidupeta, Kavali, Venkatagiri',
        bannerText: '🚚 Local Dispatch: Fresh direct confectionery delivery across Gudur, Nellore & neighboring towns!',
        preset: 'GUDUR_LOCAL'
      }));
    } else if (presetKey === 'TAMIL_NADU') {
      setAreaLimitForm(prev => ({
        ...prev,
        active: true,
        limitCity: 'Tamil Nadu',
        allowedCities: 'Madurai, Chennai, Coimbatore, Salem, Trichy',
        bannerText: '🚚 State-wide Delivery: Handcrafted Chocolates delivered across Tamil Nadu!',
        preset: 'TAMIL_NADU'
      }));
    } else if (presetKey === 'ALL_INDIA') {
      setAreaLimitForm(prev => ({
        ...prev,
        active: false,
        limitCity: 'All India',
        allowedCities: 'All India',
        bannerText: '🚚 Pan-India Shipping: Delivering Artisanal Chocolates Nationwide!',
        preset: 'ALL_INDIA'
      }));
    }
  };

  const handleTestPincode = async () => {
    if (!testPin) return;
    setTestingPin(true);
    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: testPin })
      });
      const data = await res.json();
      setTestPinResult(data.data || data);
    } catch (err) {
      setTestPinResult({ serviceable: false, reason: 'Error checking pincode.' });
    } finally {
      setTestingPin(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateDeliverySettings(settings);
      alert('Global delivery defaults saved successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update settings.');
    }
  };

  return (
    <div>
      {/* Sub-navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('area-limit')}
          className={`btn-admin ${activeTab === 'area-limit' ? 'btn-admin-primary' : 'btn-admin-outline'}`}
        >
          <Truck size={16} />
          <span>📍 Delivery Area Limit (Upto Nellore)</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`btn-admin ${activeTab === 'rules' ? 'btn-admin-dark' : 'btn-admin-outline'}`}
        >
          <Sliders size={16} />
          <span>Rule Builder Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('pincodes')}
          className={`btn-admin ${activeTab === 'pincodes' ? 'btn-admin-dark' : 'btn-admin-outline'}`}
        >
          <MapPin size={16} />
          <span>Pincodes & Serviceability ({pincodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`btn-admin ${activeTab === 'zones' ? 'btn-admin-dark' : 'btn-admin-outline'}`}
        >
          <Truck size={16} />
          <span>Delivery Zones ({zones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`btn-admin ${activeTab === 'settings' ? 'btn-admin-dark' : 'btn-admin-outline'}`}
        >
          Global Delivery Defaults
        </button>
      </div>

      {/* Tab 0: Delivery Area Limit & Boundary Configuration */}
      {activeTab === 'area-limit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '30px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                  Geographic Delivery Area Limit
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>
                  Define maximum delivery boundaries (e.g. deliver up to Nellore or customize allowed cities).
                </p>
              </div>
              <span className={`status-pill ${areaLimitForm.active ? 'pill-success' : 'pill-neutral'}`}>
                {areaLimitForm.active ? `BOUNDARY ACTIVE: UPTO ${areaLimitForm.limitCity.toUpperCase()}` : 'PAN-INDIA (NO LIMIT)'}
              </span>
            </div>

            {areaLimitSuccess && (
              <div style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: '600' }}>
                ✅ {areaLimitSuccess}
              </div>
            )}

            <form onSubmit={handleSaveAreaLimit}>
              {/* Presets */}
              <div style={{ marginBottom: '18px' }}>
                <label className="admin-label" style={{ fontWeight: '700' }}>Quick Presets</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => applyPreset('UPTO_NELLORE')}
                    className={`btn-admin btn-admin-sm ${areaLimitForm.preset === 'UPTO_NELLORE' ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                  >
                    🌟 Upto Nellore & Gudur (South Metro Hubs)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('GUDUR_LOCAL')}
                    className={`btn-admin btn-admin-sm ${areaLimitForm.preset === 'GUDUR_LOCAL' ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                  >
                    📍 Gudur & Nellore District Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('TAMIL_NADU')}
                    className={`btn-admin btn-admin-sm ${areaLimitForm.preset === 'TAMIL_NADU' ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                  >
                    🏙️ Tamil Nadu State Only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ALL_INDIA')}
                    className={`btn-admin btn-admin-sm ${areaLimitForm.preset === 'ALL_INDIA' ? 'btn-admin-primary' : 'btn-admin-outline'}`}
                  >
                    🇮🇳 All India (Unrestricted)
                  </button>
                </div>
              </div>

              {/* Toggle Limit */}
              <div style={{ marginBottom: '18px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={areaLimitForm.active}
                    onChange={(e) => setAreaLimitForm({ ...areaLimitForm, active: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Enforce Delivery Area Limit</span>
                </label>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginLeft: '28px', marginTop: '4px' }}>
                  When enabled, customers can only order if their delivery pincode falls within the allowed cities / boundary.
                </div>
              </div>

              {/* Max Boundary City */}
              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Maximum Delivery Boundary City / Region *</label>
                <input
                  type="text"
                  required
                  value={areaLimitForm.limitCity}
                  onChange={(e) => setAreaLimitForm({ ...areaLimitForm, limitCity: e.target.value, preset: 'CUSTOM' })}
                  className="admin-input"
                  placeholder="e.g. Nellore or Gudur"
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                  This label is shown in messages to customers (e.g. &quot;We deliver up to Nellore&quot;).
                </div>
              </div>

              {/* Allowed Serviceable Areas & City Names */}
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <label className="admin-label" style={{ fontWeight: '700', marginBottom: 0 }}>
                    🎯 Allowed Serviceable Areas &amp; Cities ({getAreasList().length} Areas Configured)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowRawAreaText(!showRawAreaText)}
                      className="btn-admin btn-admin-outline btn-admin-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {showRawAreaText ? '🏷️ Switch to Tag View' : '📝 Edit Raw Text'}
                    </button>
                    {getAreasList().length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllAreas}
                        className="btn-admin btn-admin-danger btn-admin-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Area Input Bar */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArea();
                      }
                    }}
                    className="admin-input"
                    placeholder="Type area or city name (e.g. Gudur, Nellore, Tirupati, Sullurpeta, Naidupeta, Kavali)"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddArea()}
                    className="btn-admin btn-admin-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} />
                    <span>Add Area</span>
                  </button>
                </div>

                {/* Quick 1-Click Suggestions */}
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Quick 1-Click Add Suggestions:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      'Gudur', 'Nellore', 'Tirupati', 'Sullurpeta', 'Naidupeta', 
                      'Kavali', 'Venkatagiri', 'Chennai', 'Vijayawada', 'Hyderabad', 'Bengaluru', 'Madurai'
                    ].map(city => {
                      const isAdded = getAreasList().some(a => a.toLowerCase() === city.toLowerCase());
                      return (
                        <button
                          key={city}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddArea(city)}
                          className="btn-admin btn-admin-outline btn-admin-sm"
                          style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            backgroundColor: isAdded ? '#E2E8F0' : '#FFFFFF',
                            color: isAdded ? '#94A3B8' : '#334155',
                            cursor: isAdded ? 'default' : 'pointer'
                          }}
                        >
                          {isAdded ? `✓ ${city}` : `+ ${city}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display Mode: Tags or Raw Text */}
                {showRawAreaText ? (
                  <div>
                    <textarea
                      rows="3"
                      value={areaLimitForm.allowedCities}
                      onChange={(e) => setAreaLimitForm({ ...areaLimitForm, allowedCities: e.target.value, preset: 'CUSTOM' })}
                      className="admin-textarea"
                      placeholder="e.g. Gudur, Nellore, Tirupati, Chennai..."
                    ></textarea>
                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                      Enter comma-separated area or city names.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    minHeight: '70px',
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1.5px dashed #CBD5E1',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {getAreasList().length === 0 ? (
                      <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        No area names added yet. Use the input above or click a suggestion to add delivery areas.
                      </span>
                    ) : (
                      getAreasList().map((area, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#FEF3C7',
                            border: '1px solid #FCD34D',
                            color: '#92400E',
                            padding: '5px 10px',
                            borderRadius: '16px',
                            fontSize: '0.84rem',
                            fontWeight: '600'
                          }}
                        >
                          <MapPin size={12} style={{ color: '#D97706' }} />
                          <span>{area}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveArea(area)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0 2px',
                              color: '#B45309',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={`Remove ${area}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                )}

                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                  Orders with delivery addresses in any of these areas/cities will be permitted. All other areas outside this list will be politely informed of the delivery limit.
                </div>
              </div>

              {/* Banner Text */}
              <div style={{ marginBottom: '22px' }}>
                <label className="admin-label">Customer Storefront Announcement Banner</label>
                <input
                  type="text"
                  value={areaLimitForm.bannerText}
                  onChange={(e) => setAreaLimitForm({ ...areaLimitForm, bannerText: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. 🚚 Express Delivery available up to Nellore!"
                />
              </div>

              <button
                type="submit"
                disabled={savingAreaLimit}
                className="btn-admin btn-admin-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {savingAreaLimit ? 'Saving Delivery Area Limit...' : 'Save & Enforce Delivery Area Limit'}
              </button>
            </form>
          </div>

          {/* Live Simulator & Overview */}
          <div>
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px' }}>
                🔍 Test Pincode Against Active Limit
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', marginBottom: '14px' }}>
                Test any pincode to see the exact real-time response a customer will see on the website.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  value={testPin}
                  maxLength={6}
                  onChange={(e) => setTestPin(e.target.value)}
                  className="admin-input"
                  placeholder="Enter Pincode (e.g. 524001)"
                />
                <button
                  type="button"
                  onClick={handleTestPincode}
                  disabled={testingPin}
                  className="btn-admin btn-admin-dark"
                >
                  {testingPin ? 'Checking...' : 'Test'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => { setTestPin('524101'); setTimeout(handleTestPincode, 50); }}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                >
                  📍 Gudur (524101)
                </button>
                <button
                  type="button"
                  onClick={() => { setTestPin('524001'); setTimeout(handleTestPincode, 50); }}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                >
                  Nellore (524001)
                </button>
                <button
                  type="button"
                  onClick={() => { setTestPin('517501'); setTimeout(handleTestPincode, 50); }}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                >
                  Tirupati (517501)
                </button>
                <button
                  type="button"
                  onClick={() => { setTestPin('600001'); setTimeout(handleTestPincode, 50); }}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                >
                  Chennai (600001)
                </button>
                <button
                  type="button"
                  onClick={() => { setTestPin('625001'); setTimeout(handleTestPincode, 50); }}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                >
                  Madurai (625001)
                </button>
                <button
                  type="button"
                  onClick={() => { setTestPin('400001'); setTimeout(handleTestPincode, 50); }}
                  className="btn-admin btn-admin-outline btn-admin-sm"
                >
                  Mumbai (400001)
                </button>
              </div>

              {testPinResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: testPinResult.serviceable ? '#F0FDF4' : '#FEF2F2',
                  border: `1.5px solid ${testPinResult.serviceable ? '#86EFAC' : '#FECACA'}`,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: '700', color: testPinResult.serviceable ? '#166534' : '#991B1B', marginBottom: '4px' }}>
                    {testPinResult.serviceable ? '✅ Serviceable (Within Limit)' : '❌ Not Serviceable (Beyond Limit)'}
                  </div>
                  {testPinResult.serviceable ? (
                    <div>
                      <div>Location: <strong>{testPinResult.city}, {testPinResult.state}</strong></div>
                      <div>Charge: <strong>{testPinResult.freeDelivery ? 'FREE' : `₹${testPinResult.deliveryCharge}`}</strong></div>
                      <div style={{ color: '#166534', marginTop: '4px' }}>{testPinResult.areaLimitNotice}</div>
                    </div>
                  ) : (
                    <div style={{ color: '#991B1B' }}>
                      {testPinResult.reason}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="admin-card">
              <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px' }}>
                💡 How the Delivery Limit Works
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)', lineHeight: '1.6' }}>
                <li>When set to <strong>Upto Nellore</strong>, orders and pincodes in Nellore (524001, 524002, 524003), Madurai, Chennai, etc. proceed seamlessly.</li>
                <li>Locations outside the active boundary are politely restricted at both the Pincode Checker and Checkout page.</li>
                <li>You can change the boundary to any city (e.g. Vijayawada, Coimbatore) or switch to All India anytime with 1 click.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Delivery Rule Builder Engine */}
      {activeTab === 'rules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Active Delivery & Free Delivery Rules</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                Evaluated in strict priority order (1 = Highest, e.g. Product rule overrides Global defaults)
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRule(null);
                setRuleForm({
                  name: '',
                  rule_type: 'QUANTITY',
                  condition_field: 'quantity',
                  operator: '>=',
                  condition_value: '5',
                  delivery_charge: '0',
                  free_delivery: 1,
                  priority: 4,
                  description: ''
                });
                setRuleModal(true);
              }}
              className="btn-admin btn-admin-primary"
            >
              <Plus size={16} />
              <span>Add Custom Delivery Rule</span>
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Rule Name</th>
                  <th>Type</th>
                  <th>Condition</th>
                  <th>Charge</th>
                  <th>Free Delivery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td><strong style={{ color: 'var(--admin-accent)' }}>Priority {r.priority}</strong></td>
                    <td>
                      <strong>{r.name}</strong>
                      {r.description && <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{r.description}</div>}
                    </td>
                    <td><span className="status-pill pill-info">{r.rule_type}</span></td>
                    <td>
                      <code>{r.condition_field} {r.operator} {r.condition_value}</code>
                    </td>
                    <td>₹{r.delivery_charge}</td>
                    <td>
                      <span className={`status-pill ${r.free_delivery === 1 ? 'pill-success' : 'pill-neutral'}`}>
                        {r.free_delivery === 1 ? 'YES (FREE)' : 'NO'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${r.is_active === 1 ? 'pill-success' : 'pill-neutral'}`}>
                        {r.is_active === 1 ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingRule(r);
                            setRuleForm({
                              name: r.name,
                              rule_type: r.rule_type,
                              condition_field: r.condition_field,
                              operator: r.operator,
                              condition_value: r.condition_value,
                              delivery_charge: String(r.delivery_charge),
                              free_delivery: r.free_delivery,
                              priority: r.priority,
                              description: r.description || ''
                            });
                            setRuleModal(true);
                          }}
                          className="btn-admin btn-admin-outline btn-admin-sm"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(r.id)}
                          className="btn-admin btn-admin-danger btn-admin-sm"
                        >
                          <Trash2 size={14} />
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

      {/* Tab 2: Pincodes & Serviceability */}
      {activeTab === 'pincodes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                placeholder="Search pincode, city, or state..."
                value={pinSearch}
                onChange={(e) => setPinSearch(e.target.value)}
                className="admin-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setBulkModal(true)} className="btn-admin btn-admin-outline">
                <Upload size={14} />
                <span>Bulk Import</span>
              </button>
              <button
                onClick={() => {
                  setEditingPincode(null);
                  setPinForm({
                    pincode: '',
                    city: '',
                    district: '',
                    state: 'Tamil Nadu',
                    zone_id: zones[0]?.id || '',
                    is_serviceable: 1,
                    cod_available: 1,
                    delivery_charge: '40',
                    min_delivery_days: '2',
                    max_delivery_days: '5'
                  });
                  setPincodeModal(true);
                }}
                className="btn-admin btn-admin-primary"
              >
                <Plus size={16} />
                <span>Add Single Pincode</span>
              </button>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pincode</th>
                  <th>City / District</th>
                  <th>State</th>
                  <th>Zone</th>
                  <th>Serviceable</th>
                  <th>COD Allowed</th>
                  <th>Charge</th>
                  <th>Est. Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pincodes.map(p => (
                  <tr key={p.id}>
                    <td><strong style={{ fontSize: '1rem' }}>{p.pincode}</strong></td>
                    <td>{p.city} ({p.district})</td>
                    <td>{p.state}</td>
                    <td>{p.zone_name || 'Standard'}</td>
                    <td>
                      <span className={`status-pill ${p.is_serviceable === 1 ? 'pill-success' : 'pill-danger'}`}>
                        {p.is_serviceable === 1 ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${p.cod_available === 1 ? 'pill-success' : 'pill-neutral'}`}>
                        {p.cod_available === 1 ? 'COD YES' : 'ONLINE ONLY'}
                      </span>
                    </td>
                    <td>₹{p.delivery_charge}</td>
                    <td>{p.min_delivery_days}–{p.max_delivery_days} days</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingPincode(p);
                            setPinForm({
                              pincode: p.pincode,
                              city: p.city,
                              district: p.district,
                              state: p.state,
                              zone_id: p.zone_id || '',
                              is_serviceable: p.is_serviceable,
                              cod_available: p.cod_available,
                              delivery_charge: String(p.delivery_charge),
                              min_delivery_days: String(p.min_delivery_days),
                              max_delivery_days: String(p.max_delivery_days)
                            });
                            setPincodeModal(true);
                          }}
                          className="btn-admin btn-admin-outline btn-admin-sm"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePincode(p.id)}
                          className="btn-admin btn-admin-danger btn-admin-sm"
                        >
                          <Trash2 size={14} />
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

      {/* Tab 3: Delivery Zones */}
      {activeTab === 'zones' && (
        <div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Type</th>
                  <th>States / Territory Covered</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id}>
                    <td><strong>{z.name}</strong></td>
                    <td><span className="status-pill pill-info">{z.zone_type}</span></td>
                    <td>{z.state || 'All States'}</td>
                    <td>{z.description}</td>
                    <td><span className="status-pill pill-success">ACTIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Global Delivery Defaults */}
      {activeTab === 'settings' && (
        <div className="admin-card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '20px' }}>
            Global Fallback Delivery Parameters
          </h3>

          <form onSubmit={handleUpdateSettings}>
            <div style={{ marginBottom: '16px' }}>
              <label className="admin-label">Default Delivery Charge (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={settings.default_delivery_charge || '40.00'}
                onChange={(e) => setSettings({ ...settings, default_delivery_charge: e.target.value })}
                className="admin-input"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="admin-label">Global Free Delivery Order Threshold (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={settings.free_delivery_threshold || '500.00'}
                onChange={(e) => setSettings({ ...settings, free_delivery_threshold: e.target.value })}
                className="admin-input"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="admin-label">Enable Cash on Delivery (COD)</label>
              <select
                value={settings.cod_enabled || 'true'}
                onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.value })}
                className="admin-select"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled Globally</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label className="admin-label">Min Order for COD (₹)</label>
                <input
                  type="number"
                  value={settings.min_cod_order || '200'}
                  onChange={(e) => setSettings({ ...settings, min_cod_order: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="admin-label">Max Order for COD (₹)</label>
                <input
                  type="number"
                  value={settings.max_cod_order || '5000'}
                  onChange={(e) => setSettings({ ...settings, max_cod_order: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-admin btn-admin-primary">
              Save Delivery Defaults
            </button>
          </form>
        </div>
      )}

      {/* Add / Edit Delivery Rule Modal */}
      {ruleModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {editingRule ? 'Edit Delivery Rule' : 'New Delivery Rule'}
              </h3>
              <button onClick={() => setRuleModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRule}>
              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Delivery on 5+ packs"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Condition Field *</label>
                  <select
                    value={ruleForm.condition_field}
                    onChange={(e) => setRuleForm({ ...ruleForm, condition_field: e.target.value, rule_type: e.target.value === 'quantity' ? 'QUANTITY' : 'ORDER_VALUE' })}
                    className="admin-select"
                  >
                    <option value="quantity">Item Quantity</option>
                    <option value="order_value">Cart Order Value (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Operator *</label>
                  <select
                    value={ruleForm.operator}
                    onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value })}
                    className="admin-select"
                  >
                    <option value=">=">&gt;= (At least)</option>
                    <option value="<=">&lt;= (At most)</option>
                    <option value="<">&lt; (Less than)</option>
                    <option value="=">= (Exactly)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Threshold Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5 or 500"
                    value={ruleForm.condition_value}
                    onChange={(e) => setRuleForm({ ...ruleForm, condition_value: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Delivery Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={ruleForm.delivery_charge}
                    onChange={(e) => setRuleForm({ ...ruleForm, delivery_charge: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Free Delivery</label>
                  <select
                    value={ruleForm.free_delivery}
                    onChange={(e) => setRuleForm({ ...ruleForm, free_delivery: parseInt(e.target.value, 10) })}
                    className="admin-select"
                  >
                    <option value={1}>YES - FREE SHIPPING</option>
                    <option value={0}>NO - APPLIED CHARGE</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Priority Order (1 = Highest)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value, 10) })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="admin-label">Public Description / Alert</label>
                <input
                  type="text"
                  placeholder="e.g. Free express delivery on 5+ boxes!"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setRuleModal(false)} className="btn-admin btn-admin-outline">Cancel</button>
                <button type="submit" className="btn-admin btn-admin-primary">Save Delivery Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Pincode Modal */}
      {pincodeModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {editingPincode ? 'Edit Pincode' : 'Register Serviceable Pincode'}
              </h3>
              <button onClick={() => setPincodeModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSavePincode}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">6-digit Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pinForm.pincode}
                    onChange={(e) => setPinForm({ ...pinForm, pincode: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">City *</label>
                  <input
                    type="text"
                    required
                    value={pinForm.city}
                    onChange={(e) => setPinForm({ ...pinForm, city: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">District *</label>
                  <input
                    type="text"
                    required
                    value={pinForm.district}
                    onChange={(e) => setPinForm({ ...pinForm, district: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">State *</label>
                  <input
                    type="text"
                    required
                    value={pinForm.state}
                    onChange={(e) => setPinForm({ ...pinForm, state: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={pinForm.delivery_charge}
                    onChange={(e) => setPinForm({ ...pinForm, delivery_charge: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Min Days</label>
                  <input
                    type="number"
                    value={pinForm.min_delivery_days}
                    onChange={(e) => setPinForm({ ...pinForm, min_delivery_days: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Max Days</label>
                  <input
                    type="number"
                    value={pinForm.max_delivery_days}
                    onChange={(e) => setPinForm({ ...pinForm, max_delivery_days: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={pinForm.is_serviceable === 1}
                    onChange={(e) => setPinForm({ ...pinForm, is_serviceable: e.target.checked ? 1 : 0 })}
                  />
                  <span>Serviceable</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={pinForm.cod_available === 1}
                    onChange={(e) => setPinForm({ ...pinForm, cod_available: e.target.checked ? 1 : 0 })}
                  />
                  <span>COD Available</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setPincodeModal(false)} className="btn-admin btn-admin-outline">Cancel</button>
                <button type="submit" className="btn-admin btn-admin-primary">Save Pincode</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Pincode Modal */}
      {bulkModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '10px' }}>Bulk Import Pincodes</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
              Paste one pincode per line in the format: <code>Pincode, City, State</code>
            </p>

            <form onSubmit={handleBulkImport}>
              <textarea
                rows="6"
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="524001, Nellore, Andhra Pradesh&#10;625001, Madurai, Tamil Nadu"
                className="admin-textarea"
                style={{ marginBottom: '16px', fontFamily: 'monospace' }}
              ></textarea>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setBulkModal(false)} className="btn-admin btn-admin-outline">Cancel</button>
                <button type="submit" className="btn-admin btn-admin-primary">Import Pincodes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
