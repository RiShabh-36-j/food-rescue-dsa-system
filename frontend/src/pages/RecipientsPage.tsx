import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  Users,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Power,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import { Recipient, RecipientPriority, RecipientStatus } from '../types';

export const RecipientsPage: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('Chembur East');
  const [formAcceptedCategories, setFormAcceptedCategories] = useState<string[]>([
    'Cooked Meals',
    'Bakery'
  ]);
  const [formRequiredQuantity, setFormRequiredQuantity] = useState<number>(30);
  const [formCurrentDemand, setFormCurrentDemand] = useState<number>(30);
  const [formPriority, setFormPriority] = useState<RecipientPriority>('HIGH');
  const [formPeopleServed, setFormPeopleServed] = useState<number>(80);
  const [formStatus, setFormStatus] = useState<RecipientStatus>('ACTIVE');

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

  const availableCategories = [
    'Cooked Meals',
    'Bakery',
    'Fresh Produce',
    'Dairy',
    'Packaged Goods',
    'Beverages'
  ];

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecipients();
      setRecipients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const openAddModal = () => {
    setEditingRecipient(null);
    const nextId = `R${String(recipients.length + 1).padStart(3, '0')}`;
    setFormId(nextId);
    setFormName('');
    setFormContactPerson('');
    setFormPhone('+91 98');
    setFormLocation('Chembur East');
    setFormAcceptedCategories(['Cooked Meals', 'Bakery']);
    setFormRequiredQuantity(40);
    setFormCurrentDemand(40);
    setFormPriority('HIGH');
    setFormPeopleServed(100);
    setFormStatus('ACTIVE');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Recipient) => {
    setEditingRecipient(r);
    setFormId(r.id);
    setFormName(r.name);
    setFormContactPerson(r.contact_person);
    setFormPhone(r.phone || '');
    setFormLocation(r.location);
    setFormAcceptedCategories([...r.accepted_categories]);
    setFormRequiredQuantity(r.required_quantity);
    setFormCurrentDemand(r.current_demand);
    setFormPriority(r.priority);
    setFormPeopleServed(r.people_served);
    setFormStatus(r.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleCategory = (cat: string) => {
    if (formAcceptedCategories.includes(cat)) {
      setFormAcceptedCategories(formAcceptedCategories.filter((c) => c !== cat));
    } else {
      setFormAcceptedCategories([...formAcceptedCategories, cat]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Organization name is required.');
      return;
    }
    if (!formContactPerson.trim()) {
      setFormError('Contact person name is required.');
      return;
    }
    if (formRequiredQuantity <= 0) {
      setFormError('Required quantity must be greater than zero.');
      return;
    }
    if (formAcceptedCategories.length === 0) {
      setFormError('Please select at least one accepted food category.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload: Partial<Recipient> = {
        id: formId,
        name: formName.trim(),
        contact_person: formContactPerson.trim(),
        phone: formPhone.trim(),
        location: formLocation,
        accepted_categories: formAcceptedCategories,
        required_quantity: Number(formRequiredQuantity),
        current_demand: editingRecipient ? Number(formCurrentDemand) : Number(formRequiredQuantity),
        priority: formPriority,
        people_served: Number(formPeopleServed),
        status: formStatus
      };

      if (editingRecipient) {
        await api.updateRecipient(editingRecipient.id, payload);
      } else {
        await api.createRecipient(payload);
      }

      setIsModalOpen(false);
      await fetchRecipients();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActiveStatus = async (r: Recipient) => {
    try {
      const nextStatus = r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.updateRecipient(r.id, { ...r, status: nextStatus });
      await fetchRecipients();
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRecipient(id);
      setDeleteConfirmId(null);
      await fetchRecipients();
    } catch (err: any) {
      alert(`Delete rejected: ${err.message}`);
      setDeleteConfirmId(null);
    }
  };

  // Filter
  const filteredRecipients = recipients.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = selectedPriority === 'ALL' || r.priority === selectedPriority;
    const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recipient Organizations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered NGOs, shelters, food banks, and student food pantries receiving redistributed surplus
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow hover:bg-emerald-900 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Register Recipient
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by NGO name, contact, location, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          onClick={fetchRecipients}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
          title="Refresh Recipients"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recipients Grid Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading recipients from database...
        </div>
      ) : filteredRecipients.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
          No recipient organizations match your search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipients.map((r) => {
            const fulfilledQty = r.required_quantity - r.current_demand;
            const fulfilledPct = Math.min(
              100,
              Math.max(0, (fulfilledQty / r.required_quantity) * 100)
            );

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: ID, Priority, Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {r.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.priority === 'HIGH'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : r.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.priority} PRIORITY
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : r.status === 'FULFILLED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Contact */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{r.name}</h3>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{r.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{r.contact_person} ({r.phone || 'No phone recorded'})</span>
                    </div>
                    {r.people_served > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Serves ~{r.people_served} beneficiaries</span>
                      </div>
                    )}
                  </div>

                  {/* Accepted Categories */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Accepted Food Categories:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.accepted_categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Demand Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Outstanding Demand</span>
                      <span className="font-bold text-slate-900">
                        {r.current_demand} / {r.required_quantity} units
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${fulfilledPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{fulfilledQty.toFixed(1)} fulfilled</span>
                      <span>{fulfilledPct.toFixed(0)}% complete</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleActiveStatus(r)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition ${
                      r.status === 'ACTIVE'
                        ? 'text-slate-500 hover:bg-slate-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                    title="Toggle Status"
                  >
                    <Power className="w-3 h-3" />
                    <span>{r.status === 'ACTIVE' ? 'Set Inactive' : 'Activate'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                      title="Edit Recipient"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(r.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                      title="Delete Recipient"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRecipient ? `Edit Organization (${editingRecipient.id})` : 'Register Recipient Organization'}
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
                  <label className="block text-slate-700 font-semibold mb-1">Recipient ID</label>
                  <input
                    type="text"
                    disabled={!!editingRecipient}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as RecipientPriority)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robin Hood Army Chembur"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunil Sharma"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98201 11223"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Graph Node Location</label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Beneficiaries Served</label>
                  <input
                    type="number"
                    min="0"
                    value={formPeopleServed}
                    onChange={(e) => setFormPeopleServed(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Required Quantity (Total)</label>
                  <input
                    type="number"
                    min="1"
                    value={formRequiredQuantity}
                    onChange={(e) => setFormRequiredQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                {editingRecipient && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Current Outstanding Demand</label>
                    <input
                      type="number"
                      min="0"
                      value={formCurrentDemand}
                      onChange={(e) => setFormCurrentDemand(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Multi-category tags */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Accepted Food Categories</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableCategories.map((cat) => {
                    const selected = formAcceptedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          selected
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
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
                  {submitting ? 'Saving...' : editingRecipient ? 'Update Recipient' : 'Register Recipient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-lg border border-slate-200 text-center">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Delete Recipient {deleteConfirmId}?</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This will remove the organization. If allocation records exist for this recipient, the database audit check will reject the deletion.
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
