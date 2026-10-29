import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  Ban,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Donation, FoodCategory, DonationStatus } from '../types';

export const DonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formFoodName, setFormFoodName] = useState('');
  const [formCategory, setFormCategory] = useState<FoodCategory>('Cooked Meals');
  const [formFoodType, setFormFoodType] = useState('Perishable');
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formUnit, setFormUnit] = useState('kg');
  const [formDonorName, setFormDonorName] = useState('');
  const [formDonorLocation, setFormDonorLocation] = useState('Chembur East');
  const [formHoursRemaining, setFormHoursRemaining] = useState<number>(6);
  const [formStorageNotes, setFormStorageNotes] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<DonationStatus>('AVAILABLE');

  const locations = [
    'SAKEC Campus',
    'Chembur East',
    'Ghatkopar',
    'Kurla',
    'Sion',
    'Dadar',
    'Bandra',
    'Andheri',
    'Vashi',
    'Thane',
    'Isolated Outlet'
  ];

  const categories: FoodCategory[] = [
    'Cooked Meals',
    'Bakery',
    'Fresh Produce',
    'Dairy',
    'Packaged Goods',
    'Beverages'
  ];

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDonations();
      setDonations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const openAddModal = () => {
    setEditingDonation(null);
    const nextId = `D${String(donations.length + 1).padStart(3, '0')}`;
    setFormId(nextId);
    setFormFoodName('');
    setFormCategory('Cooked Meals');
    setFormFoodType('Perishable');
    setFormQuantity(15);
    setFormUnit('kg');
    setFormDonorName('');
    setFormDonorLocation('SAKEC Campus');
    setFormHoursRemaining(4);
    setFormStorageNotes('Keep warm in thermal containers');
    setFormDescription('Surplus afternoon meals prepared for event');
    setFormStatus('AVAILABLE');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Donation) => {
    setEditingDonation(d);
    setFormId(d.id);
    setFormFoodName(d.food_name);
    setFormCategory(d.category as FoodCategory);
    setFormFoodType(d.food_type);
    setFormQuantity(d.quantity);
    setFormUnit(d.unit);
    setFormDonorName(d.donor_name);
    setFormDonorLocation(d.donor_location);
    setFormHoursRemaining(Math.max(1, Math.round(d.hours_remaining || 4)));
    setFormStorageNotes(d.storage_notes || '');
    setFormDescription(d.description || '');
    setFormStatus(d.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFoodName.trim()) {
      setFormError('Food name is required.');
      return;
    }
    if (formQuantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (!formDonorName.trim()) {
      setFormError('Donor organization name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Compute expiry epoch
      const nowEpoch = Math.floor(Date.now() / 1000);
      const expiryEpoch = nowEpoch + Math.round(formHoursRemaining * 3600);
      const expiryDate = new Date(expiryEpoch * 1000).toISOString();

      const payload: Partial<Donation> = {
        id: formId,
        food_name: formFoodName.trim(),
        category: formCategory,
        food_type: formFoodType,
        quantity: Number(formQuantity),
        original_quantity: editingDonation ? editingDonation.original_quantity : Number(formQuantity),
        unit: formUnit,
        donor_name: formDonorName.trim(),
        donor_location: formDonorLocation,
        expiry_time: expiryDate,
        expiry_epoch: expiryEpoch,
        storage_notes: formStorageNotes.trim(),
        status: formStatus,
        description: formDescription.trim()
      };

      if (editingDonation) {
        await api.updateDonation(editingDonation.id, payload);
      } else {
        await api.createDonation(payload);
      }

      setIsModalOpen(false);
      await fetchDonations();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDonation(id);
      setDeleteConfirmId(null);
      await fetchDonations();
    } catch (err: any) {
      alert(`Delete rejected: ${err.message}`);
      setDeleteConfirmId(null);
    }
  };

  const toggleUnavailable = async (d: Donation) => {
    try {
      const nextStatus = d.status === 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE';
      await api.updateDonation(d.id, { ...d, status: nextStatus });
      await fetchDonations();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Filter & Sort
  const filteredDonations = donations
    .filter((d) => {
      const matchSearch =
        d.food_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.donor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.donor_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || d.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'ASC') return a.expiry_epoch - b.expiry_epoch;
      return b.expiry_epoch - a.expiry_epoch;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Food Donation Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register surplus food batches, manage expiry profiles, and maintain SQLite database records
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow hover:bg-emerald-900 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Food Donation
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by food name, donor, location, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
          <option value="FULLY_ALLOCATED">Fully Allocated</option>
          <option value="EXPIRED">Expired</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>

        {/* Sort by Expiry */}
        <button
          onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          title="Toggle Expiry Sort Order"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Sort Expiry: {sortOrder === 'ASC' ? 'Soonest First (Min-Heap)' : 'Furthest First'}</span>
        </button>

        <button
          onClick={fetchDonations}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading donations from database...
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            No donations match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Donation ID</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available / Orig</th>
                  <th className="py-3 px-4">Donor & Location</th>
                  <th className="py-3 px-4">Expiry Timer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.map((d) => {
                  const hoursLeft = d.hours_remaining;
                  const isCritical = hoursLeft <= 4.0 && d.status !== 'EXPIRED' && d.status !== 'FULLY_ALLOCATED';
                  const isHigh = hoursLeft > 4.0 && hoursLeft <= 12.0;

                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCritical ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.id}</td>

                      {/* Food Name */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{d.food_name}</div>
                        {d.description && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                            {d.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                          {d.category}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {d.quantity} <span className="font-normal text-slate-500">{d.unit}</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (d.quantity / (d.original_quantity || d.quantity)) * 100)}%`
                            }}
                          />
                        </div>
                      </td>

                      {/* Donor & Location */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{d.donor_name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{d.donor_location}</span>
                        </div>
                      </td>

                      {/* Expiry Timer */}
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            d.status === 'EXPIRED' || hoursLeft <= 0
                              ? 'bg-red-100 text-red-800'
                              : isCritical
                              ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                              : isHigh
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {hoursLeft <= 0 || d.status === 'EXPIRED' ? 'Expired' : `${hoursLeft.toFixed(1)}h remaining`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {d.expiry_time ? d.expiry_time.replace('T', ' ').substring(0, 16) : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'PARTIALLY_ALLOCATED'
                              ? 'bg-blue-100 text-blue-800'
                              : d.status === 'FULLY_ALLOCATED'
                              ? 'bg-slate-100 text-slate-600'
                              : d.status === 'EXPIRED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => toggleUnavailable(d)}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100"
                          title={d.status === 'UNAVAILABLE' ? 'Mark Available' : 'Mark Unavailable'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(d.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                          title="Delete Donation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingDonation ? `Edit Donation (${editingDonation.id})` : 'Register Food Donation'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Donation ID</label>
                  <input
                    type="text"
                    disabled={!!editingDonation}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FoodCategory)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Food Name / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Vegetable Biryani Portions"
                  value={formFoodName}
                  onChange={(e) => setFormFoodName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="boxes">boxes</option>
                    <option value="packets">packets</option>
                    <option value="portions">portions</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Donor Outlet Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SAKEC Canteen"
                    value={formDonorName}
                    onChange={(e) => setFormDonorName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Graph Node Location</label>
                  <select
                    value={formDonorLocation}
                    onChange={(e) => setFormDonorLocation(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Hours to Expiry (From Now)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formHoursRemaining}
                    onChange={(e) => setFormHoursRemaining(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DonationStatus)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
                    <option value="FULLY_ALLOCATED">Fully Allocated</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Storage Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Keep insulated above 60°C or refrigerated"
                  value={formStorageNotes}
                  onChange={(e) => setFormStorageNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDonation ? 'Update Donation' : 'Register Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-lg border border-slate-200 text-center">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Delete Donation {deleteConfirmId}?</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This will remove the record from SQLite. If allocations are tied to this record, audit constraints will block deletion.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
