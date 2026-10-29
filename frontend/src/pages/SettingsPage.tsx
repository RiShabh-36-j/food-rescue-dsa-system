import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  School,
  ExternalLink,
  Code2
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsPageProps {
  onDataReset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataReset }) => {
  const [resetting, setResetting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResetData = async () => {
    try {
      setResetting(true);
      setMessage(null);
      const res = await api.resetDemoData();
      setMessage(res.message || 'Dataset successfully reset to demonstration defaults.');
      setConfirmOpen(false);
      onDataReset();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings & Academic Information</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Project credits, runtime system diagnostics, and demonstration data controls
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* College & Department Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Shah & Anchor Kutchhi Engineering College (SAKEC)
            </h3>
            <p className="text-xs text-emerald-800 font-semibold">
              Department of Artificial Intelligence and Data Science (AIDS)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Project Title</span>
            <p className="font-bold text-slate-800">
              Food Rescue Expiry-Time Matching System Using Data Structures and Algorithms
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Academic Level</span>
            <p className="font-bold text-slate-800">
              Second Year (SE) AIDS Microproject • Mumbai University
            </p>
          </div>
        </div>
      </div>

      {/* Backend Diagnostics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-700" />
          <span>System Diagnostics & Engine Architecture</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">DSA Backend</span>
            <span className="font-bold text-slate-800">C++17 Standalone</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Compiler</span>
            <span className="font-bold text-slate-800">GCC 16.2 (MinGW)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Persistence</span>
            <span className="font-bold text-slate-800">SQLite Local DB</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Frontend Port</span>
            <span className="font-bold text-slate-800">Vite (Port 3000)</span>
          </div>
        </div>
      </div>

      {/* Demo Data Reset Control */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Reset Demonstration Dataset</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              Clears test updates and re-seeds the standard synthetic dataset: 12 food donations,
              7 recipient NGOs, 15 road network edges, and baseline history.
            </p>
          </div>

          <button
            onClick={() => setConfirmOpen(true)}
            className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold hover:bg-amber-100 transition shrink-0"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-lg border border-slate-200 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Reset Database to Demo Seed?</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This will restore all 12 sample donations, 7 recipient organizations, and 15 graph routes.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 shadow-xs"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
