import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Info,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Allocation } from '../types';

export const AllocationHistoryPage: React.FC = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal inspection
  const [inspectedAllocation, setInspectedAllocation] = useState<Allocation | null>(null);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllocations();
      setAllocations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch allocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleExportCsv = () => {
    window.open(api.exportAllocationsCsvUrl(), '_blank');
  };

  const filteredAllocations = allocations.filter((a) => {
    const matchSearch =
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.food_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.donor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.recipient_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Allocation Audit History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped transaction log persisted in SQLite local database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllocations}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow hover:bg-emerald-900 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by allocation ID, food name, donor, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading audit records from SQLite...
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            No allocations match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Allocation ID</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Allocated Qty</th>
                  <th className="py-3 px-4">Donor Outlet</th>
                  <th className="py-3 px-4">Recipient NGO</th>
                  <th className="py-3 px-4">Dijkstra Route</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{a.food_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">Donation: {a.donation_id}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      {a.allocated_quantity} <span className="font-normal text-slate-500">{a.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{a.donor_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{a.recipient_name}</td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-medium text-slate-800 truncate max-w-xs" title={a.route_path}>
                        {a.route_path}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.route_distance_km.toFixed(1)} km
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {a.allocated_at ? a.allocated_at.replace('T', ' ').substring(0, 16) : ''}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectedAllocation(a)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded font-semibold text-[11px] transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocation Inspection Modal */}
      {inspectedAllocation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {inspectedAllocation.id}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {inspectedAllocation.food_name}
                </h3>
              </div>
              <button
                onClick={() => setInspectedAllocation(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Donor</span>
                  <span className="font-bold text-slate-800">{inspectedAllocation.donor_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recipient</span>
                  <span className="font-bold text-slate-800">{inspectedAllocation.recipient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Allocated Quantity</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    {inspectedAllocation.allocated_quantity} {inspectedAllocation.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Route Distance</span>
                  <span className="font-bold text-slate-800">{inspectedAllocation.route_distance_km.toFixed(1)} km</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Transit Route Hops</span>
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 font-mono text-[11px]">
                  {inspectedAllocation.route_path}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                  Algorithmic Allocation Explanation
                </span>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-emerald-950 leading-relaxed">
                  {inspectedAllocation.explanation}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-100">
                <span>Timestamp: {inspectedAllocation.allocated_at}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {inspectedAllocation.status}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectedAllocation(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
