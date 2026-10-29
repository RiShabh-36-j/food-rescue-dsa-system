import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  MapPin,
  Building2,
  RefreshCw,
  Info,
  ShieldCheck,
  Package,
  Layers,
  ChevronRight,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { MatchRecommendation, Donation, Recipient } from '../types';

interface SmartMatchingPageProps {
  onNavigate: (page: string) => void;
}

export const SmartMatchingPage: React.FC<SmartMatchingPageProps> = ({ onNavigate }) => {
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRunPreview, setHasRunPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection for committing allocations
  const [selectedDonationIds, setSelectedDonationIds] = useState<string[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<{ count: number } | null>(null);

  const runPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      setCommitSuccess(null);
      const data = await api.previewMatching();
      setRecommendations(data);
      setHasRunPreview(true);

      // Default select all recommended matches with quantity > 0
      const eligibleIds = data
        .filter((r) => r.allocated_quantity > 0)
        .map((r) => r.donation.id);
      setSelectedDonationIds(eligibleIds);
    } catch (err: any) {
      setError(err.message || 'Failed to compute smart matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPreview();
  }, []);

  const toggleSelect = (donationId: string) => {
    if (selectedDonationIds.includes(donationId)) {
      setSelectedDonationIds(selectedDonationIds.filter((id) => id !== donationId));
    } else {
      setSelectedDonationIds([...selectedDonationIds, donationId]);
    }
  };

  const handleConfirmAllocations = async () => {
    if (selectedDonationIds.length === 0) return;
    try {
      setCommitting(true);
      setError(null);
      const res = await api.confirmMatching(selectedDonationIds);
      setConfirmModalOpen(false);
      setCommitSuccess({ count: res.committed_count });
      // Refresh matching preview after database updates
      await runPreview();
    } catch (err: any) {
      setError(err.message || 'Failed to commit allocations.');
      setConfirmModalOpen(false);
    } finally {
      setCommitting(false);
    }
  };

  const matchedCount = recommendations.filter((r) => r.allocated_quantity > 0).length;
  const unmatchableCount = recommendations.filter((r) => r.allocated_quantity === 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>DSA Expiry-First Matching Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Redistribution Matching</h2>
          <p className="text-emerald-100/80 text-xs mt-1 max-w-xl">
            Simulates candidate pairing using C++ Min-Heap (earliest expiry first), Dijkstra's shortest road
            paths, and category compatibility before atomic transaction commit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runPreview}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate Matches</span>
          </button>

          {matchedCount > 0 && (
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Confirm Allocations ({selectedDonationIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {commitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                Allocations Successfully Committed to SQLite Database!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Committed {commitSuccess.count} allocation records atomically. Remaining quantities and recipient demands updated.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition"
          >
            View History
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Matching Stats Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Evaluated Candidates</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{recommendations.length}</p>
          <span className="text-[10px] text-slate-400">From Min-Heap Priority Queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-800">Feasible Allocations</span>
          <p className="text-xl font-bold text-emerald-950 mt-0.5">{matchedCount}</p>
          <span className="text-[10px] text-emerald-700">Dijkstra reachable + compatible</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[11px] font-medium text-amber-800">Unmatched Surplus</span>
          <p className="text-xl font-bold text-amber-950 mt-0.5">{unmatchableCount}</p>
          <span className="text-[10px] text-amber-700">Category or route restricted</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Selected for Commit</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{selectedDonationIds.length}</p>
          <span className="text-[10px] text-slate-400">Ready for atomic persistence</span>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            Recommended Allocation Decisions ({recommendations.length})
          </h3>
          <span className="text-xs text-slate-500">
            Preview Mode: No persistent database changes until confirmed
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Executing Min-Heap priority pop & Dijkstra route optimizations in C++...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200 p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">No Pending Donations Found</h4>
            <p className="text-slate-500 mt-1 max-w-md mx-auto">
              All active surplus donations have either already been fully allocated, or all current recipient demands are fulfilled.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const d = rec.donation;
              const r = rec.recipient;
              const isMatch = rec.allocated_quantity > 0;
              const isSelected = selectedDonationIds.includes(d.id);
              const hoursLeft = d.hours_remaining;

              return (
                <div
                  key={`${d.id}-${index}`}
                  className={`bg-white rounded-xl border transition-all p-5 shadow-xs ${
                    isMatch
                      ? isSelected
                        ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                        : 'border-slate-200'
                      : 'border-amber-200 bg-amber-50/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Donation & Recipient Comparison */}
                    <div className="flex-1 space-y-3">
                      {/* Top Header of Match Card */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isMatch && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(d.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        )}
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {d.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            rec.match_status === 'RECOMMENDED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.match_status === 'PARTIALLY_ALLOCATED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.match_status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{hoursLeft > 0 ? `${hoursLeft.toFixed(1)}h left` : 'Expired'}</span>
                        </div>
                      </div>

                      {/* Visual Pair: Donation -> Recipient */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 text-xs">
                        {/* Donation Side */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                            Surplus Food Donation
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{d.food_name}</h4>
                          <div className="text-slate-500">
                            Category: <span className="font-semibold text-slate-700">{d.category}</span>
                          </div>
                          <div className="text-slate-500">
                            Available: <span className="font-bold text-slate-900">{d.quantity} {d.unit}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{d.donor_location} ({d.donor_name})</span>
                          </div>
                        </div>

                        {/* Recipient Side */}
                        {isMatch ? (
                          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                                Optimal Recipient Match
                              </span>
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                {r.priority} PRIORITY
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                            <div className="text-slate-500">
                              Outstanding Demand: <span className="font-bold text-slate-900">{r.current_demand} units</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{r.location}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-700 font-medium">
                              <ArrowRight className="w-3 h-3 text-emerald-600" />
                              <span>Route: {rec.route_path} ({rec.route_distance_km.toFixed(1)} km)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 flex flex-col justify-center text-slate-400">
                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              No Feasible Recipient Found
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              No active recipient accepting '{d.category}' or destinations currently unreachable in the road graph.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Plain-Language DSA Decision Explanation Box */}
                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <p className="text-emerald-900 leading-relaxed font-sans">
                            <span className="font-bold text-emerald-950">Matching Decision Rationale: </span>
                            {rec.explanation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Allocation Quantity Summary Box */}
                    {isMatch && (
                      <div className="lg:w-48 bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex flex-col justify-between shrink-0 text-center">
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-800">
                            Allocated Quantity
                          </span>
                          <p className="text-2xl font-bold text-emerald-950 mt-1">
                            {rec.allocated_quantity}{' '}
                            <span className="text-xs font-normal text-emerald-700">{d.unit}</span>
                          </p>
                          <div className="text-[10px] text-emerald-800 mt-2 space-y-0.5">
                            <div>Leftover Don: {rec.remaining_donation_quantity} {d.unit}</div>
                            <div>Unmet Demand: {rec.remaining_recipient_demand} {d.unit}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleSelect(d.id)}
                          className={`mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                              : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {isSelected ? '✓ Included' : '+ Include'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Commit {selectedDonationIds.length} Food Allocations?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This will execute an atomic SQLite transaction in C++:
              decrementing available donation quantities, fulfilling recipient demands,
              and logging historical allocation entries with shortest Dijkstra routes.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-left text-xs font-mono space-y-1">
              <div className="text-slate-600 font-sans font-bold">Selected Donations:</div>
              <div className="text-emerald-800 font-bold truncate">
                {selectedDonationIds.join(', ')}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Review Again
              </button>
              <button
                type="button"
                disabled={committing}
                onClick={handleConfirmAllocations}
                className="px-5 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 shadow transition disabled:opacity-50"
              >
                {committing ? 'Persisting to SQLite...' : 'Confirm & Commit to Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
