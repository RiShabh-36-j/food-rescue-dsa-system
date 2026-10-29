import React, { useEffect, useState } from 'react';
import {
  Utensils,
  Package,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats, Donation } from '../types';

interface OverviewPageProps {
  onNavigate: (page: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to C++ backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600">Loading DSA Redistribution Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto my-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-red-900">Backend Connection Error</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  const categoryColors = ['#166534', '#0f766e', '#84a98c', '#ca8a04', '#2563eb', '#9333ea'];
  const urgencyColors: Record<string, string> = {
    'Critical (<= 4h)': '#dc2626',
    'High (4-12h)': '#ea580c',
    'Moderate (12-24h)': '#ca8a04',
    'Low (> 24h)': '#16a34a'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-2.5 py-1 rounded-full bg-emerald-700/80 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
            SAKEC Artificial Intelligence & Data Science
          </span>
          <h2 className="text-2xl font-bold mt-2 tracking-tight">
            Food Rescue Expiry-Time Matching System
          </h2>
          <p className="text-emerald-100/90 text-sm mt-1 leading-relaxed">
            Preventing perishable food waste using algorithmic optimization: C++ Min-Heaps for expiry prioritization,
            Dijkstra's shortest path for urban transit calculation, and hash table caching.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('matching')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-900 rounded-lg text-sm font-bold shadow hover:bg-emerald-50 transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Launch Smart Matching
            </button>
            <button
              onClick={() => onNavigate('visualizer')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700/60 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition border border-emerald-600/50"
            >
              Inspect DSA Execution
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Donations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <Utensils className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.total_donations || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Surplus food batches</p>
        </div>

        {/* Available Quantity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Available Qty</span>
            <Package className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.available_food_quantity ? stats.available_food_quantity.toFixed(1) : 0}
            <span className="text-xs font-normal text-slate-500 ml-1">units</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Ready for redistribution</p>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-medium">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats?.donations_expiring_soon || 0}</p>
          <p className="text-[11px] text-amber-700 mt-1">Critical threshold (&lt;12h)</p>
        </div>

        {/* Successful Allocations */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-medium">Allocations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-950">{stats?.successful_allocations || 0}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Successfully rescued</p>
        </div>

        {/* Total Quantity Donated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Allocated Qty</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.total_food_allocated ? stats.total_food_allocated.toFixed(1) : 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Rate: {stats?.allocation_success_rate ? stats.allocation_success_rate.toFixed(0) : 0}%
          </p>
        </div>

        {/* Registered Recipients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Partner NGOs</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.registered_recipients || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active shelters & banks</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Food Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Food Categories</h3>
              <p className="text-xs text-slate-500">Available surplus by category</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Live Stock
            </span>
          </div>
          <div className="h-56 w-full">
            {stats?.category_chart && stats.category_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.category_chart}
                    dataKey="quantity"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {stats.category_chart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toFixed(1)} units`, 'Quantity']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active category data
              </div>
            )}
          </div>
        </div>

        {/* Expiry Urgency Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Expiry Urgency Distribution</h3>
              <p className="text-xs text-slate-500">Min-Heap prioritized time tiers</p>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Priority Tiers
            </span>
          </div>
          <div className="h-56 w-full">
            {stats?.urgency_chart && stats.urgency_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.urgency_chart} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis dataKey="tier" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.urgency_chart.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={urgencyColors[entry.tier] || '#166534'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No urgency distribution data
              </div>
            )}
          </div>
        </div>

        {/* Donation Status Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Donation Lifecycle Status</h3>
              <p className="text-xs text-slate-500">Database record state breakdown</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              SQLite Audit
            </span>
          </div>
          <div className="h-56 w-full">
            {stats?.status_chart && stats.status_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.status_chart} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#166534" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No donation status records
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Donations & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Donations List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Urgent Donations (Min-Heap Head)</h3>
              <p className="text-xs text-slate-500">
                Donations with closest upcoming expiry ordered deterministically by C++ priority queue
              </p>
            </div>
            <button
              onClick={() => onNavigate('donations')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.urgent_donations && stats.urgent_donations.length > 0 ? (
              stats.urgent_donations.map((d) => {
                const hoursLeft = d.hours_remaining;
                const isCritical = hoursLeft <= 4.0;
                return (
                  <div key={d.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{d.id}</span>
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{d.food_name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {d.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {d.donor_location} ({d.donor_name})
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">
                          {d.quantity} {d.unit} available
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isCritical
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h left` : 'Expired'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No urgent donations currently pending.
              </div>
            )}
          </div>
        </div>

        {/* Recent Redistribution Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Activity</h3>
              <p className="text-xs text-slate-500">Live transaction audit logs</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
            >
              History <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((act, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">{act.title}</span>
                    <span className="text-[10px] text-slate-400">{act.timestamp.split('T')[1]?.substring(0, 5) || ''}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{act.description}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity recorded yet. Run Smart Matching to perform first allocation!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
