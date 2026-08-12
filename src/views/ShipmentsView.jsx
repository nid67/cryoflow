import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export default function ShipmentsView({ onSelectShipment }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    product_category: 'Vaccines',
    product_name: '',
    quantity: 5000,
    shipment_value: 50000,
    origin: '',
    destination: '',
    current_location: '',
    current_temp: 4.0,
    humidity: 50,
    transit_time_hours: 12,
    estimated_arrival: '2026-07-29 12:00 UTC',
    vehicle_number: 'TRK-9901',
    current_status: 'In Transit',
    notes: ''
  });

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getShipments({ search, category, status_filter: statusFilter });
      setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [search, category, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createShipment(formData);
      setIsCreateOpen(false);
      fetchShipments();
    } catch (err) {
      alert('Error creating shipment: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateShipment(editingShipment.id, formData);
      setEditingShipment(null);
      fetchShipments();
    } catch (err) {
      alert('Error updating shipment: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete shipment ${id} from FastAPI backend?`)) {
      try {
        await apiService.deleteShipment(id);
        fetchShipments();
      } catch (err) {
        alert('Error deleting shipment: ' + err.message);
      }
    }
  };

  const openEdit = (s) => {
    setEditingShipment(s);
    setFormData({
      product_category: s.product_category,
      product_name: s.product_name,
      quantity: s.quantity,
      shipment_value: s.shipment_value,
      origin: s.origin,
      destination: s.destination,
      current_location: s.current_location,
      current_temp: s.current_temp,
      humidity: s.humidity,
      transit_time_hours: s.transit_time_hours,
      estimated_arrival: s.estimated_arrival,
      vehicle_number: s.vehicle_number,
      current_status: s.current_status,
      notes: s.notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Shipment Management Module</h1>
          <p className="text-xs text-on-surface-variant mt-1">Complete REST API CRUD operations connected to FastAPI backend.</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              product_category: 'Vaccines',
              product_name: 'mRNA Bio-Doses',
              quantity: 10000,
              shipment_value: 150000,
              origin: 'Frankfurt Hub',
              destination: 'Boston Logistics Depot',
              current_location: 'In Air Transit',
              current_temp: -78.0,
              humidity: 45,
              transit_time_hours: 10,
              estimated_arrival: '2026-07-29 18:00 UTC',
              vehicle_number: 'CARGO-777-AIR',
              current_status: 'In Transit',
              notes: 'Ultra-cold LN2 payload.'
            });
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create New Shipment
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search Shipment ID, Product Name, or Vehicle Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface"
          >
            <option value="All">All Categories</option>
            <option value="Vaccines">Vaccines</option>
            <option value="Dairy">Dairy</option>
            <option value="Quick-Commerce Groceries">Quick-Commerce Groceries</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface"
          >
            <option value="All">All Statuses</option>
            <option value="In Transit">In Transit</option>
            <option value="Warning">Warning</option>
            <option value="Critical Breach">Critical Breach</option>
            <option value="Re-routed">Re-routed</option>
            <option value="Liquidated">Liquidated</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Shipment List Table */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-500">Loading shipments from REST API...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-outline-variant/40 text-on-surface-variant uppercase font-label-md">
                <tr>
                  <th className="p-3">Shipment ID</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Value ($)</th>
                  <th className="p-3">Current Location</th>
                  <th className="p-3">Temp (°C)</th>
                  <th className="p-3">Risk %</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-3 font-bold font-mono text-primary cursor-pointer" onClick={() => onSelectShipment(s.id)}>
                      {s.id}
                    </td>
                    <td className="p-3 font-semibold text-on-surface">{s.product_name}</td>
                    <td className="p-3">{s.product_category}</td>
                    <td className="p-3">{s.quantity.toLocaleString()}</td>
                    <td className="p-3 font-mono">${s.shipment_value.toLocaleString()}</td>
                    <td className="p-3 text-on-surface-variant">{s.current_location}</td>
                    <td className="p-3 font-bold">{s.current_temp > 0 ? `+${s.current_temp}` : s.current_temp}°C</td>
                    <td className="p-3">
                      <span className={`font-bold ${s.spoilage_risk > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {s.spoilage_risk}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        s.current_status === 'Warning' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        s.current_status === 'Critical Breach' ? 'bg-red-100 text-red-900 border-red-300' :
                        s.current_status === 'Re-routed' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                        s.current_status === 'Liquidated' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                        'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        {s.current_status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => onSelectShipment(s.id)}
                        className="px-2.5 py-1 bg-surface border border-outline-variant hover:bg-surface-container text-on-surface text-[11px] font-bold rounded"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="px-2.5 py-1 bg-blue-50 text-[#0065FF] hover:bg-blue-100 text-[11px] font-bold rounded border border-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold rounded border border-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingShipment) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card bg-surface-container-lowest max-w-2xl w-full rounded-2xl p-6 md:p-8 shadow-2xl border border-outline-variant space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
              <h3 className="text-base font-bold text-on-surface">
                {editingShipment ? `Edit Shipment (${editingShipment.id})` : 'Create New Cold Shipment'}
              </h3>
              <button onClick={() => { setIsCreateOpen(false); setEditingShipment(null); }} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={editingShipment ? handleEditSubmit : handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Category</label>
                  <select
                    value={formData.product_category}
                    onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  >
                    <option value="Vaccines">Vaccines</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Quick-Commerce Groceries">Quick-Commerce Groceries</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shipment Value ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={formData.shipment_value}
                    onChange={(e) => setFormData({ ...formData, shipment_value: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Origin</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Location</label>
                  <input
                    type="text"
                    required
                    value={formData.current_location}
                    onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.current_temp}
                    onChange={(e) => setFormData({ ...formData, current_temp: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface font-bold text-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.humidity}
                    onChange={(e) => setFormData({ ...formData, humidity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle No.</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full p-2 border border-outline-variant rounded-lg bg-surface"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0065FF] hover:bg-[#0052cc] text-white font-bold rounded-xl shadow-md transition-all mt-2 cursor-pointer"
              >
                {editingShipment ? 'Save Changes via FastAPI' : 'Initialize Shipment via FastAPI'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
